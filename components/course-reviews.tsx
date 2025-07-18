"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, MessageSquare, CheckCircle } from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string | null
  isVerifiedEnrollment: boolean
  instructorReply: string | null
  repliedAt: string | null
  createdAt: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingCounts: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

interface CourseReviewsProps {
  courseId: string
  isEnrolled: boolean
}

export default function CourseReviews({ courseId, isEnrolled }: CourseReviewsProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [courseId])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${courseId}/reviews`)
      const result = await response.json()
      
      if (result.success) {
        setReviews(result.data.reviews)
        setStats(result.data.statistics)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!session) {
      setError('Please sign in to leave a review')
      return
    }

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Review submitted successfully!')
        setShowReviewForm(false)
        setRating(0)
        setComment('')
        fetchReviews() // Refresh reviews
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, size = 'w-4 h-4', interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRatingPercentage = (ratingValue: number) => {
    if (!stats || stats.totalReviews === 0) return 0
    return (stats.ratingCounts[ratingValue as keyof typeof stats.ratingCounts] / stats.totalReviews) * 100
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id="reviews">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Course Reviews
        </CardTitle>
        {stats && (
          <CardDescription>
            {stats.averageRating.toFixed(1)} out of 5 stars ({stats.totalReviews} reviews)
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Rating Overview */}
        {stats && stats.totalReviews > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(stats.averageRating), 'w-5 h-5')}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on {stats.totalReviews} reviews
              </p>
            </div>
            
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{star}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getRatingPercentage(star)}%` }}
                    />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 w-8">
                    {stats.ratingCounts[star as keyof typeof stats.ratingCounts]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Form */}
        {isEnrolled && session && (
          <div className="border-t pt-6">
            {!showReviewForm ? (
              <Button onClick={() => setShowReviewForm(true)}>
                Write a Review
              </Button>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold">Write Your Review</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  {renderStars(rating, 'w-6 h-6', true, setRating)}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this course..."
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {comment.length}/1000 characters
                  </p>
                </div>

                {error && (
                  <Alert>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmitReview}
                    disabled={submitting || rating === 0}
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowReviewForm(false)
                      setRating(0)
                      setComment('')
                      setError(null)
                      setSuccess(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No reviews yet. Be the first to review this course!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={review.user.avatar || undefined} />
                      <AvatarFallback>
                        {review.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.user.name}</span>
                        {review.isVerifiedEnrollment && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {review.comment}
                  </p>
                )}

                {review.instructorReply && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 ml-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">Instructor Reply</Badge>
                      <span className="text-xs text-gray-500">
                        {review.repliedAt && formatDate(review.repliedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {review.instructorReply}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
