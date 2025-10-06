import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'

async function createAdminUser() {
  try {
    const adminEmail = 'admin@victoria.com'
    const adminPassword = 'admin123456' // Change this to a secure password
    
    // Check if admin already exists
    const existingAdmin = await db.select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1)

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists:', existingAdmin[0].email)
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create admin user
    const adminUser = await db.insert(users)
      .values({
        name: 'Victoria Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date(),
        isActive: true,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })

    console.log('Admin user created successfully:')
    console.log('Email:', adminUser[0].email)
    console.log('Password:', adminPassword)
    console.log('Role:', adminUser[0].role)
    console.log('')
    console.log('⚠️  Please change the password after first login!')
    
  } catch (error) {
    console.error('Error creating admin user:', error)
  }
}

createAdminUser()
