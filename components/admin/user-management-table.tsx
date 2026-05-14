"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, PlusCircle, Trash2, KeyRound, UserCog, Mail, Copy, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  createUserWithPassword,
  deleteUserAccount,
  resetUserPassword,
  updateUserRole,
  type UserWithRole,
} from "@/lib/actions/admin"
import { Badge } from "@/components/ui/badge"

interface UserManagementTableProps {
  initialUsers: UserWithRole[]
}

export default function UserManagementTable({ initialUsers }: UserManagementTableProps) {
  const [users, setUsers] = useState<UserWithRole[]>(initialUsers)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  // States for dialogs
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false)
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false)
  const [isPasswordDisplayDialogOpen, setIsPasswordDisplayDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user")
  const [newRoleForSelectedUser, setNewRoleForSelectedUser] = useState<"user" | "admin">("user")
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordDialogTitle, setPasswordDialogTitle] = useState("")

  const handleCreateUser = async () => {
    startTransition(async () => {
      const result = await createUserWithPassword(newUserEmail, newUserRole)
      toast({
        title: result.success ? "Sukces" : "Błąd",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
      if (result.success) {
        setIsAddUserDialogOpen(false)
        setNewUserEmail("")
        setNewUserRole("user")
        if (result.password) {
          setGeneratedPassword(result.password)
          setPasswordDialogTitle(`Hasło dla nowego użytkownika: ${newUserEmail}`)
          setIsPasswordDisplayDialogOpen(true)
        }
        router.refresh()
      }
    })
  }

  const handleDeleteUser = async (userId: string) => {
    startTransition(async () => {
      const result = await deleteUserAccount(userId)
      toast({
        title: result.success ? "Sukces" : "Błąd",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
      if (result.success) {
        setIsConfirmDeleteDialogOpen(false)
        router.refresh()
      }
    })
  }

  const handleResetPassword = async (userId: string, userEmail: string) => {
    startTransition(async () => {
      const result = await resetUserPassword(userId)
      toast({
        title: result.success ? "Sukces" : "Błąd",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
      if (result.success && result.password) {
        setGeneratedPassword(result.password)
        setPasswordDialogTitle(`Nowe hasło dla użytkownika: ${userEmail}`)
        setIsPasswordDisplayDialogOpen(true)
        router.refresh()
      }
    })
  }

  const handleUpdateRole = async () => {
    if (!selectedUser) return
    startTransition(async () => {
      const result = await updateUserRole(selectedUser.id, newRoleForSelectedUser)
      toast({
        title: result.success ? "Sukces" : "Błąd",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
      if (result.success) {
        setIsEditRoleDialogOpen(false)
        router.refresh()
      }
    })
  }

  const openEditRoleDialog = (user: UserWithRole) => {
    setSelectedUser(user)
    setNewRoleForSelectedUser(user.role === "admin" ? "admin" : "user")
    setIsEditRoleDialogOpen(true)
  }

  const openConfirmDeleteDialog = (user: UserWithRole) => {
    setSelectedUser(user)
    setIsConfirmDeleteDialogOpen(true)
  }

  const copyPasswordToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword)
      toast({
        title: "Skopiowano",
        description: "Hasło zostało skopiowane do schowka",
      })
    } catch (err) {
      toast({
        title: "Błąd",
        description: "Nie udało się skopiować hasła",
        variant: "destructive",
      })
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "Aktywny":
        return "Aktywny"
      case "Niepotwierdzony":
        return "Niepotwierdzony"
      default:
        return status
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator"
      case "user":
        return "Użytkownik"
      default:
        return role
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Użytkownicy</h2>
        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Dodaj Użytkownika
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Dodaj Nowego Użytkownika</DialogTitle>
              <DialogDescription>Utwórz nowego użytkownika z automatycznie wygenerowanym hasłem.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="col-span-3"
                  placeholder="uzytkownik@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Rola
                </Label>
                <Select value={newUserRole} onValueChange={(value: "user" | "admin") => setNewUserRole(value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Wybierz rolę" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Użytkownik</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md col-span-4">
                <strong>Uwaga:</strong> Zostanie wygenerowane losowe hasło, które będzie wyświetlone po utworzeniu
                konta.
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" onClick={handleCreateUser} disabled={isPending || !newUserEmail}>
                {isPending ? "Tworzenie..." : "Utwórz Użytkownika"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Rola</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Dołączenia</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                {user.email}
              </TableCell>
              <TableCell>
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                  className={user.role === "admin" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                >
                  {getRoleText(user.role || "user")}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={user.status === "Aktywny" ? "default" : "destructive"}
                  className={user.status === "Aktywny" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                >
                  {getStatusText(user.status)}
                </Badge>
              </TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString("pl-PL")}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Otwórz menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openEditRoleDialog(user)}>
                      <UserCog className="mr-2 h-4 w-4" /> Zmień Rolę
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleResetPassword(user.id, user.email!)}>
                      <KeyRound className="mr-2 h-4 w-4" /> Reset Hasła
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/50"
                      onClick={() => openConfirmDeleteDialog(user)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Usuń Użytkownika
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień Rolę dla {selectedUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="newRole">Nowa Rola</Label>
            <Select
              value={newRoleForSelectedUser}
              onValueChange={(value: "user" | "admin") => setNewRoleForSelectedUser(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz nową rolę" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Użytkownik</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleUpdateRole} disabled={isPending}>
              {isPending ? "Zapisywanie..." : "Zapisz Rolę"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń Użytkownika: {selectedUser?.email}?</DialogTitle>
            <DialogDescription>
              Ta akcja nie może być cofnięta. Spowoduje to trwałe usunięcie konta użytkownika i wszystkich powiązanych
              danych.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && handleDeleteUser(selectedUser.id)}
              disabled={isPending}
            >
              {isPending ? "Usuwanie..." : "Usuń Użytkownika"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Display Dialog */}
      <Dialog open={isPasswordDisplayDialogOpen} onOpenChange={setIsPasswordDisplayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{passwordDialogTitle}</DialogTitle>
            <DialogDescription>
              Skopiuj to hasło i przekaż użytkownikowi. Hasło zostanie wyświetlone tylko raz.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Input
                type={showPassword ? "text" : "password"}
                value={generatedPassword}
                readOnly
                className="font-mono"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={copyPasswordToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              <strong>Ważne:</strong> To hasło zostanie wyświetlone tylko raz. Upewnij się, że je skopiowałeś przed
              zamknięciem tego okna.
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPasswordDisplayDialogOpen(false)}>Zamknij</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
