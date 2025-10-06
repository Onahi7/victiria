import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookPreorders, books, preorderPurchases } from '@/lib/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

// GET - Get specific preorder details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [preorder] = await db
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
          eq(bookPreorders.id, params.id),
          eq(bookPreorders.isActive, true),
          lte(bookPreorders.preorderStart, new Date()),
          gte(bookPreorders.preorderEnd, new Date())
        )
      )
      .limit(1)

    if (!preorder) {
      return NextResponse.json(
        { success: false, error: 'Preorder not found or not active' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: preorder
    })

  } catch (error) {
    console.error('Error fetching preorder:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Purchase preorder
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { quantity = 1 } = await request.json()

    // Get preorder details
    const [preorder] = await db
      .select()
      .from(bookPreorders)
      .where(
        and(
          eq(bookPreorders.id, params.id),
          eq(bookPreorders.isActive, true),
          lte(bookPreorders.preorderStart, new Date()),
          gte(bookPreorders.preorderEnd, new Date())
        )
      )
      .limit(1)

    if (!preorder) {
      return NextResponse.json(
        { success: false, error: 'Preorder not found or not active' },
        { status: 404 }
      )
    }

    // Check if user already has a preorder for this book
    const [existingPurchase] = await db
      .select()
      .from(preorderPurchases)
      .where(
        and(
          eq(preorderPurchases.preorderId, params.id),
          eq(preorderPurchases.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingPurchase) {
      return NextResponse.json(
        { success: false, error: 'You have already preordered this book' },
        { status: 400 }
      )
    }

    // Check preorder quantity limits
    if (preorder.maxPreorderQuantity && 
        preorder.currentPreorderCount + quantity > preorder.maxPreorderQuantity) {
      return NextResponse.json(
        { success: false, error: 'Preorder quantity limit exceeded' },
        { status: 400 }
      )
    }

    // Calculate discount
    const book = await db
      .select()
      .from(books)
      .where(eq(books.id, preorder.bookId))
      .limit(1)

    if (!book.length) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      )
    }

    const originalPrice = parseFloat(book[0].price)
    const discountPercentage = parseFloat(preorder.earlyAccessDiscount)
    const discountAmount = (originalPrice * discountPercentage) / 100
    const finalPrice = originalPrice - discountAmount

    // Create preorder purchase
    const [purchase] = await db
      .insert(preorderPurchases)
      .values({
        preorderId: params.id,
        userId: session.user.id,
        quantity,
        discountApplied: discountAmount.toString(),
      })
      .returning()

    // Update preorder count
    await db
      .update(bookPreorders)
      .set({
        currentPreorderCount: sql`${bookPreorders.currentPreorderCount} + ${quantity}`,
        updatedAt: new Date()
      })
      .where(eq(bookPreorders.id, params.id))

    return NextResponse.json({
      success: true,
      data: {
        purchase,
        originalPrice,
        discountAmount,
        finalPrice,
        message: 'Preorder placed successfully'
      }
    })

  } catch (error) {
    console.error('Error placing preorder:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
