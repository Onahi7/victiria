'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Calendar,
  Download,
  ShoppingCart
} from 'lucide-react'

interface Stats {
  totalBooks: number
  totalUsers: number
  totalRevenue: number
  totalOrders: number
  totalBlogPosts: number
  totalEvents: number
  totalDownloads: number
  totalPreorders: number
  revenueGrowth: number
  usersGrowth: number
}

export default function AdminDashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats?timeRange=30d')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Revenue',
      // ensure we call toLocaleString on a number (default to 0)
      value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`,
      icon: DollarSign,
      description: `${(stats?.revenueGrowth ?? 0)}% from last month`,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
  title: 'Total Users',
  value: (stats?.totalUsers ?? 0).toLocaleString(),
  icon: Users,
  description: `${(stats?.usersGrowth ?? 0)}% from last month`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
  title: 'Total Books',
  value: (stats?.totalBooks ?? 0).toLocaleString(),
      icon: BookOpen,
      description: 'Published books',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
  title: 'Total Orders',
  value: (stats?.totalOrders ?? 0).toLocaleString(),
      icon: ShoppingCart,
      description: 'All time orders',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
    {
  title: 'Blog Posts',
  value: (stats?.totalBlogPosts ?? 0).toLocaleString(),
      icon: FileText,
      description: 'Published articles',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900',
    },
    {
  title: 'Events',
  value: (stats?.totalEvents ?? 0).toLocaleString(),
      icon: Calendar,
      description: 'Upcoming events',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900',
    },
    {
  title: 'Free Downloads',
  value: (stats?.totalDownloads ?? 0).toLocaleString(),
      icon: Download,
      description: 'Free book downloads',
      color: 'text-teal-600',
      bgColor: 'bg-teal-100 dark:bg-teal-900',
    },
    {
  title: 'Pre-orders',
  value: (stats?.totalPreorders ?? 0).toLocaleString(),
      icon: TrendingUp,
      description: 'Active pre-orders',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/dashboard?tab=books" className="block p-3 rounded-lg border hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Manage Books</p>
                  <p className="text-sm text-muted-foreground">Add, edit, or remove books</p>
                </div>
              </div>
            </a>
            <a href="/dashboard?tab=blog" className="block p-3 rounded-lg border hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-pink-600" />
                <div>
                  <p className="font-medium">Write Blog Post</p>
                  <p className="text-sm text-muted-foreground">Create new blog content</p>
                </div>
              </div>
            </a>
            <a href="/dashboard?tab=events" className="block p-3 rounded-lg border hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="font-medium">Create Event</p>
                  <p className="text-sm text-muted-foreground">Schedule a new event</p>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates on your platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 pb-3 border-b">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">New book published</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">New order received</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
