'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, Users, Zap, Star } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

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

export default function PreordersList() {
  const [preorders, setPreorders] = useState<BookPreorder[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD')

  useEffect(() => {
    fetchPreorders()
  }, [])

  const fetchPreorders = async () => {
    try {
      const response = await fetch('/api/preorders')
      if (response.ok) {
        const result = await response.json()
        setPreorders(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch preorders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    
    if (now >= end) return 'Ended'
    return `${formatDistanceToNow(end)} remaining`
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

  const getSavings = (originalPrice: string, preorderPrice: string) => {
    return (parseFloat(getPrice(originalPrice)) - parseFloat(getPrice(preorderPrice))).toFixed(2)
  }

  const getAvailabilityStatus = (preorder: BookPreorder) => {
    if (!preorder.maxQuantity) return { available: true, text: 'Available' }
    
    const remaining = preorder.maxQuantity - preorder.currentOrders
    if (remaining <= 0) return { available: false, text: 'Sold Out' }
    if (remaining <= 10) return { available: true, text: `Only ${remaining} left!` }
    return { available: true, text: 'Available' }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading preorders...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold">Book Preorders</h1>
          <div className="flex items-center gap-2">
            <Label>Currency:</Label>
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
        </div>
        <p className="text-xl text-gray-600">
          Get early access to upcoming releases at special prices
        </p>
      </div>

      {preorders.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">No Active Preorders</h2>
          <p className="text-gray-600 mb-6">
            Check back soon for upcoming book releases available for preorder!
          </p>
          <Link href="/books">
            <Button>Browse Available Books</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {preorders.map((preorder) => {
            const availability = getAvailabilityStatus(preorder)
            const timeRemaining = getTimeRemaining(preorder.endsAt)
            
            return (
              <Card key={preorder.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={preorder.book.coverImage || '/placeholder.jpg'}
                    alt={preorder.book.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 left-2 flex gap-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      <Zap className="w-3 h-3 mr-1" />
                      Preorder
                    </Badge>
                    {preorder.discountPercentage > 0 && (
                      <Badge variant="destructive">
                        {preorder.discountPercentage}% OFF
                      </Badge>
                    )}
                  </div>
                  {!availability.available && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-lg px-4 py-2">
                        Sold Out
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader>
                  <CardTitle className="line-clamp-2">{preorder.book.title}</CardTitle>
                  <CardDescription>by {preorder.book.author}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {getCurrencySymbol()}{getPrice(preorder.preorderPrice)}
                      </div>
                      {preorder.discountPercentage > 0 && (
                        <div className="text-sm text-gray-500">
                          <span className="line-through">{getCurrencySymbol()}{getPrice(preorder.originalPrice)}</span>
                          <span className="ml-2 text-green-600 font-medium">
                            Save {getCurrencySymbol()}{getSavings(preorder.originalPrice, preorder.preorderPrice)}
                          </span>
                        </div>
                      )}
                    </div>
                    {availability.available && (
                      <Badge 
                        variant={availability.text.includes('Only') ? 'destructive' : 'default'}
                      >
                        {availability.text}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Preorder ends: {timeRemaining}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span>Release: {format(new Date(preorder.releaseDate), 'MMM dd, yyyy')}</span>
                    </div>
                    {preorder.maxQuantity && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span>{preorder.currentOrders} / {preorder.maxQuantity} preordered</span>
                      </div>
                    )}
                  </div>

                  {preorder.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {preorder.description}
                    </p>
                  )}

                  <div className="pt-2">
                    <Link href={`/preorders/${preorder.id}`}>
                      <Button 
                        className="w-full" 
                        disabled={!availability.available}
                        variant={availability.available ? 'default' : 'secondary'}
                      >
                        {availability.available ? 'Preorder Now' : 'Sold Out'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Benefits Section */}
      <div className="mt-16 bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-8">Why Preorder?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Early Access</h3>
            <p className="text-sm text-gray-600">
              Be among the first to read new releases before they hit the shelves
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Special Prices</h3>
            <p className="text-sm text-gray-600">
              Enjoy exclusive discounts only available during the preorder period
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Guaranteed Copy</h3>
            <p className="text-sm text-gray-600">
              Secure your copy and receive it immediately upon release
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
