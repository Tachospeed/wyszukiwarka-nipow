"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server" // For auth checks
import { createAdminClient } from "@/lib/supabase/admin" // For admin operations
import type { User } from "@supabase/supabase-js"

export interface UserWithRole extends User {
  role: string | null
  status: string
}

async function verifyAdmin() {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Użytkownik nie jest zalogowany.")
  }

  // Use the admin client to check roles (bypasses RLS)
  const adminClient = createAdminClient()
  const { data: roleData, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (roleError) {
    console.error("Error checking admin status:", roleError)

    // If no role found, check if this is the first user and auto-assign admin
    const { data: authUsersResponse, error: listError } = await adminClient.auth.admin.listUsers()

    if (!listError && authUsersResponse.users.length === 1 && authUsersResponse.users[0].id === user.id) {
      // This is the only user in the system, make them admin automatically
      const { error: insertError } = await adminClient.from("user_roles").insert({ user_id: user.id, role: "admin" })

      if (!insertError) {
        console.log("First user automatically granted admin role")
        return user
      }
    }

    throw new Error("Nie można zweryfikować uprawnień administratora.")
  }

  if (!roleData || roleData.role !== "admin") {
    throw new Error("Użytkownik nie ma uprawnień do wykonania tej akcji.")
  }

  return user
}

export async function getAllUsersWithRoles(): Promise<UserWithRole[]> {
  await verifyAdmin()
  const adminClient = createAdminClient()

  const { data: authUsersResponse, error: authUsersError } = await adminClient.auth.admin.listUsers()

  if (authUsersError) {
    console.error("Error listing auth users:", authUsersError)
    throw new Error(`Nie udało się pobrać listy użytkowników: ${authUsersError.message}`)
  }

  const authUsers = authUsersResponse.users

  if (authUsers.length === 0) {
    return []
  }

  const userIds = authUsers.map((u) => u.id)
  const { data: rolesData, error: rolesError } = await adminClient
    .from("user_roles")
    .select("user_id, role") // Usuń phone_number
    .in("user_id", userIds)

  if (rolesError) {
    console.error("Error fetching user roles:", rolesError)
    throw new Error(`Nie udało się pobrać ról użytkowników: ${rolesError.message}`)
  }

  const rolesMap = new Map((rolesData || []).map((r) => [r.user_id, r.role]))

  const usersWithRoles = authUsers.map((authUser) => {
    let status = "Aktywny"
    if (!authUser.email_confirmed_at) {
      status = "Niepotwierdzony"
    }

    return {
      ...authUser,
      role: rolesMap.get(authUser.id) || "user", // Default to 'user' if no role found
      status,
    } as UserWithRole
  })

  return usersWithRoles
}

// Funkcja do generowania losowego hasła
function generateRandomPassword(length = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

export async function createUserWithPassword(
  email: string,
  role: "admin" | "user",
): Promise<{ success: boolean; message: string; password?: string; error?: any }> {
  await verifyAdmin()
  const adminClient = createAdminClient()

  // Tworzenie użytkownika z hasłem
  const password = generateRandomPassword()

  const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Automatycznie potwierdź email
  })

  if (createError) {
    console.error("Error creating user:", createError)
    return {
      success: false,
      message: `Nie udało się utworzyć użytkownika: ${createError.message}`,
      error: createError,
    }
  }

  if (createData && createData.user) {
    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: createData.user.id, role: role })

    if (roleError) {
      console.error("Error setting role for created user:", roleError)
      await adminClient.auth.admin.deleteUser(createData.user.id)
      return {
        success: false,
        message: `Użytkownik został utworzony, ale nie udało się ustawić roli: ${roleError.message}`,
        error: roleError,
      }
    }
    revalidatePath("/admin")
    return {
      success: true,
      message: `Użytkownik ${email} został pomyślnie utworzony z rolą ${role === "admin" ? "administrator" : "użytkownik"}.`,
      password: password,
    }
  }

  return { success: false, message: "Nie udało się utworzyć użytkownika z nieznanego powodu." }
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; message: string; error?: any }> {
  await verifyAdmin()
  const adminClient = createAdminClient()

  // First, delete from user_roles
  const { error: roleDeleteError } = await adminClient.from("user_roles").delete().eq("user_id", userId)

  if (roleDeleteError) {
    console.error(`Error deleting user role for ${userId}:`, roleDeleteError)
    // Continue anyway to try to delete the auth user
  }

  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (authDeleteError) {
    console.error(`Error deleting user ${userId} from auth:`, authDeleteError)
    return {
      success: false,
      message: `Nie udało się usunąć użytkownika: ${authDeleteError.message}`,
      error: authDeleteError,
    }
  }

  revalidatePath("/admin")
  return { success: true, message: "Użytkownik został pomyślnie usunięty." }
}

