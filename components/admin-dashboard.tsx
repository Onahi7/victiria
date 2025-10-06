'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Users, BookOpen, GraduationCap, Upload, DollarSign, TrendingUp, Eye, Plus, RefreshCw, Edit } from 'lucide-react'
import AdminEventsManagement from '@/components/admin-events-management'
import AdminBooksManagement from '@/components/admin-books-management'
import AdminCoursesManagement from '@/components/admin-courses-management'
import AdminBlogManagement from '@/components/admin-blog-management'
import AdminAnalytics from '@/components/admin-analytics'
import AdminCouponsManagement from '@/components/admin-coupons-management'
import AdminPreordersManagement from '@/components/admin-preorders-management'
import AdminFreeDownloadsManagement from '@/components/admin-free-downloads-management'

interface DashboardStats {
  users: {
    total: number
    new: number
    active: number
    byRole: { role: string; count: number }[]
  }
  books: {
    total: number
    new: number
    published: number
    byStatus: { status: string; count: number }[]
    topSelling: any[]
  }
  orders: {
    total: number
    totalRevenue: number
    new: number
    newRevenue: number
    completed: number
    byStatus: { status: string; count: number }[]
    recent: any[]
  }
  events: {
    total: number
    new: number
    upcoming: number
    totalRegistrations: number
    recent: any[]
  }
  courses: {
    total: number
    new: number
    published: number
    totalEnrollments: number
    topCourses: any[]
  }
  submissions: {
    total: number
    new: number
    byStatus: { status: string; count: number }[]
    recent: any[]
  }
  revenue: {
    total: number
    period: number
    authorEarnings: number
    platformFees: number
  }
  blog: {
    total: number
    new: number
    published: number
    recent: any[]
  }
  recentActivity: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30d')

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stats?timeRange=${timeRange}`)
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch stats')
      }
    } catch (err) {
      setError('Failed to fetch dashboard data')
      console.error('Error fetching admin stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Failed to load dashboard'}</p>
            <Button onClick={fetchStats}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Events',
      value: stats.events.total,
      change: `+${stats.events.new} new`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Event Registrations',
      value: stats.events.totalRegistrations,
      change: `${stats.events.upcoming} upcoming`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Active Users',
      value: stats.users.active,
      change: `+${stats.users.new} new`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Total Books',
      value: stats.books.total,
      change: `${stats.books.published} published`,
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'Academy Courses',
      value: stats.courses.total,
      change: `${stats.courses.totalEnrollments} enrollments`,
      icon: GraduationCap,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      title: 'Submissions',
      value: stats.submissions.total,
      change: `+${stats.submissions.new} new`,
      icon: Upload,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20'
    },
    {
      title: 'Revenue',
      value: `₦${stats.orders.totalRevenue.toLocaleString()}`,
      change: `+₦${stats.orders.newRevenue.toLocaleString()} this period`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      title: 'Growth',
      value: '+15%',
      change: 'vs last period',
      icon: TrendingUp,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20'
    }
  ]

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your platform content and monitor performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-sm border rounded-md bg-background"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button onClick={fetchStats} variant="outline" size="sm" className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="events" className="text-xs sm:text-sm">Events</TabsTrigger>
          <TabsTrigger value="books" className="text-xs sm:text-sm">Books</TabsTrigger>
          <TabsTrigger value="academy" className="text-xs sm:text-sm">Academy</TabsTrigger>
          <TabsTrigger value="blog" className="text-xs sm:text-sm">Blog</TabsTrigger>
          <TabsTrigger value="coupons" className="text-xs sm:text-sm">Coupons</TabsTrigger>
          <TabsTrigger value="preorders" className="text-xs sm:text-sm">Preorders</TabsTrigger>
          <TabsTrigger value="free-downloads" className="text-xs sm:text-sm">Free Downloads</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {statCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                        {stat.title}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-2 sm:p-3 rounded-full ${stat.bgColor} flex-shrink-0`}>
                      <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Button className="h-auto p-3 sm:p-4 flex-col gap-2 text-xs sm:text-sm" variant="outline">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Create Event</span>
                </Button>
                <Button className="h-auto p-3 sm:p-4 flex-col gap-2 text-xs sm:text-sm" variant="outline">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Add Book</span>
                </Button>
                <Button className="h-auto p-3 sm:p-4 flex-col gap-2 text-xs sm:text-sm" variant="outline">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Create Course</span>
                </Button>
                <Button className="h-auto p-3 sm:p-4 flex-col gap-2 text-xs sm:text-sm" variant="outline">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Latest platform activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {stats.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 sm:gap-4">
                    <div className={`p-2 rounded-full flex-shrink-0 ${
                      activity.type === 'order' ? 'bg-green-50 dark:bg-green-900/20' :
                      activity.type === 'registration' ? 'bg-blue-50 dark:bg-blue-900/20' :
                      activity.type === 'submission' ? 'bg-purple-50 dark:bg-purple-900/20' :
                      'bg-orange-50 dark:bg-orange-900/20'
                    }`}>
                      {activity.type === 'order' && <DollarSign className="h-4 w-4 text-green-600" />}
                      {activity.type === 'registration' && <Calendar className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'submission' && <Upload className="h-4 w-4 text-purple-600" />}
                      {activity.type === 'review' && <BookOpen className="h-4 w-4 text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.description}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        by {activity.user} • {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize text-xs flex-shrink-0">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <AdminEventsManagement />
        </TabsContent>

        <TabsContent value="books">
          <AdminBooksManagement />
        </TabsContent>

        <TabsContent value="academy">
          <AdminCoursesManagement />
        </TabsContent>

        <TabsContent value="blog">
          <AdminBlogManagement />
        </TabsContent>

        <TabsContent value="coupons">
          <AdminCouponsManagement />
        </TabsContent>

        <TabsContent value="preorders">
          <AdminPreordersManagement />
        </TabsContent>

        <TabsContent value="free-downloads">
          <AdminFreeDownloadsManagement />
        </TabsContent>

        <TabsContent value="analytics">
          <AdminAnalytics stats={stats} timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
