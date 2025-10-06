# Email Templates & Newsletter System Documentation

## Overview

This comprehensive email system provides:
- **Email Template Management**: Create, edit, and manage reusable email templates
- **Newsletter Management**: Manage subscribers and send newsletters
- **Automated Scheduling**: Support for automated weekly newsletters
- **Template Variables**: Dynamic content injection with template variables
- **GDPR Compliance**: Automatic unsubscribe links and privacy compliance

## Features

### 🎨 Email Template Management
- Create custom email templates with HTML content
- Template variable system for dynamic content (`{{variableName}}`)
- Template preview with sample data
- Pre-built templates for common use cases
- Template versioning and management

### 📧 Newsletter System
- Subscriber management with active/inactive status
- Newsletter composition with template selection or custom content
- Bulk email sending with rate limiting
- Target audience selection (all, new, engaged subscribers)
- Scheduled newsletter support

### 🔄 Automation
- Automated weekly digest compilation
- Scheduled newsletter sending via cron jobs
- Welcome emails for new subscribers
- Course enrollment and completion emails

## API Endpoints

### Email Templates
```
GET    /api/admin/email-templates           # List all templates
POST   /api/admin/email-templates           # Create new template
GET    /api/admin/email-templates/[id]      # Get specific template
PUT    /api/admin/email-templates/[id]      # Update template
DELETE /api/admin/email-templates/[id]      # Delete template
POST   /api/admin/email-templates/[id]/preview # Preview template
POST   /api/admin/email-templates/seed      # Seed default templates
```

### Newsletter Management
```
GET    /api/admin/newsletter/subscribers    # List subscribers
POST   /api/admin/newsletter/subscribers    # Add subscriber
PUT    /api/admin/newsletter/subscribers/[id] # Update subscriber
DELETE /api/admin/newsletter/subscribers/[id] # Remove subscriber
POST   /api/admin/newsletter/send           # Send newsletter
GET    /api/admin/newsletter/send           # Get newsletter stats
```

### Public Newsletter APIs
```
POST   /api/newsletter/subscribe            # Public subscription
GET    /api/newsletter/subscribe            # Check subscription status
GET    /api/newsletter/unsubscribe          # Unsubscribe (with email param)
```

### Scheduled Newsletters
```
GET    /api/newsletter/scheduled            # Cron job endpoint
POST   /api/newsletter/scheduled            # Manual trigger
```

## Template Variables

### Common Variables
- `{{userName}}` - User's display name
- `{{userEmail}}` - User's email address
- `{{currentDate}}` - Current date
- `{{siteUrl}}` - Website URL

### Course-Related Variables
- `{{courseName}}` - Course title
- `{{instructorName}}` - Instructor name
- `{{courseUrl}}` - Direct link to course
- `{{progress}}` - Course completion percentage
- `{{completionDate}}` - Course completion date
- `{{certificateUrl}}` - Certificate download link

### Newsletter Variables
- `{{weeklyHighlights}}` - Weekly content highlights
- `{{featuredCourse}}` - Featured course content
- `{{blogPosts}}` - Latest blog posts
- `{{weeklyTip}}` - Writing tip of the week
- `{{upcomingEvents}}` - Upcoming events

### Promotional Variables
- `{{offerTitle}}` - Promotion title
- `{{offerDescription}}` - Promotion description
- `{{discount}}` - Discount amount/percentage
- `{{expiryDate}}` - Offer expiry date
- `{{ctaText}}` - Call-to-action button text
- `{{ctaUrl}}` - Call-to-action URL

## Default Templates

### 1. Welcome Email
**Purpose**: Sent when users enroll in a course
**Variables**: `userName`, `courseName`, `instructorName`, `courseUrl`
**Trigger**: Course enrollment

### 2. Course Completion
**Purpose**: Congratulate users on course completion
**Variables**: `userName`, `courseName`, `completionDate`, `certificateUrl`
**Trigger**: Course completion

### 3. Weekly Newsletter
**Purpose**: Regular newsletter with updates and content
**Variables**: `userName`, `weeklyHighlights`, `featuredCourse`, `blogPosts`
**Trigger**: Scheduled (weekly)

### 4. Promotional Email
**Purpose**: Marketing campaigns and special offers
**Variables**: `userName`, `offerTitle`, `discount`, `expiryDate`, `ctaUrl`
**Trigger**: Manual/scheduled

### 5. Course Reminder
**Purpose**: Re-engage inactive students
**Variables**: `userName`, `courseName`, `progress`, `lastActivityDate`
**Trigger**: Automated based on inactivity

## Usage Examples

### Creating a Template
```typescript
const template = {
  name: 'Welcome Email',
  subject: 'Welcome to {{courseName}}!',
  content: '<h1>Hi {{userName}}</h1><p>Welcome to {{courseName}}...</p>',
  variables: {
    userName: 'string',
    courseName: 'string'
  }
}

fetch('/api/admin/email-templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(template)
})
```

