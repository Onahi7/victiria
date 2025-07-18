'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, TrendingUp, Users, BookOpen, Calendar, DollarSign } from 'lucide-react'

interface AdminAnalyticsProps {
  stats: any
  timeRange: string
}

export default function AdminAnalytics({ stats, timeRange }: AdminAnalyticsProps) {
  const timeRangeLabels = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    '1y': 'Last year'
  }

  const currentLabel = timeRangeLabels[timeRange as keyof typeof timeRangeLabels] || 'Last 30 days'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Growth */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Growth</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.users.new} new users ({currentLabel})
            </p>
            <div className="mt-4 space-y-2">
              {stats.users.byRole.map((role: any) => (
                <div key={role.role} className="flex justify-between text-sm">
                  <span className="capitalize">{role.role}s:</span>
                  <span>{role.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Analytics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Analytics</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.revenue.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +₦{stats.revenue.period.toLocaleString()} ({currentLabel})
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Author Earnings:</span>
                <span>₦{stats.revenue.authorEarnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fees:</span>
                <span>₦{stats.revenue.platformFees.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Overview</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Books:</span>
                <span className="font-medium">{stats.books.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Courses:</span>
                <span className="font-medium">{stats.courses.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Events:</span>
                <span className="font-medium">{stats.events.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Blog Posts:</span>
                <span className="font-medium">{stats.blog.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Book Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Book Status Distribution</CardTitle>
          <CardDescription>Current status of all books in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.books.byStatus.map((status: any) => (
              <div key={status.status} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{status.count}</div>
                <div className="text-sm text-gray-600 capitalize">{status.status.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status Distribution</CardTitle>
          <CardDescription>Current status of all orders in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.orders.byStatus.map((status: any) => (
              <div key={status.status} className="text-center">
                <div className="text-2xl font-bold text-green-600">{status.count}</div>
                <div className="text-sm text-gray-600 capitalize">{status.status}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Selling Books */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Books</CardTitle>
          <CardDescription>Best performing books by sales count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.books.topSelling.map((book: any, index: number) => (
              <div key={book.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{book.title}</div>
                    <div className="text-sm text-gray-600">by {book.author}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{book.salesCount} sales</div>
                  <div className="text-sm text-gray-600">₦{parseFloat(book.totalRevenue || '0').toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>Latest book submissions awaiting review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.submissions.recent.slice(0, 5).map((submission: any) => (
              <div key={submission.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{submission.title}</div>
                  <div className="text-sm text-gray-600">by {submission.author.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium capitalize">{submission.status.replace('_', ' ')}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(submission.submittedAt || submission.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
