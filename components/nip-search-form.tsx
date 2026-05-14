"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  nip: z
    .string()
    .min(10, {
      message: "NIP musi mieć co najmniej 10 znaków.",
    })
    .max(13, {
      message: "NIP może mieć maksymalnie 13 znaków (z myślnikami).",
    })
    .regex(/^[0-9-]+$/, {
      message: "NIP może zawierać tylko cyfry i myślniki.",
    }),
})

interface NipSearchFormProps {
  initialNip?: string
}

export default function NipSearchForm({ initialNip = "" }: NipSearchFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nip: initialNip,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    // Przekierowanie z parametrem NIP
    router.push(`/dashboard?nip=${values.nip}`)

    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-center">Wyszukaj firmę po NIP</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nip"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Wprowadź NIP firmy, np. 1234567890"
                    className="text-center py-6 text-lg"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-center" />
              </FormItem>
            )}
          />

          <div className="text-center text-sm text-gray-500">Wprowadź numer NIP, aby wyszukać dane firmy.</div>

          <Button type="submit" className="w-full py-6" disabled={isLoading} size="lg">
            <Search className="mr-2 h-5 w-5" />
            Szukaj
          </Button>
        </form>
      </Form>
    </div>
  )
}
