import { Suspense } from "react"
import { redirect } from "next/navigation"
import Image from "next/image"
import { LogOut, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import NipSearchForm from "@/components/nip-search-form"
import { logout } from "@/lib/auth"
import { searchCompanyByNip, getCompanyDetails } from "@/lib/pipedrive"
import { createClient } from "@/lib/supabase/server"
import OrganizationDetailsCard from "@/components/organization-details-card"
import CompanyDetailsCard from "@/components/company-details-card"
import Link from "next/link"

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { nip?: string; companyId?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: isAdmin } = await supabase.rpc("is_current_user_admin")

  const { nip, companyId } = searchParams

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Image src="/images/infolab-logo.png" alt="Infolab Logo" width={120} height={38} className="h-8 w-auto" />
          </div>
          <form action={logout}>
            <Button variant="outline" size="sm" type="submit">
              <LogOut className="h-4 w-4 mr-2" />
              Wyloguj
            </Button>
          </form>
          {isAdmin && (
            <Button variant="default" size="sm" asChild className="bg-orange-500 hover:bg-orange-600">
              <Link href="/admin">
                <Crown className="h-4 w-4 mr-2" />
                Panel Admina
              </Link>
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white shadow rounded-xl p-6">
          <NipSearchForm initialNip={nip} />
        </div>

        {nip && (
          <Suspense fallback={<CompanyDetailsSkeleton />}>
            {companyId ? <CompanyDetailsSection companyId={companyId} /> : <CompanySearchSection nip={nip} />}
          </Suspense>
        )}
      </main>
    </div>
  )
}

async function CompanySearchSection({ nip }: { nip: string }) {
  try {
    const organizations = await searchCompanyByNip(nip)

    if (!organizations || organizations.length === 0) {
      return (
        <div className="bg-white shadow rounded-xl p-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900">Nie znaleziono organizacji</h2>
            <p className="mt-2 text-gray-600">Nie znaleziono organizacji o numerze NIP: {nip}</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">
            Znalezione organizacje ({organizations.length}) dla NIP: {nip}
          </h2>
        </div>

        {organizations.map((organization, index) => (
          <div key={organization.id}>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-700">
                {organizations.length > 1 ? `Organizacja ${index + 1}: ${organization.name}` : organization.name}
              </h3>
            </div>
            <OrganizationDetailsCard organization={organization} />
          </div>
        ))}
      </div>
    )
  } catch (error) {
    return (
      <div className="bg-white shadow rounded-xl p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-red-600">Wystąpił błąd podczas wyszukiwania</h2>
          <p className="mt-2 text-gray-600">Spróbuj ponownie później lub skontaktuj się z administratorem.</p>
        </div>
      </div>
    )
  }
}

async function CompanyDetailsSection({ companyId }: { companyId: string }) {
  try {
    const company = await getCompanyDetails(companyId)

    if (!company) {
      return (
        <div className="bg-white shadow rounded-xl p-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900">Nie znaleziono szczegółów firmy</h2>
            <p className="mt-2 text-gray-600">Nie znaleziono szczegółów dla wybranej firmy.</p>
          </div>
        </div>
      )
    }

    return <CompanyDetailsCard company={company} />
  } catch (error) {
    return (
      <div className="bg-white shadow rounded-xl p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-red-600">Wystąpił błąd podczas pobierania danych</h2>
          <p className="mt-2 text-gray-600">Spróbuj ponownie później lub skontaktuj się z administratorem.</p>
        </div>
      </div>
    )
  }
}

function CompanyDetailsSkeleton() {
  return (
    <div className="bg-white shadow rounded-xl p-6 animate-pulse">
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 bg-gray-200 rounded-full mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-40"></div>
      </div>
      <div className="space-y-6">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-start">
            <div className="w-8 h-8 bg-gray-200 rounded mr-4"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
