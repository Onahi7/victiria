import { Suspense } from 'react'
import AdminEmailTemplates from '@/components/admin-email-templates'
import AdminNewsletterManagement from '@/components/admin-newsletter-management'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Users, FileText, Send } from 'lucide-react'

export default function AdminEmailManagementPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Email & Newsletter Management</h1>
        <p className="text-gray-600">
          Manage email templates, newsletter subscribers, and send newsletters to your community
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Email Templates</p>
                <p className="text-2xl font-bold">Manage</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Subscribers</p>
                <p className="text-2xl font-bold">Track</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Send className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Newsletters</p>
                <p className="text-2xl font-bold">Send</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Email Service</p>
                <p className="text-2xl font-bold">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="newsletter" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="newsletter">Newsletter Management</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="newsletter">
          <Suspense fallback={<div>Loading newsletter management...</div>}>
            <AdminNewsletterManagement />
          </Suspense>
        </TabsContent>

        <TabsContent value="templates">
          <Suspense fallback={<div>Loading email templates...</div>}>
            <AdminEmailTemplates />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and helpful resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">📊 Email Analytics</h3>
              <p className="text-sm text-gray-600 mb-3">
                Track email delivery rates, open rates, and click-through rates in your Resend dashboard.
              </p>
              <a 
                href="https://resend.com/emails" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                View in Resend →
              </a>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🛠️ Template Variables</h3>
              <p className="text-sm text-gray-600 mb-3">
                Use dynamic variables like {`{{userName}}`}, {`{{courseName}}`}, and {`{{courseUrl}}`} in your templates.
              </p>
              <span className="text-gray-500 text-sm">Documentation available</span>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🔒 GDPR Compliance</h3>
              <p className="text-sm text-gray-600 mb-3">
                All newsletters include unsubscribe links and respect user privacy preferences.
              </p>
              <span className="text-green-600 text-sm font-medium">✓ Compliant</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
