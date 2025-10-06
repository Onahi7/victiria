import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/admin/email-templates/[id] - Fetch specific email template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, params.id)).limit(1)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching email template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/email-templates/[id] - Update email template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if template exists
    const [existingTemplate] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, params.id)).limit(1)

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check if new name conflicts with existing templates (excluding current)
    if (name !== existingTemplate.name) {
      const [nameConflict] = await db.select().from(emailTemplates).where(eq(emailTemplates.name, name)).limit(1)

      if (nameConflict) {
        return NextResponse.json({ 
          error: 'Template with this name already exists' 
        }, { status: 409 })
      }
    }

    const [template] = await db.update(emailTemplates)
      .set({
        name,
        subject,
        content,
        variables: variables || {},
        updatedAt: new Date()
      })
      .where(eq(emailTemplates.id, params.id))
      .returning()

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating email template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/email-templates/[id] - Delete email template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if template exists
    const [existingTemplate] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, params.id)).limit(1)

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await db.delete(emailTemplates).where(eq(emailTemplates.id, params.id))

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting email template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
