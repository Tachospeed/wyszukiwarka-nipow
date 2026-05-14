"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Helper to verify admin status
async function verifyAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const adminClient = createAdminClient()
  const { data: roleData, error } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).single()

  if (error || roleData?.role !== "admin") {
    throw new Error("Not authorized")
  }
}

export interface PhoneMapping {
  email: string
  phone_number: string
  created_at: string
  updated_at: string
}

export async function getPhoneMappings(): Promise<PhoneMapping[]> {
  await verifyAdmin()
  const adminClient = createAdminClient()

  const { data, error } = await adminClient.from("owner_phone_numbers").select("*").order("email", { ascending: true })

  if (error) {
    console.error("Error fetching phone mappings:", error)
    throw new Error("Could not fetch phone mappings.")
  }

  return data || []
}

export async function addOrUpdatePhoneMapping(
  email: string,
  phoneNumber: string,
): Promise<{ success: boolean; message: string }> {
  await verifyAdmin()
  const adminClient = createAdminClient()

  if (!email || !phoneNumber) {
    return { success: false, message: "Email i numer telefonu są wymagane." }
  }

  const { error } = await adminClient.from("owner_phone_numbers").upsert({ email, phone_number: phoneNumber })

  if (error) {
    console.error("Error upserting phone mapping:", error)
    return { success: false, message: `Błąd zapisu: ${error.message}` }
  }

  revalidatePath("/admin/phones")
  return { success: true, message: "Zapisano pomyślnie." }
}

export async function deletePhoneMapping(email: string): Promise<{ success: boolean; message: string }> {
  await verifyAdmin()
  const adminClient = createAdminClient()

  const { error } = await adminClient.from("owner_phone_numbers").delete().eq("email", email)

  if (error) {
    console.error("Error deleting phone mapping:", error)
    return { success: false, message: `Błąd usuwania: ${error.message}` }
  }

  revalidatePath("/admin/phones")
  return { success: true, message: "Usunięto pomyślnie." }
}
