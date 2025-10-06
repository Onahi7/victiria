import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { defaultEmailTemplates } from '@/lib/email/default-templates'

// POST /api/admin/email-templates/seed - Seed default email templates
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = []

    for (const template of defaultEmailTemplates) {
      try {
        // Check if template already exists
        const [existing] = await db.select().from(emailTemplates).where(eq(emailTemplates.name, template.name)).limit(1)

        if (existing) {
          results.push({ 
            name: template.name, 
            status: 'skipped', 
            reason: 'already exists' 
          })
          continue
        }

        // Create the template
        const [created] = await db.insert(emailTemplates).values({
          name: template.name,
          subject: template.subject,
          content: template.content,
          variables: template.variables
        }).returning()

        results.push({ 
          name: template.name, 
          status: 'created',
          id: created.id
        })
      } catch (error) {
        results.push({ 
          name: template.name, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const summary = {
      total: defaultEmailTemplates.length,
      created: results.filter(r => r.status === 'created').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length
    }

    return NextResponse.json({
      message: 'Template seeding completed',
      summary,
      results
    })

  } catch (error) {
    console.error('Error seeding email templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
