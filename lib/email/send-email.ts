import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    const result = await resend.emails.send({
      from: from || process.env.FROM_EMAIL || 'Victoria Ashworth <noreply@victoriaashworth.com>',
      to,
      subject,
      html,
    })

    console.log('Email sent successfully:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}
