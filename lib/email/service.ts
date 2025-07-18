import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailTemplate {
  to: string
  subject: string
  html: string
}

export class EmailService {
  
  /**
   * Send course enrollment welcome email
   */
  static async sendEnrollmentWelcome({
    userEmail,
    userName,
    courseName,
    courseId,
    instructorName,
  }: {
    userEmail: string
    userName: string
    courseName: string
    courseId: string
    instructorName: string
  }) {
    const subject = `Welcome to ${courseName}! 🎉`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${courseName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to DIFY Academy!</h1>
            <h2>${courseName}</h2>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>Congratulations! You've successfully enrolled in <strong>${courseName}</strong>. We're excited to have you join our writing community!</p>
            
            <h3>What's Next?</h3>
            <ul>
              <li>📚 Access your course materials anytime</li>
              <li>🎯 Complete modules at your own pace</li>
              <li>💬 Connect with fellow writers</li>
              <li>📝 Get feedback from your instructor, ${instructorName}</li>
            </ul>
            
            <p>Ready to start your writing journey?</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/academy/courses/${courseId}" class="button">
              Start Learning Now
            </a>
            
            <h3>Need Help?</h3>
            <p>If you have any questions, feel free to reach out to us at <a href="mailto:support@difyacademy.com">support@difyacademy.com</a></p>
            
            <p>Happy writing!</p>
            <p><strong>The DIFY Academy Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 DIFY Academy. All rights reserved.</p>
            <p>You received this email because you enrolled in a course at DIFY Academy.</p>
          </div>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({ to: userEmail, subject, html })
  }

  /**
   * Send course completion congratulations
   */
  static async sendCourseCompletion({
    userEmail,
    userName,
    courseName,
    courseId,
    completionDate,
  }: {
    userEmail: string
    userName: string
    courseName: string
    courseId: string
    completionDate: Date
  }) {
    const subject = `🏆 Congratulations! You've completed ${courseName}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Course Completion</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .achievement { background: white; border: 2px solid #10B981; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
          .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Congratulations!</h1>
            <h2>Course Completed</h2>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            
            <div class="achievement">
              <h3>🎉 You've successfully completed</h3>
              <h2 style="color: #8B5CF6;">${courseName}</h2>
              <p>Completed on: ${completionDate.toLocaleDateString()}</p>
            </div>
            
            <p>This is a significant achievement! You've demonstrated dedication and commitment to improving your writing skills.</p>
            
            <h3>What's Next?</h3>
            <ul>
              <li>🏅 Download your completion certificate</li>
              <li>📝 Leave a review to help other writers</li>
              <li>🔍 Explore more advanced courses</li>
              <li>💬 Join our alumni community</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/academy/courses/${courseId}/certificate" class="button">
                Download Certificate
              </a>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/academy/courses/${courseId}#reviews" class="button">
                Leave a Review
              </a>
            </div>
            
            <p>Keep writing and keep growing!</p>
            <p><strong>The DIFY Academy Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 DIFY Academy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({ to: userEmail, subject, html })
  }

  /**
   * Send course reminder email
   */
  static async sendCourseReminder({
    userEmail,
    userName,
    courseName,
    courseId,
    lastActivityDate,
    progress,
  }: {
    userEmail: string
    userName: string
    courseName: string
    courseId: string
    lastActivityDate: Date
    progress: number
  }) {
    const subject = `Don't forget to continue your writing journey! 📚`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Course Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #F59E0B, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .progress-bar { background: #e5e5e5; border-radius: 10px; overflow: hidden; margin: 15px 0; }
          .progress-fill { background: #8B5CF6; height: 20px; width: ${progress}%; transition: width 0.3s ease; }
          .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Your Writing Journey Awaits</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>We noticed you haven't been active in <strong>${courseName}</strong> since ${lastActivityDate.toLocaleDateString()}. Don't let your writing momentum fade away!</p>
            
            <div>
              <h3>Your Progress</h3>
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
              <p><strong>${progress}% Complete</strong> - You're doing great!</p>
            </div>
            
            <h3>Why Continue?</h3>
            <ul>
              <li>✨ Keep your creative momentum going</li>
              <li>🎯 Achieve your writing goals</li>
              <li>📈 Build consistent writing habits</li>
              <li>🏆 Complete the course and earn your certificate</li>
            </ul>
            
            <p>Just 15 minutes a day can make a huge difference in your writing journey!</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/academy/courses/${courseId}" class="button">
              Continue Learning
            </a>
            
            <p>Keep writing!</p>
            <p><strong>The DIFY Academy Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 DIFY Academy. All rights reserved.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe">Unsubscribe from reminders</a></p>
          </div>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({ to: userEmail, subject, html })
  }

  /**
   * Send generic email
   */
  private static async sendEmail({ to, subject, html }: EmailTemplate) {
    try {
      const result = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'DIFY Academy <noreply@difyacademy.com>',
        to,
        subject,
        html,
      })

      console.log('Email sent successfully:', result)
      return { success: true, data: result }
    } catch (error) {
      console.error('Failed to send email:', error)
      return { success: false, error }
    }
  }
}
