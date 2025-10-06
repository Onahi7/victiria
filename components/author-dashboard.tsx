z'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  TrendingUp, 
  DollarSign, 
  Star, 
  Users, 
  Edit,
  Eye,
  Download,
  MessageSquare,
  Calendar,
  Award,
  Zap,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface AuthorStats {
  totalBooks: number
  totalSales: number
  totalEarnings: number
  averageRating: number
  totalReviews: number
  monthlyReaders: number
  submissionsInReview: number
  publishedThisYear: number
}

interface Book {
  id: string
  title: string
  genre: string
  status: 'published' | 'in_production' | 'under_review' | 'draft'
  publishedDate: string
  salesCount: number
  earnings: number
  rating: number
  reviewCount: number
  coverImage: string
  isPreorder: boolean
  preorderCount?: number
}

interface Submission {
  id: string
  title: string
  status: 'pending' | 'under_review' | 'accepted' | 'rejected'
  submittedDate: string
  lastUpdate: string
  reviewerNotes?: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedDate: string
  category: 'sales' | 'reviews' | 'milestones' | 'special'
}

export default function AuthorDashboard() {
  const [stats, setStats] = useState<AuthorStats | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuthorData()
  }, [])

  const fetchAuthorData = async () => {
    // Implementation for fetching author data
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'in_production':
        return 'bg-blue-100 text-blue-800'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'sales':
        return <TrendingUp className="w-5 h-5" />
      case 'reviews':
        return <Star className="w-5 h-5" />
      case 'milestones':
        return <Award className="w-5 h-5" />
      default:
        return <Zap className="w-5 h-5" />
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading your author dashboard...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Author Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your writing journey at a glance.</p>
        </div>
        <Link href="/publishing/submit">
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Submit New Manuscript
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published Books</p>
                <p className="text-2xl font-bold">{stats?.totalBooks || 0}</p>
                <p className="text-xs text-gray-500">+{stats?.publishedThisYear || 0} this year</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold">{stats?.totalSales?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500">across all books</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">${stats?.totalEarnings?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500">lifetime earnings</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {stats?.averageRating?.toFixed(1) || '0.0'}
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </p>
                <p className="text-xs text-gray-500">{stats?.totalReviews || 0} reviews</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="books" className="space-y-4">
        <TabsList>
          <TabsTrigger value="books">My Books</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* My Books Tab */}
        <TabsContent value="books" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Published Works</h2>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View All Sales
            </Button>
          </div>

          <div className="grid gap-4">
            {books.map((book) => (
              <Card key={book.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <img
                      src={book.coverImage || '/placeholder.jpg'}
                      alt={book.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{book.title}</h3>
                          <p className="text-sm text-gray-600">{book.genre}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(book.status)}>
                            {book.status.replace('_', ' ')}
                          </Badge>
                          {book.isPreorder && (
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              Preorder
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Sales</p>
                          <p className="text-gray-600">
                            {book.isPreorder ? `${book.preorderCount || 0} preorders` : `${book.salesCount} copies`}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Earnings</p>
                          <p className="text-gray-600">${book.earnings.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-medium">Rating</p>
                          <p className="text-gray-600 flex items-center gap-1">
                            {book.rating.toFixed(1)}
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ({book.reviewCount})
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Published</p>
                          <p className="text-gray-600">{new Date(book.publishedDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Reviews
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Reports
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manuscript Submissions</h2>
            <Link href="/publishing/submit">
              <Button>
                <Edit className="w-4 h-4 mr-2" />
                New Submission
              </Button>
            </Link>
          </div>

          <div className="grid gap-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{submission.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span>Submitted: {new Date(submission.submittedDate).toLocaleDateString()}</span>
                        <span>Last Update: {new Date(submission.lastUpdate).toLocaleDateString()}</span>
                      </div>
                      {submission.reviewerNotes && (
                        <div className="bg-blue-50 p-3 rounded text-sm">
                          <p className="font-medium mb-1">Reviewer Notes:</p>
                          <p className="text-gray-700">{submission.reviewerNotes}</p>
                        </div>
                      )}
                    </div>
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-semibold">Performance Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Readers</CardTitle>
                <CardDescription>Unique readers across all your books</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stats?.monthlyReaders?.toLocaleString() || 0}</div>
                <p className="text-sm text-gray-600">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Genre Performance</CardTitle>
                <CardDescription>Your best-performing genres</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Romance</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-16" />
                      <span className="text-xs text-gray-600">85%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Thriller</span>
                    <div className="flex items-center gap-2">
                      <Progress value={72} className="w-16" />
                      <span className="text-xs text-gray-600">72%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">African Literature</span>
                    <div className="flex items-center gap-2">
                      <Progress value={68} className="w-16" />
                      <span className="text-xs text-gray-600">68%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <h2 className="text-xl font-semibold">Your Writing Achievements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="border-2 border-yellow-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    {getAchievementIcon(achievement.category)}
                  </div>
                  <h3 className="font-semibold mb-1">{achievement.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                  <p className="text-xs text-gray-500">
                    Unlocked: {new Date(achievement.unlockedDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
