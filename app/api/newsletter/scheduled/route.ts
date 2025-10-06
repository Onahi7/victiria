import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { newsletterSubscribers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NewsletterService } from '@/lib/email/newsletter-service'

// GET /api/newsletter/scheduled - Process scheduled newsletters (for cron jobs)
export async function GET(request: NextRequest) {
  try {
    // Verify this is being called by a cron job or authorized service
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active subscribers for weekly digest
    const activeSubscribers = await db.select({ email: newsletterSubscribers.email })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.isActive, true))

    if (activeSubscribers.length === 0) {
      return NextResponse.json({ 
        message: 'No active subscribers found',
        sent: 0
      })
    }

    // Generate weekly digest content
    const weeklyContent = await NewsletterService.createWeeklyDigest()
    
    // Send to all active subscribers
    const results = await NewsletterService.sendToMultiple({
      subject: '📚 Your Weekly DIFY Academy Digest',
      content: weeklyContent,
      recipients: activeSubscribers.map((s: { email: string }) => s.email)
    })

    return NextResponse.json({
      message: 'Weekly newsletter sent successfully',
      results: {
        total: activeSubscribers.length,
        sent: results.successful.length,
        failed: results.failed.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error sending scheduled newsletter:', error)
    return NextResponse.json({ 
      error: 'Failed to send scheduled newsletter',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST /api/newsletter/scheduled - Manually trigger weekly newsletter
export async function POST(request: NextRequest) {
  try {
    // This should be admin-only for manual triggers
    const body = await request.json()
    const { adminKey } = body

    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Same logic as GET but for manual trigger
    const activeSubscribers = await db.select({ email: newsletterSubscribers.email })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.isActive, true))

    if (activeSubscribers.length === 0) {
      return NextResponse.json({ 
        message: 'No active subscribers found',
        sent: 0
      })
    }

    const weeklyContent = await NewsletterService.createWeeklyDigest()
    
    const results = await NewsletterService.sendToMultiple({
      subject: '📚 Your Weekly DIFY Academy Digest',
      content: weeklyContent,
      recipients: activeSubscribers.map((s: { email: string }) => s.email)
    })

    return NextResponse.json({
      message: 'Newsletter sent successfully (manual trigger)',
      results: {
        total: activeSubscribers.length,
        sent: results.successful.length,
        failed: results.failed.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error sending newsletter (manual trigger):', error)
    return NextResponse.json({ 
      error: 'Failed to send newsletter',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
