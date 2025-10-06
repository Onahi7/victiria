"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 lg:h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image 
                src="/logo.png" 
                alt="EdifyPub Logo" 
                width={40} 
                height={40}
                className="h-8 w-8 lg:h-10 lg:w-10"
                priority
              />
              <span className="font-bold text-lg lg:text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                EdifyPub
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <MainNav />
          </div>

          {/* Right side - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <ModeToggle />
            <UserNav />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center space-x-2 lg:hidden">
            <ModeToggle />
            <UserNav />
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-background">
            <div className="px-2 pt-2 pb-4 space-y-2">
              <MainNav mobile onItemClick={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

