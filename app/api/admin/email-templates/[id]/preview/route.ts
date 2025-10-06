import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// POST /api/admin/email-templates/[id]/preview - Preview email template with sample data
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sampleData } = body

    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, params.id)).limit(1)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Replace template variables with sample data
    let processedSubject = template.subject
    let processedContent = template.content

    if (sampleData) {
      Object.entries(sampleData).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), String(value))
        processedContent = processedContent.replace(new RegExp(placeholder, 'g'), String(value))
      })
    }

    return NextResponse.json({
      subject: processedSubject,
      content: processedContent,
      originalTemplate: template
    })
  } catch (error) {
    console.error('Error previewing email template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
