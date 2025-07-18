import { z } from 'zod'

// SEO Schema for validation
export const seoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(60, 'Title should be under 60 characters'),
  description: z.string().min(1, 'Description is required').max(160, 'Description should be under 160 characters'),
  keywords: z.array(z.string()).max(10, 'Maximum 10 keywords allowed'),
  canonicalUrl: z.string().url('Must be a valid URL').optional(),
  ogTitle: z.string().max(60, 'OG Title should be under 60 characters').optional(),
  ogDescription: z.string().max(160, 'OG Description should be under 160 characters').optional(),
  ogImage: z.string().url('Must be a valid URL').optional(),
  ogType: z.enum(['website', 'article', 'book', 'profile']).default('website'),
  twitterCard: z.enum(['summary', 'summary_large_image', 'app', 'player']).default('summary_large_image'),
  twitterSite: z.string().optional(),
  twitterCreator: z.string().optional(),
  robotsIndex: z.boolean().default(true),
  robotsFollow: z.boolean().default(true),
  structuredData: z.record(z.any()).optional(),
  priority: z.number().min(0).max(1).default(0.5),
  changeFreq: z.enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']).default('monthly'),
  lastModified: z.date().optional(),
})

export type SEOData = z.infer<typeof seoSchema>

// Page types for SEO
export const PAGE_TYPES = {
  HOME: 'home',
  BOOKS: 'books',
  BOOK_DETAIL: 'book-detail',
  BLOG: 'blog',
  BLOG_POST: 'blog-post',
  ACADEMY: 'academy',
  COURSE: 'course',
  ABOUT: 'about',
  CONTACT: 'contact',
  PUBLISHING: 'publishing',
  AUTHOR: 'author',
  CATEGORY: 'category',
  SEARCH: 'search',
  ACCOUNT: 'account',
  ADMIN: 'admin',
} as const

export type PageType = typeof PAGE_TYPES[keyof typeof PAGE_TYPES]

// Default SEO configurations
export const defaultSEOConfig: Record<PageType, Partial<SEOData>> = {
  home: {
    title: 'EdifyPub - Digital Publishing Platform',
    description: 'Discover inspiring books, courses, and resources on EdifyPub. Your gateway to digital publishing and learning.',
    keywords: ['digital publishing', 'ebooks', 'online courses', 'writing platform', 'book marketplace'],
    ogType: 'website',
    priority: 1.0,
    changeFreq: 'daily',
  },
  books: {
    title: 'Books - EdifyPub',
    description: 'Explore our extensive collection of digital books across various genres and topics.',
    keywords: ['books', 'ebooks', 'digital books', 'reading', 'literature'],
    ogType: 'website',
    priority: 0.9,
    changeFreq: 'daily',
  },
  'book-detail': {
    title: '{book.title} - EdifyPub',
    description: '{book.description}',
    keywords: ['{book.genre}', '{book.category}', 'ebook', 'digital book'],
    ogType: 'book',
    priority: 0.8,
    changeFreq: 'weekly',
  },
  blog: {
    title: 'Blog - EdifyPub',
    description: 'Read the latest insights, tips, and stories about writing, publishing, and the creative journey.',
    keywords: ['blog', 'writing tips', 'publishing advice', 'author insights'],
    ogType: 'website',
    priority: 0.7,
    changeFreq: 'daily',
  },
  'blog-post': {
    title: '{post.title} - EdifyPub Blog',
    description: '{post.excerpt}',
    keywords: ['{post.tags}', 'blog', 'writing', 'publishing'],
    ogType: 'article',
    priority: 0.6,
    changeFreq: 'weekly',
  },
  academy: {
    title: 'Academy - EdifyPub',
    description: 'Enhance your writing and publishing skills with our comprehensive courses and tutorials.',
    keywords: ['writing courses', 'publishing courses', 'online learning', 'education'],
    ogType: 'website',
    priority: 0.8,
    changeFreq: 'weekly',
  },
  course: {
    title: '{course.title} - EdifyPub Academy',
    description: '{course.description}',
    keywords: ['{course.category}', 'course', 'online learning', 'education'],
    ogType: 'website',
    priority: 0.7,
    changeFreq: 'weekly',
  },
  about: {
    title: 'About - EdifyPub',
    description: 'Learn about EdifyPub, our mission to democratize digital publishing and empower authors worldwide.',
    keywords: ['about edifypub', 'digital publishing', 'author platform', 'publishing services'],
    ogType: 'website',
    priority: 0.6,
    changeFreq: 'monthly',
  },
  contact: {
    title: 'Contact - EdifyPub',
    description: 'Get in touch with the EdifyPub team for support, partnerships, or general inquiries.',
    keywords: ['contact', 'support', 'help', 'customer service'],
    ogType: 'website',
    priority: 0.5,
    changeFreq: 'monthly',
  },
  publishing: {
    title: 'Publishing - EdifyPub',
    description: 'Publish your work with EdifyPub and reach a global audience through our digital platform.',
    keywords: ['publish book', 'self publishing', 'digital publishing', 'author services'],
    ogType: 'website',
    priority: 0.8,
    changeFreq: 'weekly',
  },
  author: {
    title: '{author.name} - EdifyPub',
    description: 'Discover books and content by {author.name} on EdifyPub.',
    keywords: ['{author.name}', 'author', 'books', 'writer'],
    ogType: 'profile',
    priority: 0.6,
    changeFreq: 'monthly',
  },
  category: {
    title: '{category.name} Books - EdifyPub',
    description: 'Explore {category.name} books and resources on EdifyPub.',
    keywords: ['{category.name}', 'books', 'category', 'genre'],
    ogType: 'website',
    priority: 0.7,
    changeFreq: 'weekly',
  },
  search: {
    title: 'Search Results - EdifyPub',
    description: 'Find books, courses, and resources on EdifyPub.',
    keywords: ['search', 'find books', 'discover content'],
    ogType: 'website',
    priority: 0.4,
    changeFreq: 'never',
    robotsIndex: false,
  },
  account: {
    title: 'My Account - EdifyPub',
    description: 'Manage your EdifyPub account, orders, and library.',
    keywords: ['account', 'profile', 'dashboard'],
    ogType: 'website',
    priority: 0.3,
    changeFreq: 'never',
    robotsIndex: false,
  },
  admin: {
    title: 'Admin Dashboard - EdifyPub',
    description: 'Administrative dashboard for EdifyPub management.',
    keywords: ['admin', 'dashboard', 'management'],
    ogType: 'website',
    priority: 0.1,
    changeFreq: 'never',
    robotsIndex: false,
  },
}

