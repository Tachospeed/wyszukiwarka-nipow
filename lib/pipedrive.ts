"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Funkcja pomocnicza do sprawdzania autentykacji
async function verifyAuthentication() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized: User must be logged in to access this resource")
  }

  return user
}

// Sprawdź czy jesteśmy w trybie development
function isDevelopment() {
  return process.env.NODE_ENV === "development" || process.env.PIPEDRIVE_DEBUG === "true"
}

// Funkcje pomocnicze do debugowania - działają tylko w development
function generateRequestId() {
  return `req_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`
}

async function logApiRequest(requestId: string, method: string, url: string, options?: any) {
  if (!isDevelopment()) return

  // Ukryj klucz API w logach
  const sanitizedUrl = url.replace(/api_token=[^&]+/, "api_token=***HIDDEN***")
  console.log(`[PIPEDRIVE][${requestId}][REQUEST] ${method} ${sanitizedUrl}`)
  if (options) {
    console.log(`[PIPEDRIVE][${requestId}][REQUEST_OPTIONS]`, JSON.stringify(options, null, 2))
  }
}

async function logApiResponse(
  requestId: string,
  url: string,
  status: number,
  statusText: string,
  responseTime: number,
) {
  if (!isDevelopment()) return

  // Ukryj klucz API w logach
  const sanitizedUrl = url.replace(/api_token=[^&]+/, "api_token=***HIDDEN***")
  console.log(
    `[PIPEDRIVE][${requestId}][RESPONSE] ${sanitizedUrl} - Status: ${status} ${statusText} (${responseTime}ms)`,
  )
}

async function logApiError(requestId: string, url: string, error: any, responseTime: number) {
  if (!isDevelopment()) return

  // Ukryj klucz API w logach
  const sanitizedUrl = url.replace(/api_token=[^&]+/, "api_token=***HIDDEN***")
  console.error(`[PIPEDRIVE][${requestId}][ERROR] ${sanitizedUrl} - ${error.message} (${responseTime}ms)`)
  if (error.stack) {
    console.error(`[PIPEDRIVE][${requestId}][ERROR_STACK]`, error.stack)
  }
}

async function logApiData(requestId: string, label: string, data: any) {
  if (!isDevelopment()) return

  console.log(`[PIPEDRIVE][${requestId}][DATA][${label}]`, JSON.stringify(data, null, 2))
}

async function logDebug(message: string, data?: any) {
  if (!isDevelopment()) return

  if (data) {
    console.log(`[PIPEDRIVE][DEBUG] ${message}`, data)
  } else {
    console.log(`[PIPEDRIVE][DEBUG] ${message}`)
  }
}

async function logInfo(message: string) {
  if (!isDevelopment()) return

  console.log(`[PIPEDRIVE][INFO] ${message}`)
}

async function logWarning(message: string) {
  if (!isDevelopment()) return

  console.warn(`[PIPEDRIVE][WARNING] ${message}`)
}

async function logError(message: string, error?: any) {
  if (!isDevelopment()) return

  if (error) {
    console.error(`[PIPEDRIVE][ERROR] ${message}`, error)
  } else {
    console.error(`[PIPEDRIVE][ERROR] ${message}`)
  }
}

// Funkcja pomocnicza do bezpiecznego konwertowania danych kontaktowych na stringi
function safeContactValue(contactData: any): string {
  if (!contactData) return ""
  if (typeof contactData === "string") return contactData
  if (Array.isArray(contactData)) {
    if (contactData.length === 0) return ""
    const firstItem = contactData[0]
    if (typeof firstItem === "string") return firstItem
    return firstItem?.value || ""
  }
  if (typeof contactData === "object" && contactData.value) {
    return contactData.value
  }
  return ""
}

// Funkcja pomocnicza do bezpiecznego pobierania ID z obiektu lub wartości
function safeGetId(idValue: any): string | null {
  if (!idValue) return null
  if (typeof idValue === "string" || typeof idValue === "number") return String(idValue)
  if (typeof idValue === "object" && idValue.id) return String(idValue.id)
  return null
}

