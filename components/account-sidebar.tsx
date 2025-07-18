"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  User, 
  ShoppingBag, 
  Download, 
  BookOpen, 
  Users, 
  Settings, 
  Heart,
  Calendar,
  Menu,
  X
} from "lucide-react"

const sidebarItems = [
  {
    title: "Profile",
    href: "/account",
    icon: User,
    description: "Personal information"
  },
  {
    title: "Orders",
    href: "/account/orders",
    icon: ShoppingBag,
    description: "Order history"
  },
  {
    title: "Library",
    href: "/account/library",
    icon: Download,
    description: "Downloaded books"
  },
  {
    title: "Courses",
    href: "/account/courses",
    icon: BookOpen,
    description: "Enrolled courses"
  },
  {
    title: "Community",
    href: "/account/community",
    icon: Users,
    description: "Community activity"
  },
  {
    title: "Wishlist",
    href: "/account/wishlist",
    icon: Heart,
    description: "Saved books"
  },
  {
    title: "Events",
    href: "/account/events",
    icon: Calendar,
    description: "Event RSVPs"
  },
  {
    title: "Settings",
    href: "/account/settings",
    icon: Settings,
    description: "Account preferences"
  }
]

// Mobile Bottom Navigation Component
function MobileBottomNav() {
  const pathname = usePathname()
  
  // Show only the most important items in bottom nav
  const bottomNavItems = sidebarItems.slice(0, 5)
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-50">
      <div className="flex justify-around items-center py-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-md text-xs transition-colors min-w-0",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              <span className="truncate">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// Desktop Sidebar Component  
function DesktopSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:block w-64 bg-muted/50 border-r">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">My Account</h2>
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

// Mobile Sidebar Sheet
function MobileSidebarSheet() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  
  // Close sidebar when route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Account</h2>
          </div>
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function AccountSidebar() {
  return (
    <>
      <MobileSidebarSheet />
      <DesktopSidebar />
      <MobileBottomNav />
    </>
  )
}
