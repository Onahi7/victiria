import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { bookPreorders, preorderPurchases, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET - Get specific preorder
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const [preorder] = await db
      .select({
        preorder: bookPreorders,
        purchases: preorderPurchases,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(bookPreorders)
      .leftJoin(preorderPurchases, eq(bookPreorders.id, preorderPurchases.preorderId))
      .leftJoin(users, eq(preorderPurchases.userId, users.id))
      .where(eq(bookPreorders.id, params.id))
      .limit(1)

    if (!preorder) {
      return NextResponse.json(
        { success: false, error: 'Preorder not found' },
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

// PUT - Update preorder
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      preorderStart,
      preorderEnd,
      releaseDate,
      earlyAccessDiscount,
      maxPreorderQuantity,
      preorderBenefits,
      isActive
    } = body

    // Validate dates if provided
    if (preorderStart && preorderEnd) {
      const startDate = new Date(preorderStart)
      const endDate = new Date(preorderEnd)

      if (startDate >= endDate) {
        return NextResponse.json(
          { success: false, error: 'Preorder start date must be before end date' },
          { status: 400 }
        )
      }
    }

    if (preorderEnd && releaseDate) {
      const endDate = new Date(preorderEnd)
      const releaseDateObj = new Date(releaseDate)

      if (endDate >= releaseDateObj) {
        return NextResponse.json(
          { success: false, error: 'Preorder end date must be before release date' },
          { status: 400 }
        )
      }
    }

    const [updatedPreorder] = await db
      .update(bookPreorders)
      .set({
        preorderStart: preorderStart ? new Date(preorderStart) : undefined,
        preorderEnd: preorderEnd ? new Date(preorderEnd) : undefined,
        releaseDate: releaseDate ? new Date(releaseDate) : undefined,
        earlyAccessDiscount: earlyAccessDiscount?.toString(),
        maxPreorderQuantity,
        preorderBenefits,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(bookPreorders.id, params.id))
      .returning()

    if (!updatedPreorder) {
      return NextResponse.json(
        { success: false, error: 'Preorder not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedPreorder,
      message: 'Preorder updated successfully'
    })

  } catch (error) {
    console.error('Error updating preorder:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete preorder
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if preorder has purchases
    const purchases = await db
      .select()
      .from(preorderPurchases)
      .where(eq(preorderPurchases.preorderId, params.id))
      .limit(1)

    if (purchases.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete preorder with existing purchases' },
        { status: 400 }
      )
    }

    await db
      .delete(bookPreorders)
      .where(eq(bookPreorders.id, params.id))

    return NextResponse.json({
      success: true,
      message: 'Preorder deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting preorder:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
