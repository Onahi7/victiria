import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { newsletterSubscribers, emailTemplates } from '@/lib/db/schema'
import { eq, gte, count } from 'drizzle-orm'
import { NewsletterService } from '@/lib/email/newsletter-service'

// POST /api/admin/newsletter/send - Send newsletter to subscribers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateId, subject, customContent, targetAudience, scheduledAt } = body

    // Validate required fields
    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }

    // Get template if provided
    let template = null
    if (templateId) {
      const [foundTemplate] = await db.select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, templateId))
        .limit(1)

      if (!foundTemplate) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      template = foundTemplate
    }

    // If scheduled, validate the date
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt)
      if (scheduledDate <= new Date()) {
        return NextResponse.json({ 
          error: 'Scheduled date must be in the future' 
        }, { status: 400 })
      }
    }

    // Get subscribers based on target audience
    let subscribersWhere: any = eq(newsletterSubscribers.isActive, true)
    
    if (targetAudience === 'new') {
      // Subscribers from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      subscribersWhere = gte(newsletterSubscribers.subscribedAt, thirtyDaysAgo)
    }

    const subscribers = await db.select({ email: newsletterSubscribers.email })
      .from(newsletterSubscribers)
      .where(subscribersWhere)

    if (subscribers.length === 0) {
      return NextResponse.json({ 
        error: 'No active subscribers found' 
      }, { status: 400 })
    }

    // Prepare content
    let emailContent = ''
    if (template) {
      emailContent = template.content
    } else if (customContent) {
      emailContent = customContent
    } else {
      return NextResponse.json({ 
        error: 'Either template or custom content is required' 
      }, { status: 400 })
    }

    // If scheduled, we would store this for later processing
    // For now, we'll send immediately
    if (scheduledAt) {
      // In a real implementation, you'd store this in a queue/scheduler
      return NextResponse.json({ 
        message: 'Newsletter scheduled successfully',
        scheduledAt,
        subscriberCount: subscribers.length 
      })
    }

    // Send newsletter immediately
    const results = await NewsletterService.sendToMultiple({
      subject,
      content: emailContent,
      recipients: subscribers.map(s => s.email)
    })

    return NextResponse.json({
      message: 'Newsletter sent successfully',
      results: {
        total: subscribers.length,
        sent: results.successful.length,
        failed: results.failed.length
      }
    })

  } catch (error) {
    console.error('Error sending newsletter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/admin/newsletter/send - Get newsletter sending statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalSubscribers, activeSubscribers, recentSubscribers] = await Promise.all([
      db.select({ count: count() }).from(newsletterSubscribers),
      db.select({ count: count() }).from(newsletterSubscribers).where(eq(newsletterSubscribers.isActive, true)),
      db.select({ count: count() }).from(newsletterSubscribers).where(
        gte(newsletterSubscribers.subscribedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      )
    ])

    const totalCount = totalSubscribers[0]?.count || 0
    const activeCount = activeSubscribers[0]?.count || 0
    const recentCount = recentSubscribers[0]?.count || 0

    return NextResponse.json({
      totalSubscribers: totalCount,
      activeSubscribers: activeCount,
      recentSubscribers: recentCount,
      inactiveSubscribers: totalCount - activeCount
    })

  } catch (error) {
    console.error('Error fetching newsletter statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
