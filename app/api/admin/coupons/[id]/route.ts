import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { coupons } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET - Get specific coupon
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

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, params.id))
      .limit(1)

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: coupon
    })

  } catch (error) {
    console.error('Error fetching coupon:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update coupon
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
      name,
      description,
      value,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      userLimit,
      appliesTo,
      applicableItems,
      startsAt,
      expiresAt,
      isActive
    } = body

    const [updatedCoupon] = await db
      .update(coupons)
      .set({
        name,
        description,
        value: value?.toString(),
        minOrderAmount: minOrderAmount?.toString(),
        maxDiscountAmount: maxDiscountAmount?.toString(),
        usageLimit,
        userLimit,
        appliesTo,
        applicableItems,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, params.id))
      .returning()

    if (!updatedCoupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedCoupon,
      message: 'Coupon updated successfully'
    })

  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete coupon
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

    await db
      .delete(coupons)
      .where(eq(coupons.id, params.id))

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
