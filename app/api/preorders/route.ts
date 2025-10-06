import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookPreorders, books, preorderPurchases } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'

// GET - Get active preorders for public
export async function GET() {
  try {
    const activePreorders = await db
      .select({
        id: bookPreorders.id,
        preorderStart: bookPreorders.preorderStart,
        preorderEnd: bookPreorders.preorderEnd,
        releaseDate: bookPreorders.releaseDate,
        earlyAccessDiscount: bookPreorders.earlyAccessDiscount,
        maxPreorderQuantity: bookPreorders.maxPreorderQuantity,
        currentPreorderCount: bookPreorders.currentPreorderCount,
        preorderBenefits: bookPreorders.preorderBenefits,
        book: {
          id: books.id,
          title: books.title,
          description: books.description,
          coverImage: books.coverImage,
          price: books.price,
          author: books.author,
          category: books.category
        }
      })
      .from(bookPreorders)
      .leftJoin(books, eq(bookPreorders.bookId, books.id))
      .where(
        and(
          eq(bookPreorders.isActive, true),
          lte(bookPreorders.preorderStart, new Date()),
          gte(bookPreorders.preorderEnd, new Date())
        )
      )

    return NextResponse.json({
      success: true,
      data: activePreorders
    })

  } catch (error) {
    console.error('Error fetching preorders:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
