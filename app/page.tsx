import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import LoginForm from "@/components/login-form"

export default async function Home() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Wyszukiwarka firm</h1>
          <p className="mt-2 text-sm text-gray-600">Zaloguj się, aby wyszukiwać firmy po NIP</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
