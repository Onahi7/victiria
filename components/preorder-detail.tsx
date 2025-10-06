'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Calendar, Users, Star, ShoppingCart, Check, AlertCircle } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Book {
  id: string
  title: string
  author: string
  description: string
  coverImage: string
  genre: string
}

interface BookPreorder {
  id: string
  bookId: string
  book: Book
  preorderPrice: string
  originalPrice: string
  discountPercentage: number
  maxQuantity: number | null
  currentOrders: number
  startsAt: string
  endsAt: string
  releaseDate: string
  description: string
  isActive: boolean
}

interface PreorderDetailProps {
  preorderId: string
}

export default function PreorderDetail({ preorderId }: PreorderDetailProps) {
  const { data: session } = useSession()
  const [preorder, setPreorder] = useState<BookPreorder | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD')

  useEffect(() => {
    fetchPreorderDetails()
  }, [preorderId])

  const fetchPreorderDetails = async () => {
    try {
      const response = await fetch(`/api/preorders/${preorderId}`)
      if (response.ok) {
        const result = await response.json()
        setPreorder(result.data)
      } else {
        toast({
          title: "Error",
          description: "Preorder not found",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load preorder details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponDiscount(0)
      setCouponError('')
      return
    }

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode,
          orderAmount: calculateSubtotal(),
          items: [{ type: 'book', id: preorder?.bookId }]
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setCouponDiscount(result.discount)
        setCouponError('')
        toast({
          title: "Coupon Applied",
          description: `You save $${result.discount.toFixed(2)}!`,
        })
      } else {
        setCouponDiscount(0)
        setCouponError(result.error)
      }
    } catch (error) {
      setCouponDiscount(0)
      setCouponError('Failed to validate coupon')
    }
  }

  const handlePurchase = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to place a preorder",
        variant: "destructive"
      })
      return
    }

    setPurchasing(true)
    try {
      const response = await fetch(`/api/preorders/${preorderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity,
          couponCode: couponCode || undefined,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Preorder Successful!",
          description: "Your preorder has been confirmed. You'll receive the book on release date.",
        })
        
        // Redirect to success page or account orders
        window.location.href = '/account/orders'
      } else {
        toast({
          title: "Purchase Failed",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process preorder",
        variant: "destructive"
      })
    } finally {
      setPurchasing(false)
    }
  }

  const getPrice = (priceUsd: string) => {
    if (currency === 'NGN') {
      // Convert USD to NGN (approximate rate: 1 USD = 1500 NGN)
      return (parseFloat(priceUsd) * 1500).toFixed(2)
    }
    return priceUsd
  }

  const getCurrencySymbol = () => {
    return currency === 'NGN' ? '₦' : '$'
  }

  const calculateSubtotal = () => {
    if (!preorder) return 0
    return parseFloat(getPrice(preorder.preorderPrice)) * quantity
  }

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - couponDiscount)
  }

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    
    if (now >= end) return 'Preorder period has ended'
    return `${formatDistanceToNow(end)} remaining`
  }

  const isPreorderActive = () => {
    if (!preorder) return false
    const now = new Date()
    const start = new Date(preorder.startsAt)
    const end = new Date(preorder.endsAt)
    return now >= start && now <= end && preorder.isActive
  }

  const getAvailableQuantity = () => {
    if (!preorder?.maxQuantity) return 999
    return preorder.maxQuantity - preorder.currentOrders
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading preorder details...</div>
      </div>
    )
  }

  if (!preorder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Preorder Not Found</h1>
          <Link href="/preorders">
            <Button>View All Preorders</Button>
          </Link>
        </div>
      </div>
    )
  }

  const availableQuantity = getAvailableQuantity()
  const active = isPreorderActive()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Book Details */}
        <div>
          <img
            src={preorder.book.coverImage || '/placeholder.jpg'}
            alt={preorder.book.title}
            className="w-full max-w-md mx-auto rounded-lg shadow-lg"
          />
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Preorder
              </Badge>
              {preorder.discountPercentage > 0 && (
                <Badge variant="destructive">
                  {preorder.discountPercentage}% OFF
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">{preorder.book.title}</h1>
            <p className="text-xl text-gray-600 mb-4">by {preorder.book.author}</p>
            
            {preorder.book.description && (
              <p className="text-gray-700 mb-4">{preorder.book.description}</p>
            )}

            {preorder.description && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Preorder Campaign</h3>
                <p className="text-sm">{preorder.description}</p>
              </div>
            )}
          </div>

          {/* Preorder Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>{getTimeRemaining(preorder.endsAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span>Release Date: {format(new Date(preorder.releaseDate), 'MMMM dd, yyyy')}</span>
            </div>
            {preorder.maxQuantity && (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>{preorder.currentOrders} / {preorder.maxQuantity} preordered</span>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(value: 'USD' | 'NGN') => setCurrency(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="NGN">NGN (₦)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">
                {getCurrencySymbol()}{getPrice(preorder.preorderPrice)}
              </span>
              {preorder.discountPercentage > 0 && (
                <div className="text-right">
                  <div className="text-sm text-gray-500 line-through">
                    {getCurrencySymbol()}{getPrice(preorder.originalPrice)}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    Save {getCurrencySymbol()}{(parseFloat(getPrice(preorder.originalPrice)) - parseFloat(getPrice(preorder.preorderPrice))).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Purchase Form */}
          {active && availableQuantity > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Place Your Preorder</CardTitle>
                <CardDescription>
                  Secure your copy at the special preorder price
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={Math.min(availableQuantity, 10)}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  {availableQuantity <= 10 && (
                    <p className="text-sm text-orange-600 mt-1">
                      Only {availableQuantity} copies available!
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="coupon">Coupon Code (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                    />
                    <Button type="button" variant="outline" onClick={validateCoupon}>
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-600 mt-1">{couponError}</p>
                  )}
                  {couponDiscount > 0 && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Coupon applied! You save ${couponDiscount.toFixed(2)}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({quantity} × {getCurrencySymbol()}{getPrice(preorder.preorderPrice)})</span>
                    <span>{getCurrencySymbol()}{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount</span>
                      <span>-{getCurrencySymbol()}{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{getCurrencySymbol()}{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  onClick={handlePurchase} 
                  disabled={purchasing || !session}
                  className="w-full"
                  size="lg"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {purchasing ? 'Processing...' : 'Preorder Now'}
                </Button>

                {!session && (
                  <p className="text-sm text-gray-600 text-center">
                    <Link href="/auth/signin" className="text-blue-600 hover:underline">
                      Sign in
                    </Link>
                    {' '}to place your preorder
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="font-semibold">
                      {availableQuantity <= 0 ? 'Sold Out' : 'Preorder Unavailable'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {availableQuantity <= 0 
                        ? 'All preorder copies have been reserved'
                        : 'The preorder period has ended'
                      }
                    </p>
                  </div>
                  <Link href="/preorders">
                    <Button variant="outline">View Other Preorders</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Preorder Benefits
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Immediate delivery on release date
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Special preorder pricing
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Guaranteed copy reservation
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Early access to content
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