export async function resetUserPassword(
  userId: string,
): Promise<{ success: boolean; message: string; password?: string; error?: any }> {
  await verifyAdmin()
  const adminClient = createAdminClient()

  // Pobierz dane użytkownika przed usunięciem
  const { data: userData, error: getUserError } = await adminClient.auth.admin.getUserById(userId)
  if (getUserError || !userData.user) {
    return {
      success: false,
      message: `Nie udało się pobrać danych użytkownika: ${getUserError?.message}`,
      error: getUserError,
    }
  }

  const userEmail = userData.user.email
  if (!userEmail) {
    return {
      success: false,
      message: "Użytkownik nie ma przypisanego adresu email",
    }
  }

  // Pobierz rolę użytkownika
  const { data: roleData, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single()

  const userRole = roleData?.role || "user"

  // Usuń starego użytkownika
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
  if (deleteError) {
    console.error(`Error deleting user ${userId}:`, deleteError)
    return {
      success: false,
      message: `Nie udało się usunąć starego użytkownika: ${deleteError.message}`,
      error: deleteError,
    }
  }

  // Usuń rolę ze starego użytkownika
  await adminClient.from("user_roles").delete().eq("user_id", userId)

  // Utwórz nowego użytkownika z tym samym emailem
  const newPassword = generateRandomPassword()
  const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
    email: userEmail,
    password: newPassword,
    email_confirm: true,
  })

  if (createError) {
    console.error("Error creating new user:", createError)
    return {
      success: false,
      message: `Nie udało się utworzyć nowego użytkownika: ${createError.message}`,
      error: createError,
    }
  }

  if (createData && createData.user) {
    // Ustaw rolę dla nowego użytkownika
    const { error: newRoleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: createData.user.id, role: userRole })

    if (newRoleError) {
      console.error("Error setting role for new user:", newRoleError)
      await adminClient.auth.admin.deleteUser(createData.user.id)
      return {
        success: false,
        message: `Nowy użytkownik został utworzony, ale nie udało się ustawić roli: ${newRoleError.message}`,
        error: newRoleError,
      }
    }

    revalidatePath("/admin")
    return {
      success: true,
      message: `Hasło dla użytkownika ${userEmail} zostało zresetowane. Nowe hasło:`,
      password: newPassword,
    }
  }

  return { success: false, message: "Nie udało się zresetować hasła z nieznanego powodu." }
}

export async function updateUserRole(
  userId: string,
  newRole: "admin" | "user",
): Promise<{ success: boolean; message: string; error?: any }> {
  await verifyAdmin()
  const adminClient = createAdminClient()

  // Sprawdź czy użytkownik już ma rolę w tabeli
  const { data: existingRole, error: checkError } = await adminClient
    .from("user_roles")
    .select("user_id, role")
    .eq("user_id", userId)
    .single()

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 = no rows returned, inne błędy są problemem
    console.error(`Error checking existing role for user ${userId}:`, checkError)
    return {
      success: false,
      message: `Nie udało się sprawdzić istniejącej roli: ${checkError.message}`,
      error: checkError,
    }
  }

  let updateError: any = null

  if (existingRole) {
    // Użytkownik ma już rolę, zaktualizuj ją
    const { error } = await adminClient
      .from("user_roles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("user_id", userId)

    updateError = error
  } else {
    // Użytkownik nie ma roli, wstaw nową
    const { error } = await adminClient.from("user_roles").insert({ user_id: userId, role: newRole })

    updateError = error
  }

  if (updateError) {
    console.error(`Error updating role for user ${userId}:`, updateError)
    return { success: false, message: `Nie udało się zaktualizować roli: ${updateError.message}`, error: updateError }
  }

  revalidatePath("/admin")
  return { success: true, message: "Rola użytkownika została pomyślnie zaktualizowana." }
}
