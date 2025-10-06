import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { coupons, couponUsage } from '@/lib/db/schema'
import { eq, and, sql, count } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, orderAmount, items } = await request.json()

    if (!code || !orderAmount) {
      return NextResponse.json({ error: 'Coupon code and order amount are required' }, { status: 400 })
    }

    // Find the coupon
    const coupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1)

    if (!coupon.length) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
    }

    const couponData = coupon[0]

    // Check if coupon is active
    if (!couponData.isActive) {
      return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 })
    }

    // Check if coupon has started
    const now = new Date()
    if (now < couponData.startsAt) {
      return NextResponse.json({ error: 'This coupon is not yet available' }, { status: 400 })
    }

    // Check if coupon has expired
    if (couponData.expiresAt && now > couponData.expiresAt) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
    }

    // Check minimum order amount
    const minAmount = couponData.minOrderAmount ? parseFloat(couponData.minOrderAmount) : 0
    if (orderAmount < minAmount) {
      return NextResponse.json({ 
        error: `Minimum order amount of $${minAmount} required` 
      }, { status: 400 })
    }

    // Check total usage limit
    if (couponData.usageLimit) {
      const totalUsage = await db
        .select({ count: count() })
        .from(couponUsage)
        .where(eq(couponUsage.couponId, couponData.id))

      if (totalUsage[0].count >= couponData.usageLimit) {
        return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
      }
    }

    // Check user usage limit
    const userLimit = couponData.userLimit || 1
    const userUsage = await db
      .select({ count: count() })
      .from(couponUsage)
      .where(
        and(
          eq(couponUsage.couponId, couponData.id),
          eq(couponUsage.userId, session.user.id)
        )
      )

    if (userUsage[0].count >= userLimit) {
      return NextResponse.json({ 
        error: `You have already used this coupon ${userLimit} time${userLimit > 1 ? 's' : ''}` 
      }, { status: 400 })
    }

    // Check if coupon applies to the items in the order
    if (couponData.appliesTo !== 'all') {
      const hasApplicableItems = items.some((item: any) => {
        if (couponData.appliesTo === 'books' && item.type === 'book') return true
        if (couponData.appliesTo === 'courses' && item.type === 'course') return true
        if (couponData.appliesTo === 'specific') {
          // Check if item is in the applicable items list
          const applicableItems = couponData.applicableItems as any[] || []
          return applicableItems.some(ai => ai.id === item.id)
        }
        return false
      })

      if (!hasApplicableItems) {
        return NextResponse.json({ 
          error: 'This coupon is not applicable to the items in your order' 
        }, { status: 400 })
      }
    }

    // Calculate discount
    let discount = 0
    if (couponData.type === 'percentage') {
      discount = (orderAmount * parseFloat(couponData.value)) / 100
      // Apply maximum discount limit if set
      if (couponData.maxDiscountAmount) {
        discount = Math.min(discount, parseFloat(couponData.maxDiscountAmount))
      }
    } else {
      discount = parseFloat(couponData.value)
    }

    // Ensure discount doesn't exceed order amount
    discount = Math.min(discount, orderAmount)

    return NextResponse.json({
      success: true,
      coupon: {
        id: couponData.id,
        code: couponData.code,
        name: couponData.name,
        type: couponData.type,
        value: couponData.value
      },
      discount,
      finalAmount: orderAmount - discount
    })

  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}
