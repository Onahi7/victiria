"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  MessageSquare,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  PenTool,
  Users,
  Award
} from "lucide-react"

interface DashboardData {
  profile: any
  statistics: {
    submissions: {
      total: number
      draft: number
      submitted: number
      under_review: number
      approved: number
      rejected: number
      published: number
    }
    books: {
      published: number
    }
    revenue: {
      totalEarnings: number
      totalSales: number
      pendingPayouts: number
    }
    messages: {
      unread: number
    }
  }
  recentActivity: {
    submissions: any[]
    revenue: any[]
  }
}

export default function PublishingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    // Only fetch dashboard data if user is authenticated
    if (session) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [session, status])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/publishing/dashboard')
      const result = await response.json()
      
      if (result.success) {
        setDashboardData(result.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSubmissionStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <PenTool className="w-4 h-4 text-gray-500" />
      case 'submitted': return <Clock className="w-4 h-4 text-blue-500" />
      case 'under_review': return <Eye className="w-4 h-4 text-yellow-500" />
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />
      case 'published': return <Award className="w-4 h-4 text-purple-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'published': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show public publishing information if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Public Header */}
          <div className="text-center mb-12 lg:mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-4 lg:mb-6">
              Publish Your Book
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
              Join our publishing platform and share your story with the world. We provide professional publishing services 
              with competitive royalties and comprehensive editorial support.
            </p>
          </div>

          {/* Publishing Process */}
          <Card className="mb-12 lg:mb-16 shadow-lg">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl md:text-3xl lg:text-4xl mb-3">How Our Publishing Process Works</CardTitle>
              <CardDescription className="text-base md:text-lg max-w-2xl mx-auto">
                A simple, transparent process to get your book published
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                <div className="text-center group">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-4 lg:mb-6 transition-transform group-hover:scale-110">
                    <Upload className="w-8 h-8 lg:w-10 lg:h-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-3 text-lg lg:text-xl">1. Submit Your Book</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                    Upload your manuscript, cover, and book details. Complete the submission fee as determined by our admin team.
                  </p>
                </div>

                <div className="text-center group">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-4 lg:mb-6 transition-transform group-hover:scale-110">
                    <Eye className="w-8 h-8 lg:w-10 lg:h-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-3 text-lg lg:text-xl">2. Editorial Review</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                    Our editorial team carefully reviews your submission for quality, marketability, and alignment with our publishing standards.
                  </p>
                </div>

                <div className="text-center group">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-4 lg:mb-6 transition-transform group-hover:scale-110">
                    <Award className="w-8 h-8 lg:w-10 lg:h-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-3 text-lg lg:text-xl">3. Publication & Royalties</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                    Upon approval, your book is published and you begin earning competitive royalties on all sales through our platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Choose Us */}
          <Card className="mb-12 lg:mb-16 shadow-lg">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl md:text-3xl lg:text-4xl mb-3">Why Choose Our Platform?</CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                <div className="text-center group">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110">
                    <DollarSign className="w-6 h-6 lg:w-7 lg:h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-base lg:text-lg">Competitive Royalties</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    Earn competitive royalties on every sale
                  </p>
                </div>

                <div className="text-center group">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110">
                    <Users className="w-6 h-6 lg:w-7 lg:h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-base lg:text-lg">Professional Support</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    Expert editorial guidance throughout
                  </p>
                </div>

                <div className="text-center group">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110">
                    <TrendingUp className="w-6 h-6 lg:w-7 lg:h-7 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-base lg:text-lg">Wide Distribution</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    Reach readers across multiple platforms
                  </p>
                </div>

                <div className="text-center group">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110">
                    <MessageSquare className="w-6 h-6 lg:w-7 lg:h-7 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-base lg:text-lg">Author Dashboard</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    Track submissions and earnings easily
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="shadow-lg">
            <CardContent className="text-center py-12 lg:py-16 px-4 md:px-6 lg:px-8">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 lg:mb-6">Ready to Publish Your Book?</h2>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-400 mb-8 lg:mb-12 max-w-3xl mx-auto leading-relaxed">
                Join our community of published authors and start your publishing journey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center max-w-md mx-auto">
                <Button 
                  size="lg" 
                  onClick={() => router.push('/auth/signin?callbackUrl=/publishing')}
                  className="bg-purple-600 hover:bg-purple-700 text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4 h-auto"
                >
                  <Upload className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                  Start Publishing
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => router.push('/auth/signup?callbackUrl=/publishing')}
                  className="text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4 h-auto"
                >
                  Create Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 lg:mb-12 gap-4">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2 lg:mb-3">
              Author Dashboard
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300">
              Welcome back, {session.user.name}! Manage your publishing journey.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 w-full lg:w-auto">
            <Button 
              onClick={() => router.push('/publishing/submissions/new')}
              className="text-sm md:text-base px-4 lg:px-6 py-2 lg:py-3 h-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              New Submission
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/publishing/submissions')}
              className="text-sm md:text-base px-4 lg:px-6 py-2 lg:py-3 h-auto"
            >
              View All Submissions
            </Button>
          </div>
        </div>

        {dashboardData && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm md:text-base font-medium">Total Submissions</CardTitle>
                  <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold">{dashboardData.statistics.submissions.total}</div>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    {dashboardData.statistics.submissions.published} published
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm md:text-base font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold">₦{dashboardData.statistics.revenue.totalEarnings.toLocaleString()}</div>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    {dashboardData.statistics.revenue.totalSales} sales
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm md:text-base font-medium">Pending Payouts</CardTitle>
                  <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold">₦{dashboardData.statistics.revenue.pendingPayouts.toLocaleString()}</div>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    Available for withdrawal
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm md:text-base font-medium">Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold">{dashboardData.statistics.messages.unread}</div>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    Unread messages
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-12">
              <Card className="xl:col-span-2 hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-lg lg:text-xl">Recent Submissions</CardTitle>
                  <CardDescription className="text-sm lg:text-base">Your latest book submissions and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData.recentActivity.submissions.length === 0 ? (
                    <div className="text-center py-8 lg:py-12 text-gray-500">
                      <BookOpen className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-base lg:text-lg mb-4">No submissions yet. Start by submitting your first book!</p>
                      <Button 
                        className="text-sm lg:text-base px-4 lg:px-6 py-2 lg:py-3 h-auto" 
                        onClick={() => router.push('/publishing/submissions/new')}
                      >
                        Submit Your First Book
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.recentActivity.submissions.map((submission) => (
                        <div key={submission.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow duration-200 gap-3">
                          <div className="flex items-center gap-3">
                            {getSubmissionStatusIcon(submission.status)}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-sm lg:text-base truncate">{submission.title}</h3>
                              <p className="text-xs lg:text-sm text-gray-500">
                                {submission.submittedAt 
                                  ? `Submitted ${new Date(submission.submittedAt).toLocaleDateString()}`
                                  : `Created ${new Date(submission.createdAt).toLocaleDateString()}`
                                }
                              </p>
                            </div>
                          </div>
                          <Badge className={`${getSubmissionStatusColor(submission.status)} text-xs lg:text-sm whitespace-nowrap`}>
                            {submission.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-lg lg:text-xl">Publishing Progress</CardTitle>
                  <CardDescription className="text-sm lg:text-base">Your journey as an author</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm lg:text-base mb-2">
                      <span>Books Published</span>
                      <span className="font-medium">{dashboardData.statistics.books.published}</span>
                    </div>
                    <Progress value={Math.min(dashboardData.statistics.books.published * 20, 100)} className="h-2 lg:h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm lg:text-base mb-2">
                      <span>Approval Rate</span>
                      <span className="font-medium">
                        {dashboardData.statistics.submissions.total > 0 
                          ? Math.round((dashboardData.statistics.submissions.approved / dashboardData.statistics.submissions.total) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                    <Progress 
                      value={dashboardData.statistics.submissions.total > 0 
                        ? (dashboardData.statistics.submissions.approved / dashboardData.statistics.submissions.total) * 100
                        : 0
                      } 
                      className="h-2 lg:h-3"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3 text-sm lg:text-base">Quick Stats</h4>
                    <div className="space-y-2 text-sm lg:text-base">
                      <div className="flex justify-between">
                        <span>Under Review</span>
                        <span className="font-medium">{dashboardData.statistics.submissions.under_review}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Approved</span>
                        <span className="font-medium">{dashboardData.statistics.submissions.approved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Published</span>
                        <span className="font-medium">{dashboardData.statistics.submissions.published}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Revenue */}
            {dashboardData.recentActivity.revenue.length > 0 && (
              <Card className="hover:shadow-lg transition-shadow duration-300 mb-8 lg:mb-12">
                <CardHeader>
                  <CardTitle className="text-lg lg:text-xl">Recent Sales & Revenue</CardTitle>
                  <CardDescription className="text-sm lg:text-base">Your latest book sales and earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentActivity.revenue.map((revenue) => (
                      <div key={revenue.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow duration-200 gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm lg:text-base truncate">{revenue.book?.title || 'Unknown Book'}</h3>
                          <p className="text-xs lg:text-sm text-gray-500">
                            {new Date(revenue.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600 text-sm lg:text-base">
                            +₦{parseFloat(revenue.authorEarning).toLocaleString()}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-500">
                            Sale: ₦{parseFloat(revenue.saleAmount).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Getting Started Guide for New Authors */}
        {!dashboardData || dashboardData.statistics.submissions.total === 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <Users className="w-5 h-5 lg:w-6 lg:h-6" />
                Getting Started as an Author
              </CardTitle>
              <CardDescription className="text-sm lg:text-base">
                Welcome to our publishing platform! Here's how to get your book published.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                <div className="text-center group">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-4 lg:mb-6 transition-transform group-hover:scale-110">
                    <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-base lg:text-lg">1. Submit Your Book</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    Upload your manuscript, cover, and book details. Complete the submission fee as determined by our admin team.
                  </p>
                </div>

                <div className="text-center group">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-4 lg:mb-6 transition-transform group-hover:scale-110">
                    <Eye className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-base lg:text-lg">2. Editorial Review</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    Our editorial team carefully reviews your submission for quality, marketability, and alignment with our publishing standards.
                  </p>
                </div>

                <div className="text-center group">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-4 lg:mb-6 transition-transform group-hover:scale-110">
                    <Award className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-base lg:text-lg">3. Publication & Royalties</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    Upon approval, your book is published and you begin earning competitive royalties on all sales through our platform.
                  </p>
                </div>
              </div>

              <div className="mt-8 lg:mt-12 text-center">
                <Button 
                  size="lg" 
                  onClick={() => router.push('/publishing/submissions/new')}
                  className="text-sm lg:text-base px-6 lg:px-8 py-3 lg:py-4 h-auto"
                >
                  Submit Your First Book
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

