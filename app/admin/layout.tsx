import type React from "react"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { LogOut, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import AdminNavLinkClient from "@/components/admin/admin-nav-link"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Double check admin status on server component level
  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_current_user_admin")
  if (rpcError || !isAdmin) {
    redirect("/dashboard?error=unauthorized") // Or a specific unauthorized page
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Link href="/admin" className="flex items-center space-x-2">
                <Image
                  src="/images/infolab-logo.png"
                  alt="Infolab Logo"
                  width={120}
                  height={38}
                  className="h-8 w-auto"
                />
                <span className="text-xl font-semibold text-gray-700 dark:text-gray-200">Panel Administratora</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Główny Panel
                </Link>
              </Button>
              <form action={logout}>
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="h-4 w-4 mr-2" />
                  Wyloguj
                </Button>
              </form>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex space-x-8">
              <AdminNavLinkClient href="/admin" iconName="Users">
                Użytkownicy
              </AdminNavLinkClient>
              <AdminNavLinkClient href="/admin/phones" iconName="Phone">
                Telefony Opiekunów
              </AdminNavLinkClient>
            </div>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
