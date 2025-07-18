"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, CreditCard, Download, Loader2, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { commonToasts, showSuccessToast, showErrorToast } from "@/lib/toast-utils"

interface BookPurchaseProps {
  book: {
    id: string
    title: string
    author: string
    price: number
    currency: string
    coverImage?: string
    description?: string
    format?: string[]
  }
  onPurchaseComplete?: (orderId: string) => void
}

export default function BookPurchase({ book, onPurchaseComplete }: BookPurchaseProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState(book.format?.[0] || 'PDF')
  const router = useRouter()
  const { toast } = useToast()

  const handlePurchase = async () => {
    setIsProcessing(true)

    try {
      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: book.id,
          format: selectedFormat,
          amount: book.price,
          currency: book.currency
        }),
      })

      const orderResult = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderResult.error || 'Failed to create order')
      }

      // Show processing toast
      toast({
        title: "Processing payment...",
        description: "Please wait while we process your purchase.",
      })

      // Initialize payment
      const paymentResponse = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderResult.orderId,
          amount: book.price,
          currency: book.currency,
          email: orderResult.customerEmail,
        }),
      })

      const paymentResult = await paymentResponse.json()

      if (!paymentResponse.ok) {
        throw new Error(paymentResult.error || 'Failed to initialize payment')
      }

      // Redirect to payment gateway
      if (paymentResult.authorizationUrl) {
        window.location.href = paymentResult.authorizationUrl
      } else {
        // Handle successful payment (for testing or direct payments)
        showSuccessToast(
          commonToasts.success.orderPlaced.title,
          commonToasts.success.orderPlaced.description
        )
        
        setTimeout(() => {
          router.push('/success/order')
        }, 2000)
        
        onPurchaseComplete?.(orderResult.orderId)
      }

    } catch (error) {
      console.error('Purchase error:', error)
      showErrorToast(
        "Purchase Failed",
        error instanceof Error ? error.message : "Failed to process purchase. Please try again."
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddToCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: book.id,
          format: selectedFormat,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        showSuccessToast(
          "Added to cart!",
          `${book.title} has been added to your cart.`
        )
      } else {
        showErrorToast(
          "Cart Error",
          result.error || "Failed to add book to cart. Please try again."
        )
      }
    } catch (error) {
      console.error('Cart error:', error)
      showErrorToast(
        commonToasts.error.generic.title,
        commonToasts.error.generic.description
      )
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Purchase Book</CardTitle>
        <CardDescription>Complete your purchase to get instant access</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Book Summary */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {book.coverImage && (
              <img 
                src={book.coverImage} 
                alt={book.title}
                className="w-12 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{book.title}</h3>
              <p className="text-sm text-muted-foreground">by {book.author}</p>
            </div>
          </div>
          
          {book.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {book.description}
            </p>
          )}
        </div>

        <Separator />

        {/* Format Selection */}
        {book.format && book.format.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <div className="flex flex-wrap gap-2">
              {book.format.map((format) => (
                <Badge
                  key={format}
                  variant={selectedFormat === format ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedFormat(format)}
                >
                  {format}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Price</span>
            <span className="text-lg font-bold">
              {book.currency} {book.price.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Format</span>
            <span>{selectedFormat}</span>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center font-semibold">
          <span>Total</span>
          <span>{book.currency} {book.price.toLocaleString()}</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handlePurchase}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Buy Now
              </>
            )}
          </Button>

          <Button 
            onClick={handleAddToCart}
            variant="outline"
            className="w-full"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </div>

        {/* Purchase Info */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Download className="h-4 w-4" />
            <span>Instant download after purchase</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4" />
            <span>30-day money-back guarantee</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Secure payment processing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
