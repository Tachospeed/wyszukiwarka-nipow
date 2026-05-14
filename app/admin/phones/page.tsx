import { getPhoneMappings } from "@/lib/actions/phones"
import PhoneManagementTable from "@/components/admin/phone-management-table"
import { Toaster } from "@/components/ui/toaster"

export default async function AdminPhonesPage() {
  const mappings = await getPhoneMappings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Zarządzanie Numerami Telefonów Opiekunów
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Zarządzaj numerami telefonów przypisanymi do adresów e-mail opiekunów z Pipedrive.
        </p>
      </div>
      <PhoneManagementTable initialMappings={mappings} />
      <Toaster />
    </div>
  )
}
