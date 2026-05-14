"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Login error:", error.message)
      return { success: false, error: error.message }
    }

    if (data.user) {
      console.log("User logged in successfully:", data.user.email)
      return { success: true }
    }

    return { success: false, error: "Nieznany błąd podczas logowania" }
  } catch (error) {
    console.error("Login exception:", error)
    return { success: false, error: "Wystąpił błąd podczas logowania" }
  }
}

export async function register(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error("Registration error:", error.message)
      return { success: false, error: error.message }
    }

    if (data.user) {
      console.log("User registered successfully:", data.user.email)
      return { success: true }
    }

    return { success: false, error: "Nieznany błąd podczas rejestracji" }
  } catch (error) {
    console.error("Registration exception:", error)
    return { success: false, error: "Wystąpił błąd podczas rejestracji" }
  }
}

export async function logout() {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Logout error:", error.message)
    }
  } catch (error) {
    console.error("Logout exception:", error)
  }

  redirect("/")
}

export async function isAuthenticated(): Promise<boolean> {
  const supabase = createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Auth check error:", error.message)
      return false
    }

    return !!user
  } catch (error) {
    console.error("Auth check exception:", error)
    return false
  }
}

export async function getCurrentUser() {
  const supabase = createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Get user error:", error.message)
      return null
    }

    return user
  } catch (error) {
    console.error("Get user exception:", error)
    return null
  }
}
