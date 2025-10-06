interface BlogStructuredDataProps {
  post: {
    id: string
    title: string
    excerpt: string | null
    content: string
    slug: string
    coverImage: string | null
    category: string | null
    publishedAt: string | null
    updatedAt: string
    author: {
      name: string
      avatar: string | null
    } | null
  }
  url: string
}

export default function BlogStructuredData({ post, url }: BlogStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || '',
    image: post.coverImage ? [post.coverImage] : ['/edlogo.jpg'],
    datePublished: post.publishedAt || post.updatedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'EdifyPub Team',
      image: post.author?.avatar,
    },
    publisher: {
      '@type': 'Organization',
      name: 'EdifyPub',
      logo: {
        '@type': 'ImageObject',
        url: `${url}/edlogo.jpg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${url}/blog/${post.slug}`,
    },
    articleSection: post.category || 'Publishing',
    inLanguage: 'en-US',
    url: `${url}/blog/${post.slug}`,
    wordCount: post.content.split(' ').length,
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${url}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${url}/blog/${post.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </>
  )
}
