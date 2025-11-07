"use client"

import { useState, useEffect, use } from "react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, ShoppingCart, Heart, Share2, BookOpen } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import BookPurchase from "@/components/book-purchase"

interface Book {
  id: string
  title: string
  author: string
  description: string
  price: number
  priceUsd?: number
  priceNgn?: number
  coverImage?: string
  frontCoverImage?: string
  backCoverImage?: string
  category: string
  status: string
  slug: string
  isbn?: string
  pageCount?: number
  publishedAt?: string
  createdAt: string
  isAvailable: boolean
  isFree: boolean
  salesCount: number
}

export default function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const { data: book, loading, error, get } = useApi<Book>()
  
  // Unwrap the params Promise using React.use()
  const { slug } = use(params)

  useEffect(() => {
    if (slug && slug !== 'undefined') {
      console.log('Fetching book with slug:', slug) // Debug log
      // Fetch book by slug - we'll need to create an API endpoint for this
      get(`/api/books/slug/${slug}`)
        .then((response) => {
          console.log('API Response:', response) // Debug log
        })
        .catch((error) => {
          console.error('API Error:', error) // Debug log
        })
    }
  }, [slug, get])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-purple-950/30 dark:to-gray-900">
        <div className="container py-12 px-4 sm:px-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-[600px] bg-muted rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-12 bg-muted rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !book) {
    if (slug === 'undefined') {
      notFound()
    }
    
    console.log('Error state:', { error, book, slug }) // Debug log
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-purple-950/30 dark:to-gray-900">
        <div className="container py-12 px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center py-20">
            <h1 className="text-2xl font-bold mb-4">Book Not Found</h1>
            <p className="text-muted-foreground mb-4">The book you're looking for doesn't exist.</p>
            {error && (
              <p className="text-red-500 text-sm mb-4">Error: {JSON.stringify(error)}</p>
            )}
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-purple-950/30 dark:to-gray-900">
      <div className="container py-12 px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Book Cover */}
          <div className="flex justify-center lg:justify-start">
            <Card className="overflow-hidden max-w-md">
              <div className="relative h-[600px] w-[400px]">
                <Image
                  src={book.frontCoverImage || book.coverImage || "/placeholder.svg"}
                  alt={`${book.title} book cover`}
                  fill
                  className="object-cover"
                  sizes="400px"
                />
              </div>
            </Card>
          </div>

          {/* Book Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {book.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-2">by {book.author}</p>
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="secondary">{book.category}</Badge>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">5.0/5</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {book.description}
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {book.isFree ? (
                    <span className="text-green-600">Free</span>
                  ) : book.priceNgn && book.priceUsd ? (
                    <>
                      <span>₦{Number(book.priceNgn).toLocaleString()}</span>
                      <span className="text-muted-foreground mx-2">|</span>
                      <span>${Number(book.priceUsd).toLocaleString()}</span>
                    </>
                  ) : book.priceNgn ? (
                    `₦${Number(book.priceNgn).toLocaleString()}`
                  ) : book.priceUsd ? (
                    `$${Number(book.priceUsd).toLocaleString()}`
                  ) : (
                    `₦${book.price.toLocaleString()}`
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
                onClick={() => setShowPurchaseModal(true)}
              >
                {book.isFree ? 'Download Free' : 'Buy Now'}
                <ShoppingCart className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="flex-1">
                <BookOpen className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {book.isbn && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">ISBN:</span> {book.isbn}
              </div>
            )}
          </div>
        </div>

        {/* Additional Book Information */}
        <Card>
          <CardHeader>
            <CardTitle>Book Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p className="font-semibold">{book.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Author</p>
                <p className="font-semibold">{book.author}</p>
              </div>
              {book.pageCount && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pages</p>
                  <p className="font-semibold">{book.pageCount}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={book.status === 'published' ? 'default' : 'secondary'}>
                  {book.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && book && (
        <BookPurchase
          book={book}
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
        />
      )}
    </div>
  )
}
