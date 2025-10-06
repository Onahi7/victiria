import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { newsletterSubscribers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/newsletter/unsubscribe - Unsubscribe from newsletter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    // Find and deactivate subscriber
    const [subscriber] = await db.select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1)

    if (!subscriber) {
      return NextResponse.json({ error: 'Email not found in our subscriber list' }, { status: 404 })
    }

    if (!subscriber.isActive) {
      return NextResponse.json({ message: 'You are already unsubscribed' })
    }

    await db.update(newsletterSubscribers)
      .set({ isActive: false })
      .where(eq(newsletterSubscribers.email, email))

    // Return an HTML page instead of JSON for better user experience
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Unsubscribed - DIFY Academy</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px; 
            text-align: center;
            background: #f8f9fa;
          }
          .container { 
            background: white; 
            padding: 40px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { color: #8B5CF6; margin-bottom: 20px; }
          .message { font-size: 18px; margin-bottom: 30px; color: #333; }
          .button { 
            display: inline-block; 
            background: #8B5CF6; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px;
          }
          .feedback { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">✓ Successfully Unsubscribed</h1>
          <p class="message">
            You have been successfully unsubscribed from the DIFY Academy newsletter.
            <br><br>
            We're sorry to see you go! You will no longer receive our weekly writing tips, course updates, and community highlights.
          </p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">
            Visit DIFY Academy
          </a>
          
          <div class="feedback">
            <p style="font-size: 14px; color: #666;">
              We'd love to improve our newsletters. If you have a moment, please let us know why you unsubscribed by 
              <a href="mailto:feedback@difyacademy.com?subject=Newsletter Feedback" style="color: #8B5CF6;">sending us feedback</a>.
            </p>
          </div>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            If you unsubscribed by mistake, you can <a href="${process.env.NEXT_PUBLIC_APP_URL}#newsletter" style="color: #8B5CF6;">resubscribe here</a>.
          </p>
        </div>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error)
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Error - DIFY Academy</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          .error { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1 class="error">Oops! Something went wrong</h1>
        <p>We encountered an error while processing your unsubscribe request. Please try again or contact us at support@difyacademy.com</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}">Return to DIFY Academy</a>
      </body>
      </html>
    `
    
    return new NextResponse(errorHtml, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
