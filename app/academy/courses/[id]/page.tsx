"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import CourseReviews from '@/components/course-reviews'
import { 
  Clock, 
  BookOpen, 
  Play, 
  Lock, 
  CheckCircle, 
  CreditCard,
  ArrowLeft,
  Users,
  Star
} from 'lucide-react'

interface CourseModule {
  id: string
  title: string
  content: string | null
  videoUrl: string | null
  duration: number
  order: number
  isPreview: boolean
}

interface CourseData {
  id: string
  title: string
  description: string
  price: string
  thumbnailImage: string | null
  duration: number
  level: string
  instructor: {
    id: string
    name: string
    avatar: string | null
    bio: string | null
  }
  modules: CourseModule[]
  totalModules: number
  isEnrolled: boolean
  enrollment: any
}

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [course, setCourse] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchCourse()
    }
  }, [params.id])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${params.id}`)
      const result = await response.json()
      
      if (result.success) {
        setCourse(result.data)
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      setError('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/academy/courses/${params.id}`)
      return
    }

    if (!course) return

    try {
      setEnrolling(true)
      const response = await fetch(`/api/courses/${params.id}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: 'paystack',
          redirectUrl: `${window.location.origin}/academy/courses/${params.id}`,
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (result.data.paymentRequired && result.data.payment) {
          // Redirect to payment
          window.location.href = result.data.payment.authorizationUrl
        } else {
          // Free course - refresh to show enrolled state
          fetchCourse()
        }
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Error enrolling:', error)
      setError('Failed to enroll in course')
    } finally {
      setEnrolling(false)
    }
  }

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    return numPrice === 0 ? 'Free' : `₦${numPrice.toLocaleString()}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
              </div>
              <div>
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container py-8">
          <Alert className="max-w-md mx-auto">
            <AlertDescription>
              {error || 'Course not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <div className="relative h-64 rounded-lg overflow-hidden mb-6">
              <Image
                src={course.thumbnailImage || '/placeholder.jpg'}
                alt={course.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-end">
                <div className="p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getLevelColor(course.level)}>
                      {course.level}
                    </Badge>
                    {course.isEnrolled && (
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enrolled
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                  <p className="text-gray-200">{course.description}</p>
                </div>
              </div>
            </div>

            {/* Instructor */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    {course.instructor.avatar ? (
                      <Image
                        src={course.instructor.avatar}
                        alt={course.instructor.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                        {course.instructor.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{course.instructor.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Course Instructor</p>
                  </div>
                </div>
                {course.instructor.bio && (
                  <p className="text-gray-600 dark:text-gray-400 mt-4">
                    {course.instructor.bio}
                  </p>
                )}
              </CardHeader>
            </Card>

            {/* Course Progress (if enrolled) */}
            {course.isEnrolled && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Your Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{course.enrollment?.progress || 0}%</span>
                    </div>
                    <Progress value={course.enrollment?.progress || 0} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Modules */}
            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
                <CardDescription>
                  {course.totalModules} modules • {formatDuration(course.duration)} total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {course.modules.map((module, index) => (
                    <div
                      key={module.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          {course.isEnrolled || module.isPreview ? (
                            <Play className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{module.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDuration(module.duration)}
                            {module.isPreview && (
                              <Badge variant="outline" className="ml-2">Preview</Badge>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {!course.isEnrolled && course.modules.length < course.totalModules && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <Lock className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-sm">
                        {course.totalModules - course.modules.length} more modules available after enrollment
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {formatPrice(course.price)}
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Duration
                      </span>
                      <span>{formatDuration(course.duration)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        Modules
                      </span>
                      <span>{course.totalModules}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {course.isEnrolled ? (
                  <Button className="w-full" onClick={() => router.push(`/academy/courses/${course.id}/learn`)}>
                    <Play className="w-4 h-4 mr-2" />
                    Continue Learning
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? (
                      'Processing...'
                    ) : parseFloat(course.price) === 0 ? (
                      'Enroll for Free'
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Enroll Now
                      </>
                    )}
                  </Button>
                )}
                
                {error && (
                  <Alert className="mt-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Course Reviews */}
            <CourseReviews courseId={course.id} isEnrolled={course.isEnrolled} />
          </div>
        </div>
      </div>
    </div>
  )
}
