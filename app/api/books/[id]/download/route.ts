import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { books, orders, orderItems } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { trackDbQuery } from '@/lib/monitoring/performance'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    // Await the params Promise
    const { id: bookId } = await params

    // Get the book details
    const book = await trackDbQuery(
      'books.findById',
      () => db.select().from(books).where(eq(books.id, bookId)).limit(1)
    )

    if (!book.length) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      )
    }

    const bookData = book[0]

    // Check if book file exists
    if (!bookData.bookFile && !bookData.digitalDownload) {
      return NextResponse.json(
        { success: false, error: 'Book file not available' },
        { status: 404 }
      )
    }

    // If the book is free, allow download without authentication
    if (bookData.isFree) {
      const downloadUrl = bookData.bookFile || bookData.digitalDownload
      
      return NextResponse.json({
        success: true,
        downloadUrl,
        message: 'Free book download available',
        bookTitle: bookData.title,
        isFree: true
      })
    }

    // For paid books, check authentication and purchase
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required for paid books' },
        { status: 401 }
      )
    }

    // Check if user has purchased this book
    const userPurchase = await trackDbQuery(
      'orders.checkPurchase',
      () => db.select({
        orderId: orders.id,
        paymentStatus: orders.paymentStatus,
        bookTitle: books.title
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(books, eq(orderItems.bookId, books.id))
      .where(
        and(
          eq(orders.userId, session.user.id),
          eq(orderItems.bookId, bookId),
          eq(orders.paymentStatus, 'completed')
        )
      )
      .limit(1)
    )

    if (!userPurchase.length) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Book not purchased. Please purchase the book to download.',
          requiresPurchase: true,
          bookTitle: bookData.title,
          price: bookData.price,
          priceUsd: bookData.priceUsd,
          priceNgn: bookData.priceNgn
        },
        { status: 403 }
      )
    }

    // User has purchased the book, provide download link
    const downloadUrl = bookData.bookFile || bookData.digitalDownload

    return NextResponse.json({
      success: true,
      downloadUrl,
      message: 'Download authorized',
      bookTitle: bookData.title,
      isPurchased: true,
      orderInfo: userPurchase[0]
    })

  } catch (error) {
    console.error('Error processing book download:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process download request' },
      { status: 500 }
    )
  }
}
