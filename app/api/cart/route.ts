import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { cartItems, books } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET - Get user's cart items
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const items = await db
      .select({
        id: cartItems.id,
        bookId: cartItems.bookId,
        quantity: cartItems.quantity,
        addedAt: cartItems.addedAt,
        book: {
          id: books.id,
          title: books.title,
          price: books.price,
          coverImage: books.coverImage,
          author: books.author
        }
      })
      .from(cartItems)
      .leftJoin(books, eq(cartItems.bookId, books.id))
      .where(eq(cartItems.userId, session.user.id))

    const totalAmount = items.reduce((sum, item) => {
      const price = Number(item.book?.price) || 0
      return sum + price * item.quantity
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        items,
        totalAmount,
        itemCount: items.length
      }
    })

  } catch (error) {
    console.error('Get cart error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { bookId, quantity = 1 } = await request.json()

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      )
    }

    // Check if book exists
    const book = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1)

    if (!book.length) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      )
    }

    // Check if item already exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.userId, session.user.id),
        eq(cartItems.bookId, bookId)
      ))
      .limit(1)

    if (existingItem.length > 0) {
      // Update quantity
      await db
        .update(cartItems)
        .set({ 
          quantity: existingItem[0].quantity + quantity,
          updatedAt: new Date()
        })
        .where(eq(cartItems.id, existingItem[0].id))
    } else {
      // Add new item
      await db
        .insert(cartItems)
        .values({
          userId: session.user.id,
          bookId,
          quantity,
          addedAt: new Date(),
          updatedAt: new Date()
        })
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Item added to cart successfully'
      }
    })

  } catch (error) {
    console.error('Add to cart error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { cartItemId, quantity } = await request.json()

    if (!cartItemId || quantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid cart item ID and quantity are required' },
        { status: 400 }
      )
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      await db
        .delete(cartItems)
        .where(and(
          eq(cartItems.id, cartItemId),
          eq(cartItems.userId, session.user.id)
        ))
    } else {
      // Update quantity
      await db
        .update(cartItems)
        .set({ 
          quantity,
          updatedAt: new Date()
        })
        .where(and(
          eq(cartItems.id, cartItemId),
          eq(cartItems.userId, session.user.id)
        ))
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Cart updated successfully'
      }
    })

  } catch (error) {
    console.error('Update cart error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove item from cart or clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cartItemId = searchParams.get('cartItemId')
    const clearAll = searchParams.get('clearAll') === 'true'

    if (clearAll) {
      // Clear entire cart
      await db
        .delete(cartItems)
        .where(eq(cartItems.userId, session.user.id))
    } else if (cartItemId) {
      // Remove specific item
      await db
        .delete(cartItems)
        .where(and(
          eq(cartItems.id, cartItemId),
          eq(cartItems.userId, session.user.id)
        ))
    } else {
      return NextResponse.json(
        { success: false, error: 'Cart item ID is required or use clearAll=true' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        message: clearAll ? 'Cart cleared successfully' : 'Item removed from cart'
      }
    })

  } catch (error) {
    console.error('Delete cart item error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
