export const defaultEmailTemplates = [
  {
    name: 'Welcome Email',
    subject: 'Welcome to {{courseName}}! 🎉',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to {{courseName}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to DIFY Academy!</h1>
      <h2>{{courseName}}</h2>
    </div>
    <div class="content">
      <p>Hi {{userName}},</p>
      
      <p>Congratulations! You've successfully enrolled in <strong>{{courseName}}</strong>. We're excited to have you join our writing community!</p>
      
      <h3>What's Next?</h3>
      <ul>
        <li>📚 Access your course materials anytime</li>
        <li>🎯 Complete modules at your own pace</li>
        <li>💬 Connect with fellow writers</li>
        <li>📝 Get feedback from your instructor, {{instructorName}}</li>
      </ul>
      
      <p>Ready to start your writing journey?</p>
      
      <a href="{{courseUrl}}" class="button">Start Learning Now</a>
      
      <h3>Need Help?</h3>
      <p>If you have any questions, feel free to reach out to us at <a href="mailto:support@difyacademy.com">support@difyacademy.com</a></p>
      
      <p>Happy writing!</p>
      <p><strong>The DIFY Academy Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 DIFY Academy. All rights reserved.</p>
      <p>You received this email because you enrolled in a course at DIFY Academy.</p>
    </div>
  </div>
</body>
</html>
    `,
    variables: {
      userName: 'string',
      courseName: 'string',
      instructorName: 'string',
      courseUrl: 'string'
    }
  },
  {
    name: 'Course Completion',
    subject: '🏆 Congratulations! You\'ve completed {{courseName}}',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Course Completion</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10B981, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .achievement { background: white; border: 2px solid #10B981; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
    .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏆 Congratulations!</h1>
      <h2>Course Completed</h2>
    </div>
    <div class="content">
      <p>Hi {{userName}},</p>
      
      <div class="achievement">
        <h3>🎉 You've successfully completed</h3>
        <h2 style="color: #8B5CF6;">{{courseName}}</h2>
        <p>Completed on: {{completionDate}}</p>
      </div>
      
      <p>This is a significant achievement! You've demonstrated dedication and commitment to improving your writing skills.</p>
      
      <h3>What's Next?</h3>
      <ul>
        <li>🏅 Download your completion certificate</li>
        <li>📝 Leave a review to help other writers</li>
        <li>🔍 Explore more advanced courses</li>
        <li>💬 Join our alumni community</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="{{certificateUrl}}" class="button">Download Certificate</a>
        <a href="{{reviewUrl}}" class="button">Leave a Review</a>
      </div>
      
      <p>Keep writing and keep growing!</p>
      <p><strong>The DIFY Academy Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 DIFY Academy. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    variables: {
      userName: 'string',
      courseName: 'string',
      completionDate: 'date',
      certificateUrl: 'string',
      reviewUrl: 'string'
    }
  },
  {
    name: 'Weekly Newsletter',
    subject: '📚 Your Weekly DIFY Academy Digest',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DIFY Academy Weekly Digest</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; }
    .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #8B5CF6; }
    .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 DIFY Academy Weekly Digest</h1>
    <p>Your weekly dose of writing inspiration and learning opportunities</p>
  </div>
  
  <div class="content">
    <p>Hi {{userName}},</p>
    
    <div class="section">
      <h2>🔥 This Week's Highlights</h2>
      <p>{{weeklyHighlights}}</p>
    </div>

    <div class="section">
      <h2>📖 Featured Course</h2>
      <h3>{{featuredCourseTitle}}</h3>
      <p>{{featuredCourseDescription}}</p>
      <a href="{{featuredCourseUrl}}" class="button">Learn More</a>
    </div>

    <div class="section">
      <h2>✍️ Latest Blog Posts</h2>
      {{blogPosts}}
    </div>

    <div class="section">
      <h2>🎯 Writer's Tip of the Week</h2>
      <blockquote style="font-style: italic; border-left: 3px solid #8B5CF6; padding-left: 15px; margin: 15px 0;">
        {{weeklyTip}}
      </blockquote>
    </div>

    <div class="section">
      <h2>📅 Upcoming Events</h2>
      <p>{{upcomingEvents}}</p>
    </div>
  </div>

  <div class="footer">
    <p>Keep writing, keep growing! 🚀</p>
    <p><strong>The DIFY Academy Team</strong></p>
  </div>
</body>
</html>
    `,
    variables: {
      userName: 'string',
      weeklyHighlights: 'html',
      featuredCourseTitle: 'string',
      featuredCourseDescription: 'string',
      featuredCourseUrl: 'string',
      blogPosts: 'html',
      weeklyTip: 'string',
      upcomingEvents: 'html'
    }
  },
  {
    name: 'Promotional Email',
    subject: '🎉 {{offerTitle}} - Limited Time Offer!',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{offerTitle}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 40px; }
    .hero-section { background: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; font-size: 16px; }
    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
    .discount-banner { background: linear-gradient(135deg, #F59E0B, #EF4444); color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌟 DIFY Academy</h1>
    <h2>{{offerTitle}}</h2>
  </div>
  
  <div class="content">
    <div class="hero-section">
      <h2 style="color: #8B5CF6; margin-bottom: 20px;">{{offerTitle}}</h2>
      <p style="font-size: 18px; line-height: 1.6; margin-bottom: 25px;">{{offerDescription}}</p>
      
      <div class="discount-banner">
        <h3 style="margin: 0; font-size: 24px;">Save {{discount}}!</h3>
        <p style="margin: 5px 0 0 0;">Limited time offer - expires {{expiryDate}}</p>
      </div>
      
      <a href="{{ctaUrl}}" class="cta-button">{{ctaText}}</a>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px;">
      <h3>Why Choose DIFY Academy?</h3>
      <ul style="list-style: none; padding: 0;">
        <li style="padding: 8px 0;"><strong>✅ Expert Instructors:</strong> Learn from published authors and industry professionals</li>
        <li style="padding: 8px 0;"><strong>✅ Practical Approach:</strong> Hands-on exercises and real-world applications</li>
        <li style="padding: 8px 0;"><strong>✅ Community Support:</strong> Connect with fellow writers and get feedback</li>
        <li style="padding: 8px 0;"><strong>✅ Lifetime Access:</strong> Learn at your own pace with permanent access</li>
      </ul>
    </div>
    
    <p style="text-align: center; margin-top: 30px;">
      <small>Offer valid until {{expiryDate}}. Cannot be combined with other offers.</small>
    </p>
  </div>

  <div class="footer">
    <p>Transform your writing today! ✨</p>
    <p><strong>The DIFY Academy Team</strong></p>
  </div>
</body>
</html>
    `,
    variables: {
      userName: 'string',
      offerTitle: 'string',
      offerDescription: 'string',
      discount: 'string',
      expiryDate: 'date',
      ctaText: 'string',
      ctaUrl: 'string'
    }
  },
  {
    name: 'Course Reminder',
    subject: 'Don\'t forget to continue your writing journey! 📚',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Course Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #F59E0B, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .progress-bar { background: #e5e5e5; border-radius: 10px; overflow: hidden; margin: 15px 0; }
    .progress-fill { background: #8B5CF6; height: 20px; transition: width 0.3s ease; }
    .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 Your Writing Journey Awaits</h1>
    </div>
    <div class="content">
      <p>Hi {{userName}},</p>
      
      <p>We noticed you haven't been active in <strong>{{courseName}}</strong> since {{lastActivityDate}}. Don't let your writing momentum fade away!</p>
      
      <div>
        <h3>Your Progress</h3>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {{progress}}%;"></div>
        </div>
        <p><strong>{{progress}}% Complete</strong> - You're doing great!</p>
      </div>
      
      <h3>Why Continue?</h3>
      <ul>
        <li>✨ Keep your creative momentum going</li>
        <li>🎯 Achieve your writing goals</li>
        <li>📈 Build consistent writing habits</li>
        <li>🏆 Complete the course and earn your certificate</li>
      </ul>
      
      <p>Just 15 minutes a day can make a huge difference in your writing journey!</p>
      
      <a href="{{courseUrl}}" class="button">Continue Learning</a>
      
      <p>Keep writing!</p>
      <p><strong>The DIFY Academy Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 DIFY Academy. All rights reserved.</p>
      <p><a href="{{unsubscribeUrl}}">Unsubscribe from reminders</a></p>
    </div>
  </div>
</body>
</html>
    `,
    variables: {
      userName: 'string',
      courseName: 'string',
      lastActivityDate: 'date',
      progress: 'number',
      courseUrl: 'string',
      unsubscribeUrl: 'string'
    }
  }
]
