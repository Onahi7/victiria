'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import AdminAnalytics from '@/components/admin-analytics'
import AdminBlogManagement from '@/components/admin-blog-management'
import AdminBooksManagement from '@/components/admin-books-management'
import AdminCoursesManagement from '@/components/admin-courses-management'
import AdminCouponsManagement from '@/components/admin-coupons-management'
import AdminEmailTemplates from '@/components/admin-email-templates'
import AdminEventsManagement from '@/components/admin-events-management'
import AdminFictionSubmissions from '@/components/admin-fiction-submissions'
import AdminFreeDownloadsManagement from '@/components/admin-free-downloads-management'
import AdminNewsletterManagement from '@/components/admin-newsletter-management'
import AdminPreordersManagement from '@/components/admin-preorders-management'
import AdminSeoManagement from '@/components/admin-seo-management'
import AdminDashboardStats from '@/components/admin-dashboard-stats'
import { useState } from 'react'

function DashboardContent() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'overview'

  const renderContent = () => {
    switch (tab) {
      case 'books':
        return <AdminBooksManagement />
      case 'blog':
        return <AdminBlogManagement />
      case 'courses':
        return <AdminCoursesManagement />
      case 'preorders':
        return <AdminPreordersManagement />
      case 'events':
        return <AdminEventsManagement />
      case 'coupons':
        return <AdminCouponsManagement />
      case 'free-downloads':
        return <AdminFreeDownloadsManagement />
      case 'newsletter':
        return <AdminNewsletterManagement />
      case 'email-templates':
        return <AdminEmailTemplates />
      case 'seo':
        return <AdminSeoManagement />
      case 'analytics':
        return <div className="p-6"><h2 className="text-2xl font-bold">Analytics</h2><p className="text-muted-foreground">Analytics dashboard coming soon...</p></div>
      case 'fiction-submissions':
        return <AdminFictionSubmissions />
      case 'overview':
      default:
        return <AdminDashboardStats />
    }
  }

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>}>
      <DashboardContent />
    </Suspense>
  )
}
