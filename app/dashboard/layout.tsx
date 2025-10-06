import type React from "react"
import { AdminSidebar, MobileAdminSidebar } from "@/components/admin-sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <ScrollArea className="flex-1">
          <AdminSidebar />
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center gap-4 border-b px-4 py-3">
          <MobileAdminSidebar />
          <h1 className="text-lg font-semibold">EdifyPub Admin</h1>
        </header>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <main className="p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </ScrollArea>
      </div>
    </div>
  )
}

