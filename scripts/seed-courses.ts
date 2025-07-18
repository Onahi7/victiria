import { db } from '@/lib/db'
import { courses, courseModules, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function seedCourses() {
  try {
    console.log('Seeding courses...')

    // Find an admin user to assign as instructor
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1)

    if (!adminUsers.length) {
      console.log('No admin user found. Creating courses without instructor...')
      return
    }

    const instructor = adminUsers[0]

    // Sample courses
    const sampleCourses = [
      {
        title: "Writing Fundamentals: From Idea to Story",
        description: "Master the basics of storytelling, character development, and narrative structure. Perfect for beginners looking to start their writing journey.",
        price: "0.00", // Free course
        thumbnailImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500&h=300&fit=crop",
        duration: 180, // 3 hours
        level: "beginner",
        isPublished: true,
        instructorId: instructor.id,
      },
      {
        title: "Advanced Fiction Writing Techniques",
        description: "Dive deep into advanced techniques for creating compelling fiction. Learn about plot structure, character arcs, and professional editing.",
        price: "25000.00", // ₦25,000
        thumbnailImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=300&fit=crop",
        duration: 360, // 6 hours
        level: "advanced",
        isPublished: true,
        instructorId: instructor.id,
      },
      {
        title: "Poetry and Creative Expression",
        description: "Explore the art of poetry and creative expression. Learn different forms, techniques, and how to find your unique voice.",
        price: "15000.00", // ₦15,000
        thumbnailImage: "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=500&h=300&fit=crop",
        duration: 240, // 4 hours
        level: "intermediate",
        isPublished: true,
        instructorId: instructor.id,
      },
    ]

    for (const courseData of sampleCourses) {
      // Create course
      const [course] = await db.insert(courses).values({
        ...courseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()

      console.log(`Created course: ${course.title}`)

      // Create sample modules for each course
      const modules = [
        {
          title: "Introduction and Overview",
          content: "Welcome to the course! In this module, we'll cover what you'll learn and how to get the most out of this experience.",
          duration: 30,
          order: 1,
          isPreview: true,
        },
        {
          title: "Core Concepts",
          content: "Learn the fundamental concepts that form the foundation of this subject.",
          duration: 45,
          order: 2,
          isPreview: courseData.price === "0.00", // Free preview for paid courses
        },
        {
          title: "Practical Exercises",
          content: "Apply what you've learned through hands-on exercises and examples.",
          duration: 60,
          order: 3,
          isPreview: false,
        },
        {
          title: "Advanced Techniques",
          content: "Explore advanced techniques and best practices used by professionals.",
          duration: 45,
          order: 4,
          isPreview: false,
        },
      ]

      for (const moduleData of modules) {
        await db.insert(courseModules).values({
          ...moduleData,
          courseId: course.id,
          createdAt: new Date(),
        })
      }

      console.log(`Created ${modules.length} modules for course: ${course.title}`)
    }

    console.log('Course seeding completed successfully!')

  } catch (error) {
    console.error('Error seeding courses:', error)
  }
}

// Run the seeding function
seedCourses()
