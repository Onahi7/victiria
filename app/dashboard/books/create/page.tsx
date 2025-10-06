import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminBookCreationForm from "@/components/admin-book-creation-form"

export const metadata: Metadata = {
  title: "Create Book - Dashboard | Victoria",
  description: "Create a new book in the Victoria catalog",
}

export default async function CreateBookPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  // For now, allow any authenticated user, but you can restrict to admin if needed
  // if (session.user.role !== "admin") {
  //   redirect("/dashboard")
  // }

  return (
    <div className="container mx-auto py-8">
      <AdminBookCreationForm />
    </div>
  )
}
