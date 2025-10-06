"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, CreditCard, Download, Loader2, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { commonToasts, showSuccessToast, showErrorToast } from "@/lib/toast-utils"
import PaymentGatewaySelection from "@/components/payment-gateway-selection"

interface BookPurchaseProps {
  book: {
    id: string
    title: string
    author: string
    price: number // Legacy field
    priceUsd?: number // USD price for PayPal/Stripe
    priceNgn?: number // NGN price for Paystack
    currency?: string // Legacy field
    coverImage?: string
    frontCoverImage?: string
    description?: string
    format?: string[]
    isFree?: boolean // Free book flag
  }
  isOpen?: boolean
  onClose?: () => void
  onPurchaseComplete?: (orderId: string) => void
}

export default function BookPurchase({ book, isOpen = false, onClose, onPurchaseComplete }: BookPurchaseProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState(book.format?.[0] || 'PDF')
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'NGN'>(() => {
    // Default to the available currency, or USD if both are available
    if (book.priceUsd && book.priceNgn) return 'USD'
    if (book.priceUsd) return 'USD'
    if (book.priceNgn) return 'NGN'
    // Fallback to legacy currency or USD
    return book.currency === 'NGN' ? 'NGN' : 'USD'
  })
  
  // Free book download modal state
  const [showFreeForm, setShowFreeForm] = useState(false)
  const [freeForm, setFreeForm] = useState({ name: '', email: '', phone: '' })
  const [freeFormError, setFreeFormError] = useState<string | null>(null)
  
  const [showGatewaySelection, setShowGatewaySelection] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Get the current price based on selected currency
  const getCurrentPrice = () => {
    if (selectedCurrency === 'USD' && book.priceUsd) return book.priceUsd
    if (selectedCurrency === 'NGN' && book.priceNgn) return book.priceNgn
    // Fallback to legacy price
    return book.price || 0
  }

  // Get available currencies
  const getAvailableCurrencies = () => {
    const currencies = []
    if (book.priceUsd && book.priceUsd > 0) currencies.push('USD')
    if (book.priceNgn && book.priceNgn > 0) currencies.push('NGN')
    
    // Fallback to legacy currency if no new prices
    if (currencies.length === 0 && book.price && book.price > 0) {
      currencies.push(book.currency === 'NGN' ? 'NGN' : 'USD')
    }
    
    return currencies
  }

  // Format price with currency symbol
  const formatPrice = (amount: number, currency: string) => {
    if (currency === 'USD') return `$${amount.toFixed(2)}`
    if (currency === 'NGN') return `₦${amount.toLocaleString()}`
    return `${currency} ${amount.toLocaleString()}`
  }

  const availableCurrencies = getAvailableCurrencies()

  const processPayment = async (gateway: 'paypal' | 'mtn-momo' | 'paystack', phoneNumber?: string) => {
    setIsProcessing(true)

    try {
      const currentPrice = getCurrentPrice()

      if (!currentPrice || currentPrice <= 0) {
        throw new Error('Invalid price')
      }

      if (!book.id || !selectedFormat) {
        throw new Error('Missing required book information')
      }

      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: book.id,
          format: selectedFormat,
          amount: currentPrice,
          currency: selectedCurrency
        }),
      })

      const orderResult = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderResult.error || 'Failed to create order')
      }

      // Show processing toast
      const gatewayName = gateway === 'paypal' ? 'PayPal' : gateway === 'mtn-momo' ? 'MTN MOMO' : 'Paystack'
      toast({
        title: "Processing payment...",
        description: `Redirecting to ${gatewayName}...`,
      })

      // Initialize payment with selected gateway
      const paymentResponse = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderResult.orderId,
          amount: currentPrice,
          currency: selectedCurrency,
          gateway: gateway,
          email: orderResult.customerEmail,
          phoneNumber: phoneNumber || undefined,
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
      setShowGatewaySelection(false)
    }
  }

  // Gateway selection modal
  const GatewaySelectionModal = () => (
    <Dialog open={showGatewaySelection} onOpenChange={setShowGatewaySelection}>
      <DialogContent className="max-w-md">
        <PaymentGatewaySelection
          currency={selectedCurrency}
          amount={getCurrentPrice()}
          bookId={book.id}
          onGatewaySelect={processPayment}
          onCancel={() => setShowGatewaySelection(false)}
        />
      </DialogContent>
    </Dialog>
  )

  const handlePurchase = async () => {
    const currentPrice = getCurrentPrice()
    
    if (currentPrice <= 0) {
      toast({
        title: "Error",
        description: "Invalid price for selected currency",
        variant: "destructive"
      })
      return
    }

    // For USD, show gateway selection (PayPal vs MTN MOMO)
    // For NGN, go directly to Paystack
    if (selectedCurrency === 'USD') {
      setShowGatewaySelection(true)
    } else {
      // Direct to Paystack for NGN
      await processPayment('paystack')
    }
  }

  const handleAddToCart = async () => {
    try {
      const currentPrice = getCurrentPrice()
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: book.id,
          format: selectedFormat,
          currency: selectedCurrency,
          amount: currentPrice,
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

  // Show free book form modal if needed
  if (showFreeForm) {
    return (
      <Dialog open={showFreeForm} onOpenChange={setShowFreeForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Get Free Book</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setFreeFormError(null);
              setIsProcessing(true);
              try {
                // Call API to create user and send magic link
                const res = await fetch('/api/auth/magic-link', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: freeForm.name,
                    email: freeForm.email,
                    phone: freeForm.phone,
                    bookId: book.id,
                  })
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Failed to create account');
                
                setShowFreeForm(false);
                showSuccessToast(
                  'Magic Link Sent!', 
                  'Check your email for the download link. You\'ve been subscribed to our newsletter for updates!'
                );
                onPurchaseComplete?.('free-download');
              } catch (err: any) {
                setFreeFormError(err.message || 'Failed to create account');
              } finally {
                setIsProcessing(false);
              }
            }}
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={freeForm.name} onChange={(e) => setFreeForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={freeForm.email} onChange={(e) => setFreeForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={freeForm.phone} onChange={(e) => setFreeForm(f => ({ ...f, phone: e.target.value }))} required />
            </div>
            {freeFormError && <div className="text-red-500 text-sm">{freeFormError}</div>}
            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Get Book'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Main purchase content
  const PurchaseContent = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Purchase Book</CardTitle>
        <CardDescription>Complete your purchase to get instant access</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Book Summary */}
  <div className="space-y-3">
          <div className="flex items-start gap-3">
            {(book.frontCoverImage || book.coverImage) && (
              <img 
                src={book.frontCoverImage || book.coverImage} 
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

        {/* Currency Selection */}
        {availableCurrencies.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Currency</label>
            <div className="flex gap-2">
              {availableCurrencies.map((currency) => (
                <Badge
                  key={currency}
                  variant={selectedCurrency === currency ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1"
                  onClick={() => setSelectedCurrency(currency as 'USD' | 'NGN')}
                >
                  {currency === 'USD' ? '💳 USD (PayPal/MTN MOMO)' : '🏦 NGN (Paystack)'}
                </Badge>
              ))}
            </div>
          </div>
        )}

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
              {formatPrice(getCurrentPrice(), selectedCurrency)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Format</span>
            <span>{selectedFormat}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Payment via</span>
            <span>{selectedCurrency === 'USD' ? 'PayPal/MTN MOMO' : 'Paystack'}</span>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center font-semibold">
          <span>Total</span>
          <span>{formatPrice(getCurrentPrice(), selectedCurrency)}</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {book.isFree || book.price === 0 || book.priceUsd === 0 || book.priceNgn === 0 ? (
            <Button
              onClick={() => setShowFreeForm(true)}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Download className="mr-2 h-4 w-4" />
              {isProcessing ? 'Processing...' : 'Download Free'}
            </Button>
          ) : (
            <>
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
            </>
          )}
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

  // Render with Dialog wrapper if isOpen prop is provided
  if (isOpen !== undefined) {
    return (
      <>
        <Dialog open={isOpen && !showFreeForm} onOpenChange={(open) => !open && onClose?.()}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <PurchaseContent />
          </DialogContent>
        </Dialog>
        
        {/* Free book form modal */}
        {showFreeForm && (
          <Dialog open={showFreeForm} onOpenChange={setShowFreeForm}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Get Free Book</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setFreeFormError(null);
                  setIsProcessing(true);
                  try {
                    const res = await fetch('/api/auth/magic-link', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: freeForm.name,
                        email: freeForm.email,
                        phone: freeForm.phone,
                        bookId: book.id,
                      })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.error || 'Failed to create account');
                    
                    setShowFreeForm(false);
                    onClose?.();
                    showSuccessToast(
                      'Magic Link Sent!', 
                      'Check your email for the download link. You\'ve been subscribed to our newsletter for updates!'
                    );
                    onPurchaseComplete?.('free-download');
                  } catch (err: any) {
                    setFreeFormError(err.message || 'Failed to create account');
                  } finally {
                    setIsProcessing(false);
                  }
                }}
              >
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={freeForm.name} onChange={(e) => setFreeForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={freeForm.email} onChange={(e) => setFreeForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={freeForm.phone} onChange={(e) => setFreeForm(f => ({ ...f, phone: e.target.value }))} required />
                </div>
                {freeFormError && <div className="text-red-500 text-sm">{freeFormError}</div>}
                <Button type="submit" className="w-full" disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Get Book'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Gateway selection modal */}
        <GatewaySelectionModal />
      </>
    )
  }

  // Render standalone without Dialog wrapper
  return (
    <>
      <PurchaseContent />
      <GatewaySelectionModal />
    </>
  )
}