// Funkcja pomocnicza do wykonywania zapytań z logowaniem
async function fetchWithLogging(url: string, options?: RequestInit) {
  const requestId = generateRequestId()
  const method = options?.method || "GET"
  const startTime = Date.now()

  try {
    await logApiRequest(requestId, method, url, options)

    const response = await fetch(url, options)
    const responseTime = Date.now() - startTime

    await logApiResponse(requestId, url, response.status, response.statusText, responseTime)

    // Loguj nagłówki odpowiedzi tylko w development
    if (isDevelopment()) {
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })
      console.log(`[PIPEDRIVE][${requestId}][RESPONSE_HEADERS]`, JSON.stringify(headers, null, 2))
    }

    if (!response.ok) {
      let errorText = ""
      try {
        const errorData = await response.text()
        errorText = errorData
        if (isDevelopment()) {
          try {
            const errorJson = JSON.parse(errorData)
            console.error(`[PIPEDRIVE][${requestId}][ERROR_RESPONSE]`, JSON.stringify(errorJson, null, 2))
          } catch {
            console.error(`[PIPEDRIVE][${requestId}][ERROR_RESPONSE]`, errorData)
          }
        }
      } catch (e) {
        if (isDevelopment()) {
          console.error(`[PIPEDRIVE][${requestId}][ERROR_PARSING]`, e)
        }
      }

      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    await logApiData(requestId, "RESPONSE_BODY", data)

    return { data, requestId }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    await logApiError(requestId, url, error, responseTime)
    throw error
  }
}

// Pobierz bazowy URL API z zmiennych środowiskowych lub użyj domyślnego
function getPipedriveApiBaseUrl() {
  const baseUrl = process.env.PIPEDRIVE_API_BASE_URL
  if (!baseUrl) {
    logWarning("PIPEDRIVE_API_BASE_URL not set, using default URL")
    return "https://api.pipedrive.com/api"
  }
  // Usuń końcowe slash jeśli istnieje
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
}

// Sprawdź i pobierz klucz API
function getPipedriveApiKey() {
  const apiKey = process.env.PIPEDRIVE_API_KEY

  if (!apiKey) {
    logError("PIPEDRIVE_API_KEY environment variable is not set")
    throw new Error("Brak klucza API Pipedrive")
  }

  // Sprawdź, czy klucz API nie jest placeholderem z .env.local
  if (apiKey === "your_pipedrive_api_key_here") {
    logError("PIPEDRIVE_API_KEY contains placeholder value from .env.local")
    throw new Error("Klucz API Pipedrive zawiera wartość placeholder. Ustaw prawidłowy klucz API.")
  }

  // Sprawdź, czy klucz API ma odpowiednią długość (typowy klucz Pipedrive ma około 40 znaków)
  if (apiKey.length < 20) {
    logWarning("PIPEDRIVE_API_KEY seems too short, might be invalid")
  }

  // Loguj pierwsze i ostatnie 4 znaki klucza API dla celów debugowania tylko w development
  if (isDevelopment()) {
    const maskedKey =
      apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "***INVALID***"
    console.log(`[PIPEDRIVE][CONFIG] Using API key: ${maskedKey}`)
  }

  return apiKey
}

// Użyj funkcji do pobrania bazowego URL API
const PIPEDRIVE_API_URL = getPipedriveApiBaseUrl()

export interface ContactPerson {
  id: string
  name: string
  email: string
  phone: string
  primary_email?: string
}

export interface OrganizationOwner {
  id: string
  name: string
  email: string
  phone: string
}

export interface DealOwner {
  id: string
  name: string
  email: string
  phone: string
}

