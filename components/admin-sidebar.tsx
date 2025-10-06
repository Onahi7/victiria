'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Calendar,
  Tag,
  Mail,
  Settings,
  Gift,
  Download,
  TrendingUp,
  Search,
  Menu,
  X,
  GraduationCap,
  ShoppingCart
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Books',
    href: '/dashboard?tab=books',
    icon: BookOpen,
  },
  {
    title: 'Blog',
    href: '/dashboard?tab=blog',
    icon: FileText,
  },
  {
    title: 'Courses',
    href: '/dashboard?tab=courses',
    icon: GraduationCap,
  },
  {
    title: 'Preorders',
    href: '/dashboard?tab=preorders',
    icon: ShoppingCart,
  },
  {
    title: 'Events',
    href: '/dashboard?tab=events',
    icon: Calendar,
  },
  {
    title: 'Coupons',
    href: '/dashboard?tab=coupons',
    icon: Tag,
  },
  {
    title: 'Free Downloads',
    href: '/dashboard?tab=free-downloads',
    icon: Download,
  },
  {
    title: 'Newsletter',
    href: '/dashboard?tab=newsletter',
    icon: Mail,
  },
  {
    title: 'Email Templates',
    href: '/dashboard?tab=email-templates',
    icon: Mail,
  },
  {
    title: 'SEO',
    href: '/dashboard?tab=seo',
    icon: Search,
  },
  {
    title: 'Analytics',
    href: '/dashboard?tab=analytics',
    icon: TrendingUp,
  },
  {
    title: 'Fiction Submissions',
    href: '/dashboard?tab=fiction-submissions',
    icon: FileText,
  },
]

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn('pb-12', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mb-6">
            <Link href="/dashboard" className="flex items-center gap-2 px-3">
              <Image 
                src="/logo.png" 
                alt="EdifyPub Logo" 
                width={24} 
                height={24}
                className="h-6 w-6"
              />
              <h2 className="text-lg font-bold">EdifyPub Admin</h2>
            </Link>
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                    isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                  {item.badge && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MobileAdminSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>
        <ScrollArea className="h-full">
          <AdminSidebar />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
