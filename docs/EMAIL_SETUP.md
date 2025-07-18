# Email Notifications & Course Reminders Setup

## Overview
This system provides automated email notifications for:
- **Welcome emails** when students enroll
- **Completion congratulations** when courses are finished  
- **Reminder emails** for inactive students
- **Course review system** with verified enrollment badges

## Email Service Configuration

### 1. Environment Variables
Add to your `.env.local`:
```bash
# Resend Email Service
RESEND_API_KEY="re_your_resend_api_key"
FROM_EMAIL="DIFY Academy <noreply@difyacademy.com>"
```

### 2. Get Resend API Key
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use their test domain)
3. Generate an API key
4. Add to environment variables

## Automated Reminder System

### Manual Execution
```bash
# Send reminder emails to inactive students
npm run email:reminders
```

### Automated Scheduling Options

#### Option 1: Vercel Cron Jobs (Recommended for Production)
Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/course-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Create API endpoint `/api/cron/course-reminders/route.ts`:
```typescript
import { CourseReminderService } from '@/lib/email/reminder-service'

export async function GET() {
  await CourseReminderService.runScheduledTasks()
  return Response.json({ success: true })
}
```

#### Option 2: GitHub Actions (Free Tier)
Create `.github/workflows/course-reminders.yml`:
```yaml
name: Course Reminders
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run email:reminders
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
```

#### Option 3: Local Cron Job (Linux/Mac)
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 9 AM)
0 9 * * * cd /path/to/your/project && npm run email:reminders
```

#### Option 4: Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 9:00 AM
4. Action: Start a program
5. Program: `cmd`
6. Arguments: `/c cd "C:\path\to\project" && npm run email:reminders`

## Email Templates

### Welcome Email Features
- ✅ Personalized greeting
- ✅ Course details
- ✅ Instructor information
- ✅ Direct link to start learning
- ✅ Support contact information

### Completion Email Features
- ✅ Congratulations message
- ✅ Achievement badge
- ✅ Certificate download link
- ✅ Review request
- ✅ Course recommendation

### Reminder Email Features
- ✅ Progress visualization
- ✅ Motivation messaging
- ✅ Direct course access
- ✅ Unsubscribe option

## Course Reviews System

### Features
- ⭐ 5-star rating system
- 💬 Optional written comments
- ✅ Verified enrollment badges
- 📊 Rating statistics and breakdown
- 👥 Instructor replies
- 📅 Review timestamps

### API Endpoints
- `GET /api/courses/[id]/reviews` - Fetch reviews
- `POST /api/courses/[id]/reviews` - Submit review (enrolled users only)

### Review Validation
- Users must be enrolled to review
- One review per user per course
- Automatic verification badge for paid enrollments
- Content moderation ready

## Database Schema Updates

New tables added:
```sql
-- Course reviews
CREATE TABLE course_reviews (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  rating INTEGER NOT NULL (1-5),
  comment TEXT,
  is_verified_enrollment BOOLEAN,
  instructor_reply TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Testing the System

### 1. Test Welcome Emails
```bash
# Enroll in a free course to trigger welcome email
curl -X POST http://localhost:3000/api/courses/[course-id]/enroll
```

### 2. Test Reviews
1. Enroll in a course
2. Navigate to course page
3. Scroll to reviews section
4. Submit a review

### 3. Test Reminders
```bash
# Manually run reminder service
npm run email:reminders
```

## Production Deployment Checklist

- [ ] Configure Resend with your domain
- [ ] Set up automated scheduling (Vercel Cron recommended)
- [ ] Test all email templates
- [ ] Configure email tracking/analytics
- [ ] Set up error monitoring for email failures
- [ ] Configure unsubscribe handling
- [ ] Test review moderation workflow

## Monitoring & Analytics

### Email Delivery Tracking
Monitor email delivery through Resend dashboard:
- Delivery rates
- Open rates
- Click-through rates
- Bounce rates

### Review Analytics
Track course review metrics:
- Average ratings per course
- Review submission rates
- Review sentiment analysis
- Instructor response rates

## Troubleshooting

### Common Issues
1. **Emails not sending**: Check Resend API key and domain verification
2. **Reviews not showing**: Verify database schema migration
3. **Reminders not working**: Check cron job configuration
4. **Template rendering**: Check HTML email compatibility

### Debug Commands
```bash
# Test email service
node -e "
const { EmailService } = require('./lib/email/service.ts');
EmailService.sendEnrollmentWelcome({
  userEmail: 'test@example.com',
  userName: 'Test User',
  courseName: 'Test Course',
  courseId: '123',
  instructorName: 'Test Instructor'
});
"
```

## Cost Estimation

### Resend Pricing (as of 2025)
- **Free Tier**: 3,000 emails/month
- **Pro Tier**: $20/month for 50,000 emails
- **Business**: $80/month for 300,000 emails

### Recommended Setup
- Start with free tier for testing
- Upgrade to Pro when you reach 100+ active students
- Monitor email volume and upgrade as needed