export interface Deal {
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

export interface PipedriveOrganization {
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

// Funkcja pomocnicza do pobierania danych osoby kontaktowej
async function getPersonDetails(personId: string, apiKey: string) {
  await logDebug(`Fetching person details for ID=${personId}`)

  try {
    const personUrl = new URL(`${PIPEDRIVE_API_URL}/v1/persons/${personId}`)
    personUrl.searchParams.append("api_token", apiKey)

    const { data: personData, requestId: personRequestId } = await fetchWithLogging(personUrl.toString())

    if (!personData.data) {
      await logWarning(`No person data found for ID=${personId}`)
      return { name: "", email: "", phone: "" }
    }

    // Loguj pełne dane osoby dla debugowania
    await logDebug("Person data:", personData.data)

    const name = personData.data.name || ""

    // Pobierz email - sprawdź różne możliwe formaty
    let email = safeContactValue(personData.data.email)
    if (!email && personData.data.emails) {
      email = safeContactValue(personData.data.emails)
    }

    // Pobierz telefon - sprawdź różne możliwe formaty
    let phone = safeContactValue(personData.data.phone)
    if (!phone && personData.data.phones) {
      phone = safeContactValue(personData.data.phones)
    }

    await logInfo(`Found person: ${name}, Email: ${email}, Phone: ${phone}`)

    return { name, email, phone }
  } catch (error) {
    await logError("Error fetching person details:", error)
    return { name: "", email: "", phone: "" }
  }
}

// Funkcja pomocnicza do pobierania wszystkich osób kontaktowych z organizacji
async function getOrganizationPersons(orgId: string, apiKey: string): Promise<ContactPerson[]> {
  await logDebug(`Fetching contact persons for organization ID=${orgId}`)

  try {
    const personsUrl = new URL(`${PIPEDRIVE_API_URL}/v1/organizations/${orgId}/persons`)
    personsUrl.searchParams.append("api_token", apiKey)

    const { data: personsData, requestId: personsRequestId } = await fetchWithLogging(personsUrl.toString())

    if (!personsData.data || personsData.data.length === 0) {
      await logInfo(`No contact persons found for organization ${orgId}`)
      return []
    }

    await logInfo(`Found ${personsData.data.length} contact persons for organization ${orgId}`)

    const contactPersons: ContactPerson[] = []

    for (const person of personsData.data) {
      await logDebug(`Processing contact person: ID=${person.id}, Name=${person.name}`)

      const contactPerson: ContactPerson = {
        id: String(person.id),
        name: person.name || "",
        email: safeContactValue(person.email) || person.primary_email || "",
        phone: safeContactValue(person.phone) || "",
        primary_email: person.primary_email || "",
      }

      await logDebug("Added contact person:", contactPerson)
      contactPersons.push(contactPerson)
    }

    return contactPersons
  } catch (error) {
    await logError("Error fetching organization contact persons:", error)
    return []
  }
}

// Funkcja pomocnicza do pobierania właściciela organizacji (z CRM)
async function getOrganizationOwner(ownerId: string, apiKey: string): Promise<OrganizationOwner | null> {
  await logDebug(`Fetching organization owner (CRM user) for ID=${ownerId}`)

  try {
    const ownerUrl = new URL(`${PIPEDRIVE_API_URL}/v1/users/${ownerId}`)
    ownerUrl.searchParams.append("api_token", apiKey)

    const { data: ownerData } = await fetchWithLogging(ownerUrl.toString())
    const pipedriveOwner = ownerData.data

    if (!pipedriveOwner) {
      await logWarning(`No organization owner data found for ID=${ownerId}`)
      return null
    }

    const owner: OrganizationOwner = {
      id: String(pipedriveOwner.id),
      name: pipedriveOwner.name || "",
      email: pipedriveOwner.email || "",
      phone: "Brak danych", // Domyślna wartość
    }

    // Nadpisz numer telefonu wartością z lokalnej bazy danych, jeśli istnieje
    if (owner.email) {
      const adminClient = createAdminClient()
      const { data: phoneData } = await adminClient
        .from("owner_phone_numbers")
        .select("phone_number")
        .eq("email", owner.email)
        .single()

      if (phoneData && phoneData.phone_number) {
        owner.phone = phoneData.phone_number
        await logInfo(`Overridden phone for ${owner.email} with local value: ${owner.phone}`)
      } else {
        // Jeśli nie ma w naszej bazie, użyj numeru z Pipedrive jako fallback
        owner.phone = safeContactValue(pipedriveOwner.phone) || "Brak danych"
      }
    } else {
      // Jeśli nie ma emaila, po prostu użyj numeru z Pipedrive
      owner.phone = safeContactValue(pipedriveOwner.phone) || "Brak danych"
    }

    await logInfo("Found organization owner:", owner)
    return owner
  } catch (error) {
    await logError("Error fetching organization owner:", error)
    return null
  }
}

// Funkcja pomocnicza do pobierania właściciela dealu (z CRM)
async function getDealOwner(ownerId: string, apiKey: string): Promise<DealOwner | null> {
  await logDebug(`Fetching deal owner (CRM user) for ID=${ownerId}`)

  try {
    const ownerUrl = new URL(`${PIPEDRIVE_API_URL}/v1/users/${ownerId}`)
    ownerUrl.searchParams.append("api_token", apiKey)

    const { data: ownerData } = await fetchWithLogging(ownerUrl.toString())
    const pipedriveOwner = ownerData.data

    if (!pipedriveOwner) {
      await logWarning(`No deal owner data found for ID=${ownerId}`)
      return null
    }

    const owner: DealOwner = {
      id: String(pipedriveOwner.id),
      name: pipedriveOwner.name || "",
      email: pipedriveOwner.email || "",
      phone: "Brak danych", // Domyślna wartość
    }

    // Nadpisz numer telefonu wartością z lokalnej bazy danych, jeśli istnieje
    if (owner.email) {
      const adminClient = createAdminClient()
      const { data: phoneData } = await adminClient
        .from("owner_phone_numbers")
        .select("phone_number")
        .eq("email", owner.email)
        .single()

      if (phoneData && phoneData.phone_number) {
        owner.phone = phoneData.phone_number
        await logInfo(`Overridden phone for deal owner ${owner.email} with local value: ${owner.phone}`)
      } else {
        owner.phone = safeContactValue(pipedriveOwner.phone) || "Brak danych"
      }
    } else {
      owner.phone = safeContactValue(pipedriveOwner.phone) || "Brak danych"
    }

    await logInfo("Found deal owner:", owner)
    return owner
  } catch (error) {
    await logError("Error fetching deal owner:", error)
    return null
  }
}

// Funkcja pomocnicza do pobierania danych pipeline i stage
async function getPipelineAndStageDetails(pipelineId: string, stageId: string, apiKey: string) {
  await logDebug(`Fetching pipeline details for ID=${pipelineId} and stage ID=${stageId}`)

  try {
    // Pobierz dane pipeline
    const pipelineUrl = new URL(`${PIPEDRIVE_API_URL}/v1/pipelines/${pipelineId}`)
    pipelineUrl.searchParams.append("api_token", apiKey)

    const { data: pipelineData, requestId: pipelineRequestId } = await fetchWithLogging(pipelineUrl.toString())

    if (!pipelineData.data) {
      await logWarning(`No pipeline data found for ID=${pipelineId}`)
      return { pipelineName: "Nieznany", stageName: "Nieznany etap", processName: "Nieznany proces" }
    }

    // Loguj podstawowe informacje o pipeline
    await logDebug(`Pipeline: ${pipelineData.data.name}, ID: ${pipelineData.data.id}`)

    const pipelineName = pipelineData.data.name || "Nieznany"
    let stageName = "Nieznany etap"

    // Spróbuj znaleźć etap w danych pipeline
    if (pipelineData.data.stages && Array.isArray(pipelineData.data.stages)) {
      const stageObj = pipelineData.data.stages.find((s: any) => s.id === Number.parseInt(stageId) || s.id === stageId)
      if (stageObj) {
        stageName = stageObj.name
      } else {
        await logWarning(`Stage ID=${stageId} not found in pipeline stages`)
      }
    } else {
      await logWarning("Pipeline stages not found or not an array")

      // Jeśli nie znaleziono etapów w pipeline, pobierz dane etapu bezpośrednio
      try {
        const stageUrl = new URL(`${PIPEDRIVE_API_URL}/v1/stages/${stageId}`)
        stageUrl.searchParams.append("api_token", apiKey)

        const { data: stageData, requestId: stageRequestId } = await fetchWithLogging(stageUrl.toString())

        if (stageData.data && stageData.data.name) {
          stageName = stageData.data.name
          await logInfo(`Found stage name: ${stageName}`)
        }
      } catch (error) {
        await logError("Error fetching stage details:", error)
      }
    }

    const processName = `${pipelineName} - ${stageName}`
    await logInfo(`Pipeline: ${pipelineName}, Stage: ${stageName}`)

    return { pipelineName, stageName, processName }
  } catch (error) {
    await logError("Error fetching pipeline details:", error)
    return { pipelineName: "Nieznany", stageName: "Nieznany etap", processName: "Nieznany proces" }
  }
}

// Funkcja pomocnicza do pobierania nazwy użytkownika (deprecated - używaj getDealOwner)
async function getUserName(userId: string, apiKey: string): Promise<string> {
  await logDebug(`Fetching user details for ID=${userId}`)

  try {
    const userUrl = new URL(`${PIPEDRIVE_API_URL}/v1/users/${userId}`)
    userUrl.searchParams.append("api_token", apiKey)

    const { data: userData, requestId: userRequestId } = await fetchWithLogging(userUrl.toString())

    if (userData.data) {
      const userName = userData.data.name || ""
      await logInfo(`User: ${userName}`)
      return userName
    }
    return ""
  } catch (error) {
    await logError("Error fetching user details:", error)
    return ""
  }
}

// Funkcja do pobierania dealów powiązanych z organizacją
async function getOrganizationDeals(orgId: string, apiKey: string): Promise<Deal[]> {
  await logDebug(`Fetching deals for organization ID=${orgId}`)

  try {
    // Używamy /v2/deals z parametrem org_id zgodnie z dokumentacją
    const dealsUrl = new URL(`${PIPEDRIVE_API_URL}/v2/deals`)
    dealsUrl.searchParams.append("api_token", apiKey)
    dealsUrl.searchParams.append("org_id", orgId)
    // Domyślnie API zwraca wszystkie deale które nie są usunięte

    const sanitizedDealsUrl = dealsUrl.toString().replace(/api_token=[^&]+/, "api_token=***HIDDEN***")
    await logDebug(`Fetching organization deals with URL: ${sanitizedDealsUrl}`)

    const { data: dealsData, requestId: dealsRequestId } = await fetchWithLogging(dealsUrl.toString())

    if (!dealsData.data || dealsData.data.length === 0) {
      await logInfo(`No deals found for organization ${orgId}`)
      return []
    }

    await logInfo(`Found ${dealsData.data.length} deals for organization ${orgId}`)

    const deals: Deal[] = []

    for (const deal of dealsData.data) {
      await logDebug(`Processing deal: ID=${deal.id}, Title=${deal.title}`)

      // Pobierz szczegóły osoby kontaktowej w dealu
      let personName = ""
      let personEmail = ""
      let personPhone = ""

      if (deal.person_id) {
        const personDetails = await getPersonDetails(String(deal.person_id), apiKey)
        personName = personDetails.name
        personEmail = personDetails.email
        personPhone = personDetails.phone
      }

      // Pobierz szczegóły pipeline i stage
      let pipelineName = "Nieznany"
      let stageName = "Nieznany etap"

      if (deal.pipeline_id && deal.stage_id) {
        const pipelineDetails = await getPipelineAndStageDetails(
          String(deal.pipeline_id),
          String(deal.stage_id),
          apiKey,
        )
        pipelineName = pipelineDetails.pipelineName
        stageName = pipelineDetails.stageName
      }

      // Pobierz pełne dane właściciela dealu
      let ownerName = ""
      let dealOwner: DealOwner | null = null
      const dealOwnerId = safeGetId(deal.owner_id)
      if (dealOwnerId) {
        dealOwner = await getDealOwner(dealOwnerId, apiKey)
        ownerName = dealOwner?.name || ""
      }

      const dealData: Deal = {
        id: String(deal.id),
        title: deal.title || "",
        status: mapStatus(deal.status),
        value: deal.value || 0,
        currency: deal.currency || "PLN",
        stage_name: stageName,
        pipeline_name: pipelineName,
        owner_name: ownerName,
        owner: dealOwner,
        person_name: personName,
        person_email: personEmail,
        person_phone: personPhone,
        add_time: deal.add_time || "",
        update_time: deal.update_time || "",
      }

      deals.push(dealData)
    }

    return deals
  } catch (error) {
    await logError("Error fetching organization deals:", error)
    return []
  }
}

// Główna funkcja do wyszukiwania organizacji po NIP
export async function searchCompanyByNip(nip: string): Promise<PipedriveOrganization[] | null> {
  // SPRAWDZENIE AUTENTYKACJI - nikt nie może używać tej funkcji bez logowania
  const user = await verifyAuthentication()
  await logInfo(`User ${user.email} is searching for organizations with NIP: ${nip}`)

  await logInfo(`Searching for organizations with NIP: ${nip}`)
  await logInfo(`Using API base URL: ${PIPEDRIVE_API_URL}`)

  // Pobierz klucz API z funkcji pomocniczej
  const apiKey = getPipedriveApiKey()

  try {
    // 1. Wyszukiwanie organizacji po NIP
    const organizationsUrl = new URL(`${PIPEDRIVE_API_URL}/v1/organizations/search`)
    organizationsUrl.searchParams.append("api_token", apiKey)
    organizationsUrl.searchParams.append("term", nip)
    organizationsUrl.searchParams.append("fields", "custom_fields")
    organizationsUrl.searchParams.append("exact_match", "1")

    // Loguj URL bez klucza API
    const sanitizedUrl = organizationsUrl.toString().replace(/api_token=[^&]+/, "api_token=***HIDDEN***")
    await logDebug(`Searching organizations with URL: ${sanitizedUrl}`)

    const { data: orgData, requestId: orgRequestId } = await fetchWithLogging(organizationsUrl.toString())

    if (!orgData.data || !orgData.data.items || orgData.data.items.length === 0) {
      await logInfo(`No organizations found with NIP: ${nip}`)
      return null
    }

    // Znajdź organizacje z pasującym NIP
    const organizations = orgData.data.items.map((item: any) => item.item)
    await logInfo(`Found ${organizations.length} organizations with NIP: ${nip}`)

    const results: PipedriveOrganization[] = []

    for (const org of organizations) {
      await logDebug(`Processing organization: ID=${org.id}, Name=${org.name}`)

      // Pobierz osoby kontaktowe z organizacji (pracownicy firmy)
      const contactPersons = await getOrganizationPersons(String(org.id), apiKey)

      // Pobierz właściciela organizacji (użytkownik CRM)
      let organizationOwner: OrganizationOwner | null = null
      const ownerId = safeGetId(org.owner)
      if (ownerId) {
        organizationOwner = await getOrganizationOwner(ownerId, apiKey)
      }

      // Pobierz deale powiązane z organizacją
      const deals = await getOrganizationDeals(String(org.id), apiKey)

      // Znajdź NIP w organizacji
      let foundNip = nip
      if (org.custom_fields) {
        for (const [key, value] of Object.entries(org.custom_fields)) {
          if (typeof value === "string" && value === nip) {
            foundNip = value
            break
          }
        }
      }

      const organizationData: PipedriveOrganization = {
        id: String(org.id),
        name: org.name || "Nieznana organizacja",
        nip: foundNip,
        phone: safeContactValue(org.phone) || "",
        email: safeContactValue(org.email) || "",
        address: org.address || "",
        owner: organizationOwner,
        contactPersons: contactPersons,
        deals: deals,
        add_time: org.add_time || "",
        update_time: org.update_time || "",
      }

      results.push(organizationData)
    }

    await logInfo(`Found ${results.length} organizations with NIP: ${nip}`)
    return results.length > 0 ? results : null
  } catch (error) {
    await logError(`Error during organization search for NIP ${nip}:`, error)
    throw error
  }
}

// Funkcja pomocnicza do mapowania statusów
function mapStatus(status: string): string {
  switch (status) {
    case "open":
      return "Aktywny"
    case "won":
      return "Wygrany"
    case "lost":
      return "Przegrany"
    case "deleted":
      return "Usunięty"
    default:
      return status
  }
}

// Zachowaj kompatybilność z poprzednim interfejsem
export interface PipedriveCompany {
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

// Funkcja do konwersji nowego formatu na stary dla kompatybilności - MADE ASYNC
export async function convertOrganizationToCompany(org: PipedriveOrganization): Promise<PipedriveCompany> {
  return {
    id: org.id,
    title: org.name,
    nip: org.nip,
    phone: org.phone,
    email: org.email,
    contactPerson: org.contactPersons.length > 0 ? org.contactPersons[0].name : "Brak danych",
    contactPersons: org.contactPersons,
    process: org.deals.length > 0 ? `${org.deals[0].pipeline_name} - ${org.deals[0].stage_name}` : "Brak dealów",
    pipelineName: org.deals.length > 0 ? org.deals[0].pipeline_name : "Brak dealów",
    stageName: org.deals.length > 0 ? org.deals[0].stage_name : "Brak dealów",
    owner: org.owner?.name || "Brak przypisanego opiekuna",
    status: org.deals.length > 0 ? org.deals[0].status : "Brak dealów",
    value: org.deals.reduce((sum, deal) => sum + deal.value, 0),
  }
}

// Zachowaj starą funkcję dla kompatybilności - MADE ASYNC
export async function getCompanyDetails(dealId: string): Promise<PipedriveCompany | null> {
  // Ta funkcja jest zachowana dla kompatybilności, ale teraz używa nowej logiki
  const user = await verifyAuthentication()
  await logInfo(`User ${user.email} is getting details for ID: ${dealId}`)

  // Jeśli to organizacja, pobierz jej szczegóły
  if (String(dealId).startsWith("org_")) {
    const orgId = String(dealId).replace("org_", "")
    // Tutaj można zaimplementować pobieranie szczegółów organizacji
    // Na razie zwracamy null
    return null
  }

  // Jeśli to deal, znajdź organizację i zwróć jako company
  return null
}
