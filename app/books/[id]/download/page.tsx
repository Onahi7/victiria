'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, CheckCircle, XCircle } from 'lucide-react'

export default function BookDownloadPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams()
  const [isVerified, setIsVerified] = useState(false)
  const [book, setBook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const verified = searchParams.get('verified')
  const email = searchParams.get('email')

  useEffect(() => {
    if (verified === 'true' && email) {
      setIsVerified(true)
      fetchBookDetails()
    } else {
      setError('Invalid or expired download link')
      setLoading(false)
    }
  }, [verified, email])

  const fetchBookDetails = async () => {
    try {
      const response = await fetch(`/api/books/${params.slug}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.isFree) {
          setBook(data.data)
        } else {
          setError('Book not found or not available for free download')
        }
      } else {
        setError('Failed to fetch book details')
      }
    } catch (error) {
      setError('Failed to load book information')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!book?.bookFile) {
      setError('Download file not available')
      return
    }

    try {
      // Create a link and trigger download
      const link = document.createElement('a')
      link.href = book.bookFile
      link.download = `${book.title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      setError('Failed to download file')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-lg">Verifying your download link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-6 w-6" />
                Download Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  Return Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Download Verified
            </CardTitle>
            <CardDescription>
              Your download link has been verified for {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {book && (
              <>
                <div className="text-center">
                  {book.frontCoverImage && (
                    <img 
                      src={book.frontCoverImage} 
                      alt={book.title}
                      className="w-48 h-64 object-cover mx-auto rounded-lg shadow-lg mb-4"
                    />
                  )}
                  <h2 className="text-2xl font-bold mb-2">{book.title}</h2>
                  <p className="text-gray-600 mb-2">by {book.author}</p>
                  {book.description && (
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      {book.description.substring(0, 200)}...
                    </p>
                  )}
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Thank you for downloading!</strong> You've been subscribed to our newsletter 
                    to receive updates on new books, writing tips, and exclusive content.
                  </AlertDescription>
                </Alert>

                <div className="text-center">
                  <Button 
                    onClick={handleDownload} 
                    size="lg" 
                    className="w-full sm:w-auto"
                    disabled={!book.bookFile}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Your Free Book
                  </Button>
                  {!book.bookFile && (
                    <p className="text-sm text-red-500 mt-2">
                      Download file is being prepared. Please try again later.
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">What's Next?</h3>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Check your email for updates on new releases</li>
                    <li>• Join our community for writing tips and discussions</li>
                    <li>• Follow us on social media for daily inspiration</li>
                    <li>• Leave a review if you enjoy the book!</li>
                  </ul>
                </div>

                <div className="text-center pt-4">
                  <Button variant="outline" onClick={() => window.location.href = '/books'}>
                    Explore More Books
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
