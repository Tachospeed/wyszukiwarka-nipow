"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, Phone, LayoutDashboard } from "lucide-react"

interface AdminNavLinkProps {
  href: string
  children: React.ReactNode
  iconName: "Users" | "Phone" | "LayoutDashboard"
}

export default function AdminNavLinkClient({ href, children, iconName }: AdminNavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  // Mapuj nazwy ikon na komponenty
  const getIcon = (name: string) => {
    switch (name) {
      case "Users":
        return Users
      case "Phone":
        return Phone
      case "LayoutDashboard":
        return LayoutDashboard
      default:
        return Users
    }
  }

  const Icon = getIcon(iconName)

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700",
      )}
    >
      <Icon className="h-4 w-4 mr-2" />
      {children}
    </Link>
  )
}
