# SEO System Documentation

## Overview

The EdifyPub SEO system provides comprehensive search engine optimization capabilities with admin controls, analytics tracking, and automated sitemap generation. This system is designed to improve search visibility while providing detailed insights into page performance.

## Architecture

### Core Components

1. **SEO Configuration** (`lib/seo/config.ts`)
   - Centralized SEO settings and templates
   - Page type definitions and default configurations
   - Dynamic data interpolation functions

2. **SEO Service** (`lib/seo/service.ts`)
   - Business logic for SEO operations
   - Database interactions and caching
   - Analytics tracking and reporting

3. **SEO Schema** (`lib/seo/schema.ts`)
   - Database tables for SEO data
   - Indexes for optimal performance
   - Relationships between entities

4. **Admin Interface** (`components/admin-seo-management.tsx`)
   - Comprehensive management dashboard
   - Real-time analytics and reporting
   - Bulk operations and tools

## Features

### 1. Dynamic SEO Configuration

- **Page Type Templates**: Pre-configured SEO settings for different page types
- **Dynamic Data Interpolation**: Automatic replacement of placeholders with actual data
- **Canonical URLs**: Proper canonical URL generation and management
- **Meta Tags**: Comprehensive meta tag generation including Open Graph and Twitter Cards

### 2. Admin Management

- **SEO Settings Management**: Create, update, and delete SEO configurations
- **Redirect Management**: Handle 301/302 redirects with analytics tracking
- **Analytics Dashboard**: Real-time insights into page performance
- **Bulk Operations**: Mass updates and imports for SEO data

### 3. Analytics & Tracking

- **Page View Tracking**: Detailed analytics for each page visit
- **User Behavior Analysis**: Device, browser, and referrer tracking
- **Performance Metrics**: Page load times and user engagement
- **Search Engine Analytics**: Track search engine crawling and indexing

### 4. Automation

- **Sitemap Generation**: Automatic sitemap creation and updates
- **Robots.txt Management**: Dynamic robots.txt generation
- **Structured Data**: Automatic JSON-LD structured data generation
- **Cache Management**: Intelligent caching for optimal performance

## API Endpoints

### Main SEO API
- `GET /api/seo` - Retrieve SEO data for a page
- `POST /api/seo` - Update SEO configuration
- `DELETE /api/seo` - Remove SEO configuration

### Admin APIs
- `GET /api/admin/seo/settings` - Get all SEO settings
- `POST /api/admin/seo/settings` - Create/update SEO settings
- `GET /api/admin/seo/redirects` - Get redirect rules
- `POST /api/admin/seo/redirects` - Create redirect rules
- `GET /api/admin/seo/analytics` - Get analytics data
- `POST /api/admin/seo/sitemap` - Generate sitemap

### Tracking APIs
- `POST /api/seo/analytics/track` - Track page views
- `GET /api/seo/redirect` - Check for redirects
- `GET /api/seo/sitemap` - Get sitemap XML
- `GET /api/seo/robots` - Get robots.txt

## Components

### SEOTracking Component
```tsx
import SEOTracking from '@/components/seo-tracking'

<SEOTracking 
  pageTitle="Custom Page Title"
  userId="user123"
  additionalData={{ category: 'books' }}
/>
```

### SEOMetadata Component
```tsx
import SEOMetadata from '@/components/seo-metadata'

<SEOMetadata 
  pageType="BOOK"
  title="Book Title"
  description="Book Description"
  keywords={['fiction', 'romance']}
  image="/book-cover.jpg"
  canonicalUrl="https://edifybooks.com/books/book-slug"
/>
```

### useSEO Hook
```tsx
import { useSEO } from '@/hooks/use-seo'

const { seoData, loading, updateSEO, trackPageView } = useSEO({
  pageType: 'BOOK',
  id: 'book-123',
  dynamicData: { author: 'John Doe' },
  customConfig: {
    title: 'Custom Title',
    description: 'Custom Description'
  }
})
```

## Database Schema

