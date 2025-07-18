import { db } from '@/lib/db'
import { enrollments, courses, users } from '@/lib/db/schema'
import { EmailService } from '@/lib/email/service'
import { eq, and, sql, lt } from 'drizzle-orm'

export class CourseReminderService {
  
  /**
   * Send reminder emails to inactive students
   * Run this daily via cron job or scheduled task
   */
  static async sendInactiveStudentReminders() {
    try {
      console.log('Starting inactive student reminder process...')

      // Find students who haven't been active in 7 days
      const inactiveThreshold = new Date()
      inactiveThreshold.setDate(inactiveThreshold.getDate() - 7)

      const inactiveEnrollments = await db
        .select({
          enrollment: {
            id: enrollments.id,
            progress: enrollments.progress,
            enrolledAt: enrollments.enrolledAt,
          },
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
          },
          course: {
            id: courses.id,
            title: courses.title,
          }
        })
        .from(enrollments)
        .leftJoin(users, eq(enrollments.userId, users.id))
        .leftJoin(courses, eq(enrollments.courseId, courses.id))
        .where(
          and(
            lt(enrollments.enrolledAt, inactiveThreshold),
            lt(enrollments.progress, 100), // Not completed
            eq(courses.isPublished, true)
          )
        )

      console.log(`Found ${inactiveEnrollments.length} inactive enrollments`)

      // Send reminder emails
      for (const enrollment of inactiveEnrollments) {
        if (enrollment.user && enrollment.course) {
          try {
            await EmailService.sendCourseReminder({
              userEmail: enrollment.user.email,
              userName: enrollment.user.name || 'Student',
              courseName: enrollment.course.title,
              courseId: enrollment.course.id,
              lastActivityDate: enrollment.enrollment.enrolledAt,
              progress: enrollment.enrollment.progress || 0,
            })

            console.log(`Sent reminder to ${enrollment.user.email} for course ${enrollment.course.title}`)
            
            // Add small delay to avoid overwhelming email service
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (error) {
            console.error(`Failed to send reminder to ${enrollment.user.email}:`, error)
          }
        }
      }

      console.log('Completed inactive student reminder process')
    } catch (error) {
      console.error('Error in sendInactiveStudentReminders:', error)
    }
  }

  /**
   * Send completion congratulations to newly completed courses
   */
  static async sendCompletionCongratulations() {
    try {
      console.log('Checking for newly completed courses...')

      // Find enrollments that were completed in the last 24 hours
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const recentCompletions = await db
        .select({
          enrollment: {
            id: enrollments.id,
            completedAt: enrollments.completedAt,
          },
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
          },
          course: {
            id: courses.id,
            title: courses.title,
          }
        })
        .from(enrollments)
        .leftJoin(users, eq(enrollments.userId, users.id))
        .leftJoin(courses, eq(enrollments.courseId, courses.id))
        .where(
          and(
            eq(enrollments.progress, 100),
            sql`${enrollments.completedAt} >= ${yesterday}`
          )
        )

      console.log(`Found ${recentCompletions.length} recent completions`)

      // Send congratulations emails
      for (const completion of recentCompletions) {
        if (completion.user && completion.course && completion.enrollment.completedAt) {
          try {
            await EmailService.sendCourseCompletion({
              userEmail: completion.user.email,
              userName: completion.user.name || 'Student',
              courseName: completion.course.title,
              courseId: completion.course.id,
              completionDate: completion.enrollment.completedAt,
            })

            console.log(`Sent completion email to ${completion.user.email} for course ${completion.course.title}`)
            
            // Add small delay
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (error) {
            console.error(`Failed to send completion email to ${completion.user.email}:`, error)
          }
        }
      }

      console.log('Completed course completion notification process')
    } catch (error) {
      console.error('Error in sendCompletionCongratulations:', error)
    }
  }

  /**
   * Run all reminder services
   */
  static async runScheduledTasks() {
    console.log('Running scheduled course reminder tasks...')
    
    await this.sendInactiveStudentReminders()
    await this.sendCompletionCongratulations()
    
    console.log('All scheduled tasks completed')
  }
}

// If running as a standalone script
if (require.main === module) {
  CourseReminderService.runScheduledTasks()
    .then(() => {
      console.log('Reminder service completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Reminder service failed:', error)
      process.exit(1)
    })
}
