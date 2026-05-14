"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, PlusCircle, Trash2, Edit, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { addOrUpdatePhoneMapping, deletePhoneMapping, type PhoneMapping } from "@/lib/actions/phones"

interface PhoneManagementTableProps {
  initialMappings: PhoneMapping[]
}

export default function PhoneManagementTable({ initialMappings }: PhoneManagementTableProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false)
  const [selectedMapping, setSelectedMapping] = useState<PhoneMapping | null>(null)
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  const openFormDialog = (mapping: PhoneMapping | null = null) => {
    if (mapping) {
      setSelectedMapping(mapping)
      setEmail(mapping.email)
      setPhoneNumber(mapping.phone_number)
      setIsEditing(true)
    } else {
      setSelectedMapping(null)
      setEmail("")
      setPhoneNumber("")
      setIsEditing(false)
    }
    setIsFormDialogOpen(true)
  }

  const openConfirmDeleteDialog = (mapping: PhoneMapping) => {
    setSelectedMapping(mapping)
    setIsConfirmDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    if (!email.trim() || !phoneNumber.trim()) {
      toast({
        title: "Błąd",
        description: "Email i numer telefonu są wymagane.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const result = await addOrUpdatePhoneMapping(email.trim(), phoneNumber.trim())
      toast({
        title: result.success ? "Sukces" : "Błąd",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
      if (result.success) {
        setIsFormDialogOpen(false)
        setEmail("")
        setPhoneNumber("")
        router.refresh()
      }
    })
  }

  const handleDelete = async () => {
    if (!selectedMapping) return
    startTransition(async () => {
      const result = await deletePhoneMapping(selectedMapping.email)
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

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Numery Telefonów Opiekunów</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Zarządzaj numerami telefonów przypisanymi do adresów e-mail opiekunów z Pipedrive.
            </p>
          </div>
          <Button size="sm" onClick={() => openFormDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Dodaj numer
          </Button>
        </div>
      </div>

      {initialMappings.length === 0 ? (
        <div className="p-8 text-center">
          <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Brak numerów telefonów</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Dodaj pierwszy numer telefonu dla opiekuna z Pipedrive.
          </p>
          <Button onClick={() => openFormDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Dodaj pierwszy numer
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email opiekuna</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Ostatnia aktualizacja</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialMappings.map((mapping) => (
              <TableRow key={mapping.email}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    {mapping.email}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-green-600" />
                    <span className="font-medium">{mapping.phone_number}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-500">{new Date(mapping.updated_at).toLocaleString("pl-PL")}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Otwórz menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openFormDialog(mapping)}>
                        <Edit className="mr-2 h-4 w-4" /> Edytuj
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/50"
                        onClick={() => openConfirmDeleteDialog(mapping)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Usuń
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edytuj numer telefonu" : "Dodaj nowy numer telefonu"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Zmień numer telefonu dla wybranego opiekuna."
                : "Dodaj numer telefonu dla opiekuna z Pipedrive. Użyj dokładnie tego samego adresu e-mail, który ma opiekun w systemie Pipedrive."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email opiekuna</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isEditing}
                placeholder="opiekun@firma.pl"
              />
              {!isEditing && (
                <p className="text-xs text-gray-500">Wprowadź dokładnie taki sam email, jaki ma opiekun w Pipedrive</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Numer telefonu</Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+48 123 456 789"
              />
              <p className="text-xs text-gray-500">Wprowadź numer w formacie, w jakim ma być wyświetlany</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSave} disabled={isPending || !email.trim() || !phoneNumber.trim()}>
              {isPending ? "Zapisywanie..." : isEditing ? "Zapisz zmiany" : "Dodaj numer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń numer telefonu</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć numer telefonu dla <strong>{selectedMapping?.email}</strong>?
              <br />
              <br />
              Po usunięciu, w aplikacji będzie wyświetlany numer z Pipedrive (jeśli istnieje) lub "Brak danych".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteDialogOpen(false)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Usuwanie..." : "Usuń numer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
