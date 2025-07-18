"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { commonToasts, showSuccessToast, showErrorToast } from "@/lib/toast-utils"

interface WishlistButtonProps {
  bookId: string
  isInWishlist: boolean
  onToggle?: (bookId: string, isInWishlist: boolean) => void
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "outline" | "secondary" | "ghost"
}

export default function WishlistButton({ 
  bookId, 
  isInWishlist, 
  onToggle, 
  size = "default",
  variant = "outline"
}: WishlistButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [wishlistState, setWishlistState] = useState(isInWishlist)
  const { toast } = useToast()

  const handleToggleWishlist = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId,
          action: wishlistState ? 'remove' : 'add'
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const newWishlistState = !wishlistState
        setWishlistState(newWishlistState)
        
        if (newWishlistState) {
          showSuccessToast(
            commonToasts.success.wishlistAdded.title,
            commonToasts.success.wishlistAdded.description
          )
        } else {
          showSuccessToast(
            commonToasts.success.wishlistRemoved.title,
            commonToasts.success.wishlistRemoved.description
          )
        }

        onToggle?.(bookId, newWishlistState)
      } else {
        showErrorToast(
          "Wishlist Error",
          result.error || "Failed to update wishlist. Please try again."
        )
      }
    } catch (error) {
      console.error('Wishlist error:', error)
      showErrorToast(
        commonToasts.error.generic.title,
        commonToasts.error.generic.description
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleWishlist}
      disabled={isLoading}
      className={`transition-colors ${
        wishlistState 
          ? 'text-red-600 hover:text-red-700' 
          : 'text-gray-600 hover:text-red-600'
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart 
          className={`h-4 w-4 ${wishlistState ? 'fill-current' : ''}`} 
        />
      )}
      {size !== "icon" && (
        <span className="ml-2">
          {wishlistState ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </span>
      )}
    </Button>
  )
}
