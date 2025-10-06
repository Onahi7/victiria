import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface NewsletterContent {
  subject: string
  content: string
  recipients: string[]
}

interface SendResult {
  successful: string[]
  failed: { email: string; error: string }[]
}

export class NewsletterService {
  
  /**
   * Send newsletter to multiple recipients
   */
  static async sendToMultiple({
    subject,
    content,
    recipients
  }: NewsletterContent): Promise<SendResult> {
    const successful: string[] = []
    const failed: { email: string; error: string }[] = []

    // Process in batches to avoid rate limits
    const batchSize = 50
    const batches = []
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const promises = batch.map(async (email) => {
        try {
          const result = await this.sendSingle({
            to: email,
            subject,
            content
          })

          if (result.success) {
            successful.push(email)
          } else {
            failed.push({ email, error: result.error || 'Unknown error' })
          }
        } catch (error) {
          failed.push({ 
            email, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      })

      // Wait for batch to complete before processing next batch
      await Promise.all(promises)
      
      // Add delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return { successful, failed }
  }

  /**
   * Send newsletter to single recipient
   */
  private static async sendSingle({
    to,
    subject,
    content
  }: {
    to: string
    subject: string
    content: string
  }) {
    try {
      // Add unsubscribe link to content
      const unsubscribeLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(to)}`
      
      const htmlContent = `
        ${content}
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
          <p>You received this email because you subscribed to DIFY Academy newsletter.</p>
          <p><a href="${unsubscribeLink}" style="color: #8B5CF6;">Unsubscribe</a> | <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #8B5CF6;">Visit Website</a></p>
          <p>© 2025 DIFY Academy. All rights reserved.</p>
        </div>
      `

      const result = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'DIFY Academy <newsletter@difyacademy.com>',
        to,
        subject,
        html: htmlContent,
      })

      console.log(`Newsletter sent to ${to}:`, result)
      return { success: true, data: result }
    } catch (error) {
      console.error(`Failed to send newsletter to ${to}:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Create newsletter content with latest blog posts and courses
   */
  static async createWeeklyDigest(): Promise<string> {
    // This would typically fetch data from your database
    // For now, returning a template
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>DIFY Academy Weekly Digest</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; }
          .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #8B5CF6; }
          .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          .course-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 10px 0; }
          .blog-post { border-bottom: 1px solid #eee; padding: 15px 0; }
          .blog-post:last-child { border-bottom: none; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📚 DIFY Academy Weekly Digest</h1>
          <p>Your weekly dose of writing inspiration and learning opportunities</p>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>🔥 Featured This Week</h2>
            <p>Discover what's trending in our writing community and don't miss out on these amazing opportunities!</p>
          </div>

          <div class="section">
            <h2>📖 New Courses</h2>
            <div class="course-card">
              <h3>Advanced Fiction Writing</h3>
              <p>Master the art of storytelling with our comprehensive fiction writing course. Learn character development, plot structure, and dialogue techniques.</p>
              <a href="{{COURSE_URL}}" class="button">Enroll Now</a>
            </div>
            <div class="course-card">
              <h3>Content Marketing Mastery</h3>
              <p>Transform your writing into powerful marketing content that converts. Perfect for entrepreneurs and marketers.</p>
              <a href="{{COURSE_URL}}" class="button">Learn More</a>
            </div>
          </div>

          <div class="section">
            <h2>✍️ Latest Blog Posts</h2>
            <div class="blog-post">
              <h3>5 Writing Habits That Will Transform Your Productivity</h3>
              <p>Discover the daily practices that successful writers use to maintain consistency and improve their craft.</p>
              <a href="{{BLOG_URL}}">Read More →</a>
            </div>
            <div class="blog-post">
              <h3>The Art of Show Don't Tell: A Comprehensive Guide</h3>
              <p>Learn how to create vivid, engaging prose that draws readers in and keeps them hooked until the last page.</p>
              <a href="{{BLOG_URL}}">Read More →</a>
            </div>
            <div class="blog-post">
              <h3>Building Your Author Platform: A Step-by-Step Guide</h3>
              <p>Everything you need to know about creating an online presence that attracts readers and builds your writing career.</p>
              <a href="{{BLOG_URL}}">Read More →</a>
            </div>
          </div>

          <div class="section">
            <h2>🎯 Writer's Tip of the Week</h2>
            <blockquote style="font-style: italic; border-left: 3px solid #8B5CF6; padding-left: 15px; margin: 15px 0;">
              "The first draft is just you telling yourself the story." - Terry Pratchett
            </blockquote>
            <p>Remember, perfection isn't the goal in your first draft. Focus on getting your story down on paper. You can always polish it later during the editing process.</p>
          </div>

          <div class="section">
            <h2>📊 Community Highlights</h2>
            <ul>
              <li>🎉 Over 1,000 writers joined our community this month!</li>
              <li>📚 500+ courses completed by our amazing students</li>
              <li>✍️ 200+ new blog posts published by community members</li>
              <li>🏆 Featured writer of the week: [Writer Name] for their amazing progress!</li>
            </ul>
          </div>

          <div class="section">
            <h2>📅 Upcoming Events</h2>
            <p><strong>Live Writing Workshop</strong><br>
            Join us for an interactive session on "Crafting Compelling Characters"<br>
            📅 Date: [Event Date]<br>
            🕐 Time: [Event Time]<br>
            📍 Location: Online</p>
            <a href="{{EVENT_URL}}" class="button">Register Now</a>
          </div>
        </div>

        <div class="footer">
          <p>Keep writing, keep growing! 🚀</p>
          <p><strong>The DIFY Academy Team</strong></p>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Create promotional newsletter content
   */
  static async createPromotionalContent(data: {
    title: string
    description: string
    ctaText: string
    ctaUrl: string
    imageUrl?: string
  }): Promise<string> {
    const { title, description, ctaText, ctaUrl, imageUrl } = data

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 40px; }
          .hero-section { background: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; font-size: 16px; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          .image { width: 100%; max-width: 400px; height: auto; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌟 DIFY Academy</h1>
          <h2>${title}</h2>
        </div>
        
        <div class="content">
          <div class="hero-section">
            ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="image">` : ''}
            <h2 style="color: #8B5CF6; margin-bottom: 20px;">${title}</h2>
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 25px;">${description}</p>
            <a href="${ctaUrl}" class="cta-button">${ctaText}</a>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h3>Why Choose DIFY Academy?</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0;"><strong>✅ Expert Instructors:</strong> Learn from published authors and industry professionals</li>
              <li style="padding: 8px 0;"><strong>✅ Practical Approach:</strong> Hands-on exercises and real-world applications</li>
              <li style="padding: 8px 0;"><strong>✅ Community Support:</strong> Connect with fellow writers and get feedback</li>
              <li style="padding: 8px 0;"><strong>✅ Lifetime Access:</strong> Learn at your own pace with permanent access</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          <p>Transform your writing today! ✨</p>
          <p><strong>The DIFY Academy Team</strong></p>
        </div>
      </body>
      </html>
    `
  }
}
