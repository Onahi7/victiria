import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, books } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/auth/verify - Verify magic link and redirect to book download
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    const bookId = searchParams.get('bookId')

    if (!token || !email || !bookId) {
      return NextResponse.redirect(new URL('/auth/error?error=invalid-link', request.url))
    }

    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (!user) {
      return NextResponse.redirect(new URL('/auth/error?error=user-not-found', request.url))
    }

    // Get book details
    const book = await db.query.books.findFirst({
      where: eq(books.id, bookId)
    })

    if (!book || !book.isFree) {
      return NextResponse.redirect(new URL('/auth/error?error=book-not-found', request.url))
    }

    // In a production app, you would verify the token against a stored token
    // For now, we'll redirect to the book download page
    const downloadUrl = `/books/${book.slug}/download?verified=true&email=${encodeURIComponent(email)}`
    
    return NextResponse.redirect(new URL(downloadUrl, request.url))

  } catch (error) {
    console.error("Error verifying magic link:", error)
    return NextResponse.redirect(new URL('/auth/error?error=verification-failed', request.url))
  }
}
