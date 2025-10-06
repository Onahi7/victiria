'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { XCircle } from 'lucide-react'

const errorMessages = {
  'invalid-link': 'The download link is invalid or malformed.',
  'user-not-found': 'User account not found. Please try requesting the download again.',
  'book-not-found': 'The requested book was not found or is no longer available for free download.',
  'verification-failed': 'Failed to verify your download link. Please try again.',
  'expired': 'Your download link has expired. Please request a new one.',
  default: 'An error occurred while processing your request.'
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'default'
  
  const message = errorMessages[error as keyof typeof errorMessages] || errorMessages.default

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Authentication Error
            </CardTitle>
            <CardDescription>
              There was a problem with your download link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-semibold">What can you do?</h3>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Check if the link in your email is complete and not broken</li>
                <li>• Try copying the full link and pasting it in a new browser tab</li>
                <li>• Request a new download link if this one has expired</li>
                <li>• Contact support if the problem persists</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => window.location.href = '/books'}>
                Browse Books
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/contact'}>
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
