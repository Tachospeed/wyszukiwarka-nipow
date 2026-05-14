import type React from "react"
import {
  Briefcase,
  Phone,
  Mail,
  User,
  UserCheck,
  Activity,
  DollarSign,
  FileText,
  Building,
  Users,
  FileSpreadsheet,
  GitBranch,
  GitPullRequest,
  Calendar,
  Target,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface ContactPerson {
  id: string
  name: string
  email: string
  phone: string
  primary_email?: string
}

interface Company {
  id: string
  title: string
  nip: string
  phone: string
  email: string
  contactPerson: string
  contactPersons: ContactPerson[]
  process: string
  pipelineName: string
  stageName: string
  owner: string
  status: string
  value: number
}

interface CompanyDetailsCardProps {
  company: Company
}

export default function CompanyDetailsCard({ company }: CompanyDetailsCardProps) {
  // Ensure company.id is a string
  const companyId = String(company.id)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col items-center pb-6 pt-8 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mb-4">
          <Briefcase className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{company.title}</h2>
        <p className="text-gray-500">Szczegóły firmy</p>
      </CardHeader>

      <CardContent className="p-6">
        {/* Grupa 1: Dane firmy */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Building className="h-5 w-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Dane firmy</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <DetailItem
              icon={<Briefcase className="h-5 w-5 text-blue-600" />}
              label="Nazwa firmy"
              value={company.title}
            />
            <DetailItem icon={<FileText className="h-5 w-5 text-blue-600" />} label="NIP" value={company.nip} />
            {(company.phone || company.email) && (
              <>
                {company.phone && (
                  <DetailItem
                    icon={<Phone className="h-5 w-5 text-green-600" />}
                    label="Telefon firmy"
                    value={company.phone}
                  />
                )}
                {company.email && (
                  <DetailItem
                    icon={<Mail className="h-5 w-5 text-purple-600" />}
                    label="Email firmy"
                    value={company.email}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Grupa 2: Osoby kontaktowe */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">
              Osoby kontaktowe ({company.contactPersons?.length || 0})
            </h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {company.contactPersons && company.contactPersons.length > 0 ? (
              company.contactPersons.map((person, index) => {
                // Ensure person.id is a string before using startsWith
                const personId = String(person.id)
                const isOwner = personId.startsWith("owner_")
                return (
                  <div key={personId} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center mb-2">
                      {isOwner ? (
                        <UserCheck className="h-4 w-4 text-orange-600 mr-2" />
                      ) : (
                        <User className="h-4 w-4 text-indigo-600 mr-2" />
                      )}
                      <span className="font-medium text-gray-700">
                        {isOwner ? "Właściciel organizacji" : `Osoba kontaktowa ${index + 1}`}
                      </span>
                      {isOwner && (
                        <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">Owner</span>
                      )}
                    </div>
                    <div className="ml-6 space-y-2">
                      <DetailItem
                        icon={<User className="h-4 w-4 text-indigo-600" />}
                        label="Imię i nazwisko"
                        value={person.name || "Brak danych"}
                        compact
                      />
                      <DetailItem
                        icon={<Mail className="h-4 w-4 text-purple-600" />}
                        label="Email"
                        value={person.email || "Brak danych"}
                        compact
                      />
                      <DetailItem
                        icon={<Phone className="h-4 w-4 text-green-600" />}
                        label="Telefon"
                        value={person.phone || "Brak danych"}
                        compact
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-4">
                <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Brak osób kontaktowych podpiętych do tej firmy</p>
              </div>
            )}
          </div>
        </div>

        {/* Grupa 3: Informacje o dealu/procesie */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FileSpreadsheet className="h-5 w-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">
              {company.status === "Brak dealów" ? "Status organizacji" : "Informacje o dealu"}
            </h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {company.status === "Brak dealów" ? (
              <div className="text-center py-4">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-600 font-medium">Brak dealów podpiętych do tej firmy</span>
                </div>
                <p className="text-sm text-gray-500">
                  Firma została znaleziona w systemie, ale nie ma przypisanych żadnych dealów.
                </p>
              </div>
            ) : (
              <>
                <DetailItem
                  icon={<Activity className="h-5 w-5 text-red-600" />}
                  label="Status dealu"
                  value={company.status}
                />
                <DetailItem
                  icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
                  label="Wartość dealu"
                  value={`${company.value.toLocaleString("pl-PL")} zł`}
                />
                <DetailItem
                  icon={<GitBranch className="h-5 w-5 text-amber-600" />}
                  label="Pipeline"
                  value={company.pipelineName}
                />
                <DetailItem
                  icon={<GitPullRequest className="h-5 w-5 text-amber-600" />}
                  label="Etap procesu"
                  value={company.stageName}
                />
                <DetailItem
                  icon={<Target className="h-5 w-5 text-blue-600" />}
                  label="Pełny proces"
                  value={company.process}
                />
                <DetailItem
                  icon={<UserCheck className="h-5 w-5 text-teal-600" />}
                  label="Opiekun dealu"
                  value={company.owner}
                />
                {company.contactPerson && company.contactPerson !== "Brak danych" && (
                  <DetailItem
                    icon={<User className="h-5 w-5 text-indigo-600" />}
                    label="Główna osoba kontaktowa w dealu"
                    value={company.contactPerson}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Grupa 4: Podsumowanie */}
        <div>
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Podsumowanie</h3>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Typ rekordu: {companyId.startsWith("org_") ? "Organizacja" : "Deal"}</p>
              <p>
                {company.status === "Brak dealów"
                  ? `Organizacja ${company.title} została znaleziona w systemie z ${company.contactPersons?.length || 0} osobami kontaktowymi, ale nie ma przypisanych dealów.`
                  : `Deal "${company.title}" o wartości ${company.value.toLocaleString("pl-PL")} zł jest obecnie w stanie "${company.status}" w etapie "${company.stageName}".`}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface DetailItemProps {
  icon: React.ReactNode
  label: string
  value: string | number | null | undefined
  compact?: boolean
}

function DetailItem({ icon, label, value, compact = false }: DetailItemProps) {
  // Upewnij się, że value jest stringiem
  const displayValue =
    typeof value === "string" ? value : value === null || value === undefined ? "Brak danych" : String(value)

  return (
    <div className="flex items-start">
      <div
        className={`flex-shrink-0 ${
          compact ? "w-6 h-6" : "w-10 h-10"
        } rounded-full bg-gray-100 flex items-center justify-center mr-4`}
      >
        {icon}
      </div>
      <div>
        <p className={`${compact ? "text-xs" : "text-sm"} font-medium text-gray-500`}>{label}</p>
        <p className={`${compact ? "text-sm" : "text-base"} font-semibold`}>{displayValue}</p>
      </div>
    </div>
  )
}
