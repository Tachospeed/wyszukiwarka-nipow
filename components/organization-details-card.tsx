import type React from "react"
import {
  Building,
  Phone,
  Mail,
  User,
  UserCheck,
  Users,
  FileText,
  MapPin,
  Calendar,
  Briefcase,
  Target,
  Crown,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ContactPerson {
  id: string
  name: string
  email: string
  phone: string
  primary_email?: string
}

interface OrganizationOwner {
  id: string
  name: string
  email: string
  phone: string
}

interface DealOwner {
  id: string
  name: string
  email: string
  phone: string
}

interface Deal {
  id: string
  title: string
  status: string
  value: number
  currency: string
  stage_name: string
  pipeline_name: string
  owner_name: string
  owner: DealOwner | null
  person_name: string
  person_email: string
  person_phone: string
  add_time: string
  update_time: string
}

interface PipedriveOrganization {
  id: string
  name: string
  nip: string
  phone: string
  email: string
  address: string
  owner: OrganizationOwner | null
  contactPersons: ContactPerson[]
  deals: Deal[]
  add_time: string
  update_time: string
}

interface OrganizationDetailsCardProps {
  organization: PipedriveOrganization
}

export default function OrganizationDetailsCard({ organization }: OrganizationDetailsCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "aktywny":
      case "open":
        return "bg-green-100 text-green-800"
      case "wygrany":
      case "won":
        return "bg-blue-100 text-blue-800"
      case "przegrany":
      case "lost":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Karta organizacji */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col items-center pb-6 pt-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-4">
            <Building className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{organization.name}</h2>
          <p className="text-gray-500">Organizacja</p>
        </CardHeader>

        <CardContent className="p-6">
          {/* Dane organizacji */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Building className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Dane organizacji</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <DetailItem
                icon={<Building className="h-5 w-5 text-blue-600" />}
                label="Nazwa organizacji"
                value={organization.name}
              />
              <DetailItem icon={<FileText className="h-5 w-5 text-blue-600" />} label="NIP" value={organization.nip} />
              {organization.phone && (
                <DetailItem
                  icon={<Phone className="h-5 w-5 text-green-600" />}
                  label="Telefon"
                  value={organization.phone}
                />
              )}
              {organization.email && (
                <DetailItem
                  icon={<Mail className="h-5 w-5 text-purple-600" />}
                  label="Email"
                  value={organization.email}
                />
              )}
              {organization.address && (
                <DetailItem
                  icon={<MapPin className="h-5 w-5 text-red-600" />}
                  label="Adres"
                  value={organization.address}
                />
              )}
            </div>
          </div>

          {/* Właściciel organizacji w CRM */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Crown className="h-5 w-5 text-orange-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Właściciel organizacji (CRM)</h3>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              {organization.owner ? (
                <div className="space-y-3">
                  <div className="flex items-center mb-2">
                    <Crown className="h-4 w-4 text-orange-600 mr-2" />
                    <span className="font-medium text-gray-700">Opiekun w systemie CRM</span>
                    <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                      CRM Owner
                    </Badge>
                  </div>
                  <div className="ml-6 space-y-2">
                    <DetailItem
                      icon={<User className="h-4 w-4 text-orange-600" />}
                      label="Imię i nazwisko"
                      value={organization.owner.name}
                      compact
                    />
                    <DetailItem
                      icon={<Mail className="h-4 w-4 text-purple-600" />}
                      label="Email"
                      value={organization.owner.email}
                      compact
                    />
                    <DetailItem
                      icon={<Phone className="h-4 w-4 text-green-600" />}
                      label="Telefon"
                      value={organization.owner.phone || "Brak danych"}
                      compact
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Crown className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Brak przypisanego właściciela w CRM</p>
                </div>
              )}
            </div>
          </div>

          {/* Osoby kontaktowe (pracownicy firmy) */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">
                Osoby kontaktowe ({organization.contactPersons?.length || 0})
              </h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {organization.contactPersons && organization.contactPersons.length > 0 ? (
                organization.contactPersons.map((person, index) => (
                  <div key={person.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center mb-2">
                      <User className="h-4 w-4 text-indigo-600 mr-2" />
                      <span className="font-medium text-gray-700">Osoba kontaktowa {index + 1}</span>
                      <Badge variant="outline" className="ml-2">
                        Kontakt
                      </Badge>
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
                ))
              ) : (
                <div className="text-center py-4">
                  <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Brak osób kontaktowych podpiętych do tej organizacji</p>
                </div>
              )}
            </div>
          </div>

          {/* Podsumowanie */}
          <div>
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Podsumowanie</h3>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">
                  Organizacja z {organization.deals.length} dealami i {organization.contactPersons?.length || 0} osobami
                  kontaktowymi
                </p>
                <p>
                  {organization.deals.length > 0
                    ? `Łączna wartość dealów: ${organization.deals
                        .reduce((sum, deal) => sum + deal.value, 0)
                        .toLocaleString("pl-PL")} PLN`
                    : "Brak aktywnych dealów w systemie."}
                </p>
                {organization.owner && <p className="mt-1">Opiekun w CRM: {organization.owner.name}</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deale */}
      {organization.deals.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Briefcase className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Deale ({organization.deals.length})</h3>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {organization.deals.map((deal, index) => (
                <div key={deal.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{deal.title}</h4>
                      <div className="flex items-center mt-2 space-x-2">
                        <Badge className={getStatusColor(deal.status)}>{deal.status}</Badge>
                        <Badge variant="outline">{deal.pipeline_name}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {deal.value.toLocaleString("pl-PL")} {deal.currency}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem
                      icon={<Target className="h-4 w-4 text-amber-600" />}
                      label="Etap"
                      value={deal.stage_name}
                      compact
                    />

                    {/* Właściciel dealu z pełnymi danymi kontaktowymi */}
                    {deal.owner ? (
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 md:col-span-2">
                        <div className="flex items-center mb-3">
                          <Crown className="h-4 w-4 text-orange-600 mr-2" />
                          <span className="font-medium text-gray-700">Właściciel dealu (CRM)</span>
                          <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                            Deal Owner
                          </Badge>
                        </div>
                        <div className="ml-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <DetailItem
                            icon={<User className="h-4 w-4 text-orange-600" />}
                            label="Imię i nazwisko"
                            value={deal.owner.name}
                            compact
                          />
                          <DetailItem
                            icon={<Mail className="h-4 w-4 text-purple-600" />}
                            label="Email"
                            value={deal.owner.email || "Brak danych"}
                            compact
                          />
                          <DetailItem
                            icon={<Phone className="h-4 w-4 text-green-600" />}
                            label="Telefon"
                            value={deal.owner.phone || "Brak danych"}
                            compact
                          />
                        </div>
                      </div>
                    ) : (
                      <DetailItem
                        icon={<UserCheck className="h-4 w-4 text-gray-400" />}
                        label="Opiekun dealu"
                        value="Brak przypisanego opiekuna"
                        compact
                      />
                    )}

                    {deal.person_name && (
                      <DetailItem
                        icon={<User className="h-4 w-4 text-indigo-600" />}
                        label="Osoba kontaktowa w dealu"
                        value={deal.person_name}
                        compact
                      />
                    )}
                    {deal.person_email && (
                      <DetailItem
                        icon={<Mail className="h-4 w-4 text-purple-600" />}
                        label="Email kontaktowy"
                        value={deal.person_email}
                        compact
                      />
                    )}
                    {deal.person_phone && (
                      <DetailItem
                        icon={<Phone className="h-4 w-4 text-green-600" />}
                        label="Telefon kontaktowy"
                        value={deal.person_phone}
                        compact
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface DetailItemProps {
  icon: React.ReactNode
  label: string
  value: string | number | null | undefined
  compact?: boolean
}

function DetailItem({ icon, label, value, compact = false }: DetailItemProps) {
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
