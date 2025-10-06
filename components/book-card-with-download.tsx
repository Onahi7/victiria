"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Gift, DollarSign, Star, ShoppingCart, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Book {
  id: string
  title: string
  author: string
  description: string
  price: string
  priceUsd: string
  priceNgn: string
  frontCoverImage?: string
  category: string
  isFree: boolean
  hasDownload: boolean
  canDownload: boolean
  downloadUrl?: string
  averageRating: number
  reviewCount: number
  tags: string[]
  status: string
}

interface BookCardProps {
  book: Book
  showAdminActions?: boolean
}

export default function BookCard({ book, showAdminActions = false }: BookCardProps) {
  const { toast } = useToast()
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!book.hasDownload) {
      toast({
        title: "Download not available",
        description: "This book doesn't have a downloadable file yet.",
        variant: "destructive",
      })
      return
    }

    setDownloading(true)
    try {
      const response = await fetch(`/api/books/${book.id}/download`)
      const result = await response.json()

      if (!response.ok) {
        if (result.requiresPurchase) {
          toast({
            title: "Purchase required",
            description: "You need to purchase this book before downloading.",
            variant: "destructive",
          })
          return
        }
        throw new Error(result.error || 'Download failed')
      }

      if (result.downloadUrl) {
        // Create a temporary link to download the file
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = `${book.title}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Download started",
          description: `Downloading "${book.title}"`,
        })
      }
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download book",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  const handlePurchase = () => {
    // Redirect to purchase page or open purchase modal
    window.location.href = `/books/${book.id}/purchase`
  }

  const handlePreview = () => {
    // Open book preview
    window.location.href = `/books/${book.id}`
  }

  const formatPrice = () => {
    if (book.isFree) return "Free"
    
    const prices = []
    if (book.priceNgn && parseFloat(book.priceNgn) > 0) {
      prices.push(`₦${parseFloat(book.priceNgn).toLocaleString()}`)
    }
    if (book.priceUsd && parseFloat(book.priceUsd) > 0) {
      prices.push(`$${parseFloat(book.priceUsd)}`)
    }
    if (book.price && parseFloat(book.price) > 0 && prices.length === 0) {
      prices.push(`$${parseFloat(book.price)}`)
    }
    
    return prices.length > 0 ? prices.join(" / ") : "Price not set"
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge variant={book.isFree ? "secondary" : "default"} className="mb-2">
            {book.isFree ? (
              <>
                <Gift className="h-3 w-3 mr-1" />
                Free
              </>
            ) : (
              <>
                <DollarSign className="h-3 w-3 mr-1" />
                {formatPrice()}
              </>
            )}
          </Badge>
          {book.status && showAdminActions && (
            <Badge variant="outline" className="text-xs">
              {book.status}
            </Badge>
          )}
        </div>

        {book.frontCoverImage && (
          <div className="w-full h-48 mb-3 overflow-hidden rounded-md">
            <img 
              src={book.frontCoverImage} 
              alt={`${book.title} cover`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
        <CardDescription className="text-sm">
          by {book.author}
        </CardDescription>

        {book.averageRating > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{book.averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({book.reviewCount} reviews)</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {book.description}
        </p>

        <div className="mb-4">
          <Badge variant="outline" className="text-xs">
            {book.category}
          </Badge>
        </div>

        {book.tags && book.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {book.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {book.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{book.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="mt-auto space-y-2">
          <Button 
            onClick={handlePreview}
            variant="outline" 
            className="w-full"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>

          {book.isFree ? (
            <Button 
              onClick={handleDownload}
              className="w-full"
              disabled={downloading || !book.hasDownload}
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? "Downloading..." : "Download Free"}
            </Button>
          ) : (
            <div className="space-y-2">
              <Button 
                onClick={handlePurchase}
                className="w-full"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Purchase
              </Button>
              {book.hasDownload && (
                <Button 
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full"
                  disabled={downloading}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading ? "Checking..." : "Download (After Purchase)"}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Books Grid Component
interface BooksGridProps {
  books: Book[]
  loading?: boolean
  showAdminActions?: boolean
}

export function BooksGrid({ books, loading = false, showAdminActions = false }: BooksGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="h-96 animate-pulse">
            <CardHeader>
              <div className="w-full h-48 bg-gray-200 rounded-md mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-8 bg-gray-200 rounded mt-4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No books found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard 
          key={book.id} 
          book={book} 
          showAdminActions={showAdminActions}
        />
      ))}
    </div>
  )
}
