import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { newsletterSubscribers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { EmailService } from '@/lib/email/service'

// POST /api/newsletter/subscribe - Public newsletter subscription
export async function POST(request: NextRequest) {
  try {
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
    const [existingSubscriber] = await db.select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1)

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return NextResponse.json({ 
          message: 'You are already subscribed to our newsletter',
          alreadySubscribed: true 
        })
      } else {
        // Reactivate existing subscriber
        await db.update(newsletterSubscribers)
          .set({ isActive: true })
          .where(eq(newsletterSubscribers.email, email))
        
        return NextResponse.json({ 
          message: 'Welcome back! Your subscription has been reactivated',
          reactivated: true 
        })
      }
    }

    // Create new subscriber
    const [subscriber] = await db.insert(newsletterSubscribers)
      .values({ email })
      .returning()

    // Send welcome email
    await EmailService.sendNewsletterWelcome({ email })

    return NextResponse.json({ 
      message: 'Successfully subscribed to newsletter!',
      subscriber: { id: subscriber.id, email: subscriber.email }
    }, { status: 201 })

  } catch (error) {
    console.error('Error subscribing to newsletter:', error)
    return NextResponse.json({ error: 'Failed to subscribe to newsletter' }, { status: 500 })
  }
}

// GET /api/newsletter/subscribe - Get subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    const [subscriber] = await db.select({ 
        id: newsletterSubscribers.id, 
        email: newsletterSubscribers.email, 
        isActive: newsletterSubscribers.isActive, 
        subscribedAt: newsletterSubscribers.subscribedAt 
      })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1)

    if (!subscriber) {
      return NextResponse.json({ subscribed: false })
    }

    return NextResponse.json({ 
      subscribed: true,
      active: subscriber.isActive,
      subscribedAt: subscriber.subscribedAt
    })

  } catch (error) {
    console.error('Error checking subscription status:', error)
    return NextResponse.json({ error: 'Failed to check subscription status' }, { status: 500 })
  }
}
