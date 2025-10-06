import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminBookCreationForm from "@/components/admin-book-creation-form"

export const metadata: Metadata = {
  title: "Create Book - Admin | Victoria",
  description: "Create a new book in the Victoria catalog",
}

export default async function CreateBookPage() {
  const session = await auth()

  if (!session || session.user.role !== "admin") {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto py-8">
      <AdminBookCreationForm />
    </div>
  )
}
