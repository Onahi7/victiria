import type React from "react"
import { AccountSidebar } from "@/components/account-sidebar"

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 flex flex-col md:flex-row">
      <AccountSidebar />
      <main className="flex-1 p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  )
}
