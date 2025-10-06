import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SimpleBookCreateForm from "@/components/simple-book-create-form"

export const metadata: Metadata = {
  title: "Test Book Creation | Victoria",
  description: "Test the book creation functionality",
}

export default async function TestBookCreatePage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto py-8">
      <SimpleBookCreateForm />
    </div>
  )
}
