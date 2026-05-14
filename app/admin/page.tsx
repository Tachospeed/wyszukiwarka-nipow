import { getAllUsersWithRoles } from "@/lib/actions/admin"
import UserManagementTable from "@/components/admin/user-management-table"
import { Toaster } from "@/components/ui/toaster"

export default async function AdminUsersPage() {
  const users = await getAllUsersWithRoles()

  return (
    <div className="space-y-6">
      <UserManagementTable initialUsers={users} />
      <Toaster />
    </div>
  )
}
