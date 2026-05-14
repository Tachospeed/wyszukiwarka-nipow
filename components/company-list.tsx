"use client"

import { useRouter } from "next/navigation"

interface Company {
  id: string
  title: string
  nip: string
  phone: string
  email: string
  contactPerson: string
  process: string
  owner: string
  status: string
  value: number
}

interface CompanyListProps {
  companies: Company[]
  nip: string
}

export default function CompanyList({ companies, nip }: CompanyListProps) {
  const router = useRouter()

  const handleCompanyClick = (companyId: string) => {
    router.push(`/dashboard?nip=${nip}&companyId=${companyId}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {companies.map((company) => (
        <div
          key={company.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleCompanyClick(company.id)}
        >
          <h3 className="font-semibold text-lg mb-2">{company.title}</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {company.status === "Brak dealów" ? (
              <>
                <p className="text-orange-600 font-medium">⚠️ Brak dealów</p>
                <p>Firma bez przypisanych dealów</p>
              </>
            ) : (
              <>
                <p>Status: {company.status}</p>
                <p>Proces: {company.process}</p>
                <p>Kwota: {company.value.toLocaleString("pl-PL")} zł</p>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
