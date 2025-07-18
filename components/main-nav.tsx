"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Home", href: "/" },
  { name: "Books", href: "/books" },
  { name: "Services", href: "/services" },
  { name: "Academy", href: "/academy" },
  { name: "Blog", href: "/blog" },
  { name: "Publishing", href: "/publishing" },
  { name: "About", href: "/about" },
]

interface MainNavProps {
  mobile?: boolean
  onItemClick?: () => void
}

export function MainNav({ mobile = false, onItemClick }: MainNavProps) {
  const pathname = usePathname()

  if (mobile) {
    return (
      <nav className="flex flex-col space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "block px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === item.href 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    )
  }

  return (
    <nav className="flex items-center space-x-6 lg:space-x-8 text-sm lg:text-base font-medium">
      {navItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "transition-colors hover:text-purple-600 dark:hover:text-purple-400 whitespace-nowrap",
            pathname === item.href 
              ? "text-purple-600 dark:text-purple-400 font-semibold" 
              : "text-gray-600 dark:text-gray-300"
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  )
}