### SEO Settings
```sql
CREATE TABLE seo_settings (
  id SERIAL PRIMARY KEY,
  page_path VARCHAR(255) NOT NULL,
  page_type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  keywords TEXT[],
  canonical_url VARCHAR(255),
  image_url VARCHAR(255),
  structured_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### SEO Redirects
```sql
CREATE TABLE seo_redirects (
  id SERIAL PRIMARY KEY,
  from_path VARCHAR(255) NOT NULL,
  to_path VARCHAR(255) NOT NULL,
  redirect_type INTEGER DEFAULT 301,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### SEO Analytics
```sql
CREATE TABLE seo_analytics (
  id SERIAL PRIMARY KEY,
  page_url VARCHAR(255) NOT NULL,
  page_title VARCHAR(255),
  referrer VARCHAR(255),
  user_agent TEXT,
  ip_address INET,
  session_id VARCHAR(255),
  user_id VARCHAR(255),
  page_type VARCHAR(50),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Page Types

The system supports the following page types:

- `HOME` - Homepage
- `BOOK` - Individual book pages
- `BOOKS` - Book listing pages
- `BLOG` - Blog post pages
- `BLOGS` - Blog listing pages
- `COURSE` - Course pages
- `COURSES` - Course listing pages
- `AUTHOR` - Author profile pages
- `CATEGORY` - Category pages
- `SEARCH` - Search result pages
- `ABOUT` - About page
- `CONTACT` - Contact page
- `SERVICES` - Services page
- `ACADEMY` - Academy page
- `PUBLISHING` - Publishing page
- `ACCOUNT` - Account pages
- `DASHBOARD` - Dashboard pages

## Configuration

### Default SEO Configuration
```typescript
const defaultSEOConfig = {
  siteName: 'EdifyPub',
  siteUrl: 'https://edifybooks.com',
  defaultTitle: 'EdifyPub - Digital Publishing Platform',
  defaultDescription: 'Discover inspiring books, writing services, and educational resources on EdifyPub.',
  defaultKeywords: ['digital publishing', 'books', 'writing services', 'education'],
  defaultImage: '/placeholder.jpg',
  twitterHandle: '@edifypub',
  facebookAppId: '',
  googleAnalyticsId: '',
  googleTagManagerId: '',
}
```

### Page Type Templates
Each page type has specific templates with placeholders:

```typescript
[PAGE_TYPES.BOOK]: {
  title: '{bookTitle} by {author} - EdifyPub',
  description: 'Read {bookTitle} by {author}. {bookDescription}',
  keywords: ['{genre}', '{author}', 'books', 'digital publishing'],
  structuredData: {
    '@type': 'Book',
    name: '{bookTitle}',
    author: '{author}',
    description: '{bookDescription}',
    publisher: 'EdifyPub',
    url: 'https://edifybooks.com/books/{bookSlug}'
  }
}
```

## Best Practices

### 1. SEO Optimization

- **Title Tags**: Keep titles under 60 characters
- **Meta Descriptions**: Keep descriptions under 160 characters
- **Keywords**: Use 3-5 relevant keywords per page
- **Images**: Always include alt text and optimize for web
- **URLs**: Use clean, descriptive URLs with hyphens

### 2. Performance

- **Caching**: Implement proper caching strategies
- **CDN**: Use CDN for static assets
- **Compression**: Enable gzip compression
- **Minification**: Minify CSS, JS, and HTML

### 3. Analytics

- **Track Everything**: Monitor all page interactions
- **Set Goals**: Define conversion goals and track them
- **Regular Audits**: Perform regular SEO audits
- **Monitor Rankings**: Track keyword rankings and traffic

### 4. Content

- **Quality Content**: Create high-quality, original content
- **Regular Updates**: Keep content fresh and updated
- **Internal Linking**: Use proper internal linking strategies
- **User Experience**: Focus on user experience and engagement

## Troubleshooting

### Common Issues

1. **SEO Data Not Loading**
   - Check API endpoint availability
   - Verify database connection
   - Check for JavaScript errors

2. **Analytics Not Tracking**
   - Ensure tracking component is properly included
   - Check network requests in browser dev tools
   - Verify API endpoint is receiving data

3. **Sitemap Not Updating**
   - Check sitemap generation endpoint
   - Verify database has current data
   - Check for cache issues

### Debug Mode

Enable debug mode by setting the environment variable:
```bash
SEO_DEBUG=true
```

This will provide detailed logging for all SEO operations.

## Maintenance

### Regular Tasks

1. **Monthly SEO Audits**
   - Review analytics data
   - Check for broken links
   - Verify sitemap accuracy

2. **Quarterly Content Review**
   - Update meta descriptions
   - Review keyword performance
   - Optimize underperforming pages

3. **Annual SEO Strategy Review**
   - Analyze year-over-year performance
   - Update SEO strategy
   - Plan content improvements

### Monitoring

Set up monitoring for:
- SEO API endpoint availability
- Database performance
- Analytics tracking accuracy
- Sitemap generation status

## Support

For issues or questions about the SEO system:

1. Check the logs for error messages
2. Review the API documentation
3. Test individual components
4. Contact the development team

---

This SEO system provides a comprehensive solution for managing search engine optimization across the EdifyPub platform. Regular maintenance and monitoring ensure optimal performance and search visibility.
