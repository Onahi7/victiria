import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { newsletterSubscribers } from '@/lib/db/schema'
import { eq, desc, count } from 'drizzle-orm'

// GET /api/admin/newsletter/subscribers - Fetch all newsletter subscribers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const isActive = searchParams.get('isActive')

    const where = isActive !== null ? eq(newsletterSubscribers.isActive, isActive === 'true') : undefined

    const [subscribers, totalResult] = await Promise.all([
      db.select()
        .from(newsletterSubscribers)
        .where(where)
        .orderBy(desc(newsletterSubscribers.subscribedAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ count: count() })
        .from(newsletterSubscribers)
        .where(where)
    ])

    const total = totalResult[0]?.count || 0

    return NextResponse.json({
      subscribers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching newsletter subscribers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/newsletter/subscribers - Add new subscriber (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if subscriber already exists
    const [existingSubscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).limit(1)

    if (existingSubscriber) {
      return NextResponse.json({ 
        error: 'Email already subscribed' 
      }, { status: 409 })
    }

    const [subscriber] = await db.insert(newsletterSubscribers).values({ email }).returning()

    return NextResponse.json(subscriber, { status: 201 })
  } catch (error) {
    console.error('Error adding newsletter subscriber:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
