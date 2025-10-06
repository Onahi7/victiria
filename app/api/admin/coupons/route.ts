import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { coupons, couponUsage } from '@/lib/db/schema'
import { eq, and, or, sql, lt, gt, isNull } from 'drizzle-orm'

// GET - Get all coupons (admin) or validate coupon (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const action = searchParams.get('action')

    if (code && action === 'validate') {
      // Public endpoint to validate coupon
      return await validateCoupon(code)
    }

    // Admin-only endpoint to list all coupons
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereConditions: any[] = []
    
    if (status === 'active') {
      whereConditions.push(
        and(
          eq(coupons.isActive, true),
          lt(coupons.startsAt, new Date()),
          or(isNull(coupons.expiresAt), gt(coupons.expiresAt, new Date()))
        )
      )
    } else if (status === 'expired') {
      whereConditions.push(
        and(
          eq(coupons.isActive, true),
          lt(coupons.expiresAt, new Date())
        )
      )
    } else if (status === 'inactive') {
      whereConditions.push(eq(coupons.isActive, false))
    }

    let results
    
    if (whereConditions.length > 0) {
      results = await db.select()
        .from(coupons)
        .where(and(...whereConditions))
        .orderBy(sql`${coupons.createdAt} DESC`)
        .limit(limit)
        .offset(offset)
    } else {
      results = await db.select()
        .from(coupons)
        .orderBy(sql`${coupons.createdAt} DESC`)
        .limit(limit)
        .offset(offset)
    }

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new coupon (admin only)
export async function POST(request: NextRequest) {
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
      code,
      name,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      userLimit,
      appliesTo,
      applicableItems,
      startsAt,
      expiresAt
    } = body

    // Validate required fields
    if (!code || !name || !type || !value || !startsAt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if coupon code already exists
    const existingCoupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1)

    if (existingCoupon.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Coupon code already exists' },
        { status: 400 }
      )
    }

    // Create coupon
    const [newCoupon] = await db
      .insert(coupons)
      .values({
        code: code.toUpperCase(),
        name,
        description,
        type,
        value: value.toString(),
        minOrderAmount: minOrderAmount?.toString() || '0',
        maxDiscountAmount: maxDiscountAmount?.toString(),
        usageLimit,
        userLimit: userLimit || 1,
        appliesTo: appliesTo || 'all',
        applicableItems,
        startsAt: new Date(startsAt),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.user.id,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newCoupon,
      message: 'Coupon created successfully'
    })

  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to validate coupon
async function validateCoupon(code: string) {
  try {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1)

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Invalid coupon code' },
        { status: 404 }
      )
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json(
        { success: false, error: 'Coupon is not active' },
        { status: 400 }
      )
    }

    // Check if coupon has started
    if (new Date() < coupon.startsAt) {
      return NextResponse.json(
        { success: false, error: 'Coupon is not yet active' },
        { status: 400 }
      )
    }

    // Check if coupon has expired
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Coupon has expired' },
        { status: 400 }
      )
    }

    // Check usage limit
    if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
      return NextResponse.json(
        { success: false, error: 'Coupon usage limit reached' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: parseFloat(coupon.value),
        minOrderAmount: coupon.minOrderAmount ? parseFloat(coupon.minOrderAmount) : 0,
        maxDiscountAmount: coupon.maxDiscountAmount ? parseFloat(coupon.maxDiscountAmount) : null,
        appliesTo: coupon.appliesTo,
        applicableItems: coupon.applicableItems
      }
    })

  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