### Sending a Newsletter
```typescript
const newsletter = {
  subject: 'Weekly Update',
  templateId: 'template-id',
  targetAudience: 'active',
  scheduledAt: '2025-07-25T09:00:00Z' // Optional
}

fetch('/api/admin/newsletter/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newsletter)
})
```

### Newsletter Subscription (Frontend)
```typescript
const subscribe = async (email: string) => {
  const response = await fetch('/api/newsletter/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  return response.json()
}
```

## Scheduling & Automation

### Vercel Cron Jobs (Recommended)
Add to `vercel.json`:
```json
{
  "cron": [
    {
      "path": "/api/newsletter/scheduled",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

### Manual Cron Job
```bash
# Weekly newsletter every Monday at 9 AM
0 9 * * 1 curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/newsletter/scheduled
```

### GitHub Actions
```yaml
name: Weekly Newsletter
on:
  schedule:
    - cron: '0 9 * * 1'
jobs:
  send-newsletter:
    runs-on: ubuntu-latest
    steps:
      - name: Send Newsletter
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
               https://yourdomain.com/api/newsletter/scheduled
```

## Environment Variables

```env
# Required
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=DIFY Academy <noreply@difyacademy.com>
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional
CRON_SECRET=your_cron_secret_key
ADMIN_SECRET=your_admin_secret_key
```

## Components

### Admin Components
- `AdminEmailTemplates` - Template management interface
- `AdminNewsletterManagement` - Newsletter and subscriber management

### Public Components
- `NewsletterSubscription` - Public subscription form (3 variants)

## Best Practices

### Template Design
1. **Mobile-First**: Design templates to work on mobile devices
2. **Consistent Branding**: Use consistent colors, fonts, and styling
3. **Clear CTAs**: Make call-to-action buttons prominent and clear
4. **Accessible**: Use proper contrast ratios and alt text for images

### Content Strategy
1. **Value-First**: Always provide value to subscribers
2. **Consistent Schedule**: Send newsletters on a regular schedule
3. **Personalization**: Use subscriber data for personalized content
4. **Segmentation**: Target different audience segments appropriately

### Technical Considerations
1. **Rate Limiting**: Implement proper rate limiting for bulk sends
2. **Error Handling**: Handle email delivery failures gracefully
3. **Monitoring**: Monitor delivery rates and engagement metrics
4. **Testing**: Always test templates before sending to subscribers

## Monitoring & Analytics

### Email Metrics to Track
- **Delivery Rate**: Percentage of emails successfully delivered
- **Open Rate**: Percentage of delivered emails opened
- **Click-Through Rate**: Percentage of opened emails with link clicks
- **Unsubscribe Rate**: Percentage of recipients unsubscribing

### Resend Dashboard
Monitor your email performance in the Resend dashboard:
- View delivery statistics
- Track bounces and complaints
- Monitor domain reputation
- Analyze engagement metrics

## Troubleshooting

### Common Issues

1. **Emails Not Sending**
   - Check Resend API key configuration
   - Verify domain authentication
   - Check rate limits

2. **Templates Not Rendering**
   - Verify variable syntax (`{{variableName}}`)
   - Check for HTML syntax errors
   - Ensure proper escaping

3. **High Bounce Rate**
   - Validate email addresses before adding
   - Clean subscriber list regularly
   - Check domain reputation

4. **Low Open Rates**
   - Improve subject lines
   - Check sender reputation
   - Verify email isn't in spam folders

### Debug Tools
```bash
# Test template rendering
curl -X POST /api/admin/email-templates/[id]/preview \
  -H "Content-Type: application/json" \
  -d '{"sampleData": {"userName": "John", "courseName": "Writing 101"}}'

# Check newsletter stats
curl /api/admin/newsletter/send

# Test scheduled newsletter
curl -X POST /api/newsletter/scheduled \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "your_admin_secret"}'
```

## Security Considerations

1. **API Protection**: All admin endpoints require authentication
2. **Rate Limiting**: Implement rate limiting for public endpoints
3. **Input Validation**: Validate all user inputs
4. **Secure Secrets**: Store API keys and secrets securely
5. **GDPR Compliance**: Automatic unsubscribe links and data protection

## Cost Optimization

### Resend Pricing (2025)
- **Free Tier**: 3,000 emails/month
- **Pro Tier**: $20/month for 50,000 emails
- **Business**: $80/month for 300,000 emails

### Optimization Tips
1. **Clean Lists**: Remove inactive subscribers regularly
2. **Segment Wisely**: Send targeted emails to reduce waste
3. **Monitor Metrics**: Track engagement to improve efficiency
4. **Batch Processing**: Use proper batching for bulk sends

## Future Enhancements

### Planned Features
- [ ] A/B testing for subject lines
- [ ] Advanced segmentation rules
- [ ] Email analytics dashboard
- [ ] Template marketplace
- [ ] Automated drip campaigns
- [ ] SMS integration
- [ ] Advanced personalization AI

### Integration Opportunities
- [ ] CRM integration (HubSpot, Salesforce)
- [ ] Analytics platforms (Google Analytics, Mixpanel)
- [ ] Social media cross-posting
- [ ] E-commerce platforms
- [ ] Learning management system integration