// Utility functions for SEO
export const interpolateTemplate = (template: string, data: Record<string, any>): string => {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    const keys = key.split('.')
    let value = data
    
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) return match
    }
    
    return String(value)
  })
}

export const generateSEOTags = (seoData: SEOData, baseUrl: string = 'https://edifybooks.com') => {
  const robots = `${seoData.robotsIndex ? 'index' : 'noindex'},${seoData.robotsFollow ? 'follow' : 'nofollow'}`
  
  return {
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords.join(', '),
    canonical: seoData.canonicalUrl || baseUrl,
    robots,
    openGraph: {
      title: seoData.ogTitle || seoData.title,
      description: seoData.ogDescription || seoData.description,
      url: seoData.canonicalUrl || baseUrl,
      siteName: 'EdifyPub',
      images: seoData.ogImage ? [{ url: seoData.ogImage }] : [],
      type: seoData.ogType,
    },
    twitter: {
      card: seoData.twitterCard,
      site: seoData.twitterSite || '@edifypub',
      creator: seoData.twitterCreator || '@edifypub',
      title: seoData.ogTitle || seoData.title,
      description: seoData.ogDescription || seoData.description,
      images: seoData.ogImage ? [seoData.ogImage] : [],
    },
    alternates: {
      canonical: seoData.canonicalUrl || baseUrl,
    },
    other: {
      'revisit-after': '7 days',
      'distribution': 'global',
      'rating': 'general',
      'language': 'en',
      'geo.region': 'NG',
      'geo.country': 'Nigeria',
      'geo.placename': 'Nigeria',
    },
  }
}

export const generateStructuredData = (type: string, data: any) => {
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  }

  return JSON.stringify(baseStructuredData)
}

// Common structured data generators
export const generateBookStructuredData = (book: any) => {
  return generateStructuredData('Book', {
    name: book.title,
    author: {
      '@type': 'Person',
      name: book.author,
    },
    description: book.description,
    genre: book.genre,
    isbn: book.isbn,
    publisher: {
      '@type': 'Organization',
      name: 'EdifyPub',
    },
    datePublished: book.publishedAt,
    image: book.coverImage,
    url: `https://edifybooks.com/books/${book.slug}`,
    offers: {
      '@type': 'Offer',
      price: book.price,
      priceCurrency: book.currency,
      availability: 'https://schema.org/InStock',
    },
  })
}

export const generateArticleStructuredData = (article: any) => {
  return generateStructuredData('Article', {
    headline: article.title,
    description: article.excerpt,
    image: article.featuredImage,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'EdifyPub',
      logo: {
        '@type': 'ImageObject',
        url: 'https://edifybooks.com/logo.png',
      },
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    url: `https://edifybooks.com/blog/${article.slug}`,
  })
}

export const generateOrganizationStructuredData = () => {
  return generateStructuredData('Organization', {
    name: 'EdifyPub',
    url: 'https://edifybooks.com',
    logo: 'https://edifybooks.com/logo.png',
    description: 'Digital publishing platform empowering authors and readers worldwide',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+234-XXX-XXX-XXXX',
      contactType: 'customer service',
      areaServed: 'NG',
      availableLanguage: 'en',
    },
    sameAs: [
      'https://twitter.com/edifypub',
      'https://facebook.com/edifypub',
      'https://instagram.com/edifypub',
    ],
  })
}
