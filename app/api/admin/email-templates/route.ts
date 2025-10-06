import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET /api/admin/email-templates - Fetch all email templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt))

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/email-templates - Create new email template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, subject, content, variables } = body

    // Validate required fields
    if (!name || !subject || !content) {
      return NextResponse.json({ 
        error: 'Name, subject, and content are required' 
      }, { status: 400 })
    }

    // Check if template name already exists
    const existingTemplate = await db.select().from(emailTemplates).where(eq(emailTemplates.name, name)).limit(1)

    if (existingTemplate.length > 0) {
      return NextResponse.json({ 
        error: 'Template with this name already exists' 
      }, { status: 409 })
    }

    const [template] = await db.insert(emailTemplates).values({
      name,
      subject,
      content,
      variables: variables || {}
    }).returning()

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating email template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
