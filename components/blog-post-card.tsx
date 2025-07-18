'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User, ArrowRight, BookOpen } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'

interface BlogPost {
  id: string
  title: string
  excerpt: string | null
  slug: string
  coverImage: string | null
  category: string | null
  tags: string[]
  status?: 'draft' | 'published' | 'archived'
  publishedAt: string | null
  createdAt?: string
  updatedAt?: string
  author: {
    id: string
    name: string
    avatar: string | null
  } | null
}

interface BlogPostCardProps {
  post: BlogPost
  featured?: boolean
}

export default function BlogPostCard({ post, featured = false }: BlogPostCardProps) {
  const getCategoryColor = (category: string | null) => {
    if (!category) return 'bg-gray-100 text-gray-800'
    
    const colors: Record<string, string> = {
      'writing': 'bg-purple-100 text-purple-800',
      'publishing': 'bg-blue-100 text-blue-800',
      'academy': 'bg-green-100 text-green-800',
      'industry': 'bg-yellow-100 text-yellow-800',
      'tips': 'bg-pink-100 text-pink-800',
      'news': 'bg-indigo-100 text-indigo-800',
    }
    
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  const estimateReadTime = (text: string | null) => {
    if (!text) return 1
    const wordsPerMinute = 200
    const words = text.split(' ').length
    return Math.ceil(words / wordsPerMinute)
  }

  if (featured) {
    return (
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="md:flex">
          <div className="md:w-1/2">
            {post.coverImage ? (
              <div className="relative h-64 md:h-full">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-64 md:h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-purple-400 dark:text-purple-600" />
              </div>
            )}
          </div>
          <div className="md:w-1/2 p-8">
            <div className="flex items-center gap-2 mb-4">
              {post.category && (
                <Badge className={getCategoryColor(post.category)}>
                  {post.category}
                </Badge>
              )}
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4 mr-1" />
                {estimateReadTime(post.excerpt)} min read
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-4 hover:text-purple-600 transition-colors">
              <Link href={`/blog/${post.slug}`}>
                {post.title}
              </Link>
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {post.excerpt || 'No excerpt available'}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {post.author?.avatar ? (
                  <Image
                    src={post.author.avatar}
                    alt={post.author.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {post.author?.name || 'Unknown Author'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {post.publishedAt && formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <Button asChild>
                <Link href={`/blog/${post.slug}`}>
                  Read More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full">
      {post.coverImage && (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-3">
          {post.category && (
            <Badge className={getCategoryColor(post.category)}>
              {post.category}
            </Badge>
          )}
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-1" />
            {estimateReadTime(post.excerpt)} min read
          </div>
        </div>
        
        <CardTitle className="text-lg hover:text-purple-600 transition-colors">
          <Link href={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col">
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-1">
          {post.excerpt || 'No excerpt available'}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {post.author?.avatar ? (
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <User className="h-3 w-3 text-gray-600 dark:text-gray-300" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {post.author?.name || 'Unknown Author'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {post.publishedAt && formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/blog/${post.slug}`} className="group">
              Read More
              <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
