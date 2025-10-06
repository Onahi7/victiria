'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Send, Users, Mail, TrendingUp, Calendar, Trash2, Eye, Plus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface NewsletterSubscriber {
  id: string
  email: string
  isActive: boolean
  subscribedAt: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
}

interface NewsletterStats {
  totalSubscribers: number
  activeSubscribers: number
  recentSubscribers: number
  inactiveSubscribers: number
}

export default function AdminNewsletterManagement() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [stats, setStats] = useState<NewsletterStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Newsletter composition
  const [newsletterData, setNewsletterData] = useState({
    templateId: '',
    subject: '',
    customContent: '',
    targetAudience: 'all',
    scheduledAt: ''
  })

  // Subscriber management
  const [newSubscriberEmail, setNewSubscriberEmail] = useState('')
  const [subscriberFilter, setSubscriberFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [subscribersRes, templatesRes, statsRes] = await Promise.all([
        fetch('/api/admin/newsletter/subscribers'),
        fetch('/api/admin/email-templates'),
        fetch('/api/admin/newsletter/send')
      ])

      if (subscribersRes.ok) {
        const subscribersData = await subscribersRes.json()
        setSubscribers(subscribersData.subscribers || [])
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setTemplates(templatesData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch newsletter data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendNewsletter = async () => {
    if (!newsletterData.subject || (!newsletterData.templateId && !newsletterData.customContent)) {
      toast({
        title: "Error",
        description: "Please provide a subject and either select a template or enter custom content",
        variant: "destructive"
      })
      return
    }

    try {
      setSending(true)
      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsletterData)
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: `Newsletter sent to ${result.results?.sent || 0} subscribers`
        })
        setNewsletterData({
          templateId: '',
          subject: '',
          customContent: '',
          targetAudience: 'all',
          scheduledAt: ''
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to send newsletter",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send newsletter",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const handleAddSubscriber = async () => {
    if (!newSubscriberEmail) return

    try {
      const response = await fetch('/api/admin/newsletter/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newSubscriberEmail })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subscriber added successfully"
        })
        setNewSubscriberEmail('')
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to add subscriber",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add subscriber",
        variant: "destructive"
      })
    }
  }

  const handleToggleSubscriber = async (subscriberId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/newsletter/subscribers/${subscriberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Subscriber ${isActive ? 'activated' : 'deactivated'}`
        })
        fetchData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscriber",
        variant: "destructive"
      })
    }
  }

  const handleDeleteSubscriber = async (subscriberId: string) => {
    if (!confirm('Are you sure you want to remove this subscriber?')) return

    try {
      const response = await fetch(`/api/admin/newsletter/subscribers/${subscriberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subscriber removed successfully"
        })
        fetchData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove subscriber",
        variant: "destructive"
      })
    }
  }

  const filteredSubscribers = subscribers.filter(subscriber => {
    if (subscriberFilter === 'active') return subscriber.isActive
    if (subscriberFilter === 'inactive') return !subscriber.isActive
    return true
  })

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Newsletter Management</h1>
        <p className="text-gray-600 mt-1">Manage subscribers and send newsletters</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
                  <p className="text-2xl font-bold">{stats.totalSubscribers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
                  <p className="text-2xl font-bold">{stats.activeSubscribers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold">{stats.recentSubscribers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-gray-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold">{stats.inactiveSubscribers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose">Compose Newsletter</TabsTrigger>
          <TabsTrigger value="subscribers">Manage Subscribers</TabsTrigger>
          <TabsTrigger value="templates">Quick Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose Newsletter</CardTitle>
              <CardDescription>
                Create and send newsletters to your subscribers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={newsletterData.subject}
                    onChange={(e) => setNewsletterData({ ...newsletterData, subject: e.target.value })}
                    placeholder="Your amazing newsletter subject"
                  />
                </div>
                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select
                    value={newsletterData.targetAudience}
                    onValueChange={(value) => setNewsletterData({ ...newsletterData, targetAudience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Active Subscribers</SelectItem>
                      <SelectItem value="new">New Subscribers (Last 30 days)</SelectItem>
                      <SelectItem value="engaged">Engaged Subscribers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="template">Use Template (Optional)</Label>
                <Select
                  value={newsletterData.templateId}
                  onValueChange={(value) => setNewsletterData({ ...newsletterData, templateId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template or write custom content" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!newsletterData.templateId && (
                <div>
                  <Label htmlFor="customContent">Custom Content (HTML)</Label>
                  <Textarea
                    id="customContent"
                    value={newsletterData.customContent}
                    onChange={(e) => setNewsletterData({ ...newsletterData, customContent: e.target.value })}
                    placeholder="Write your newsletter content in HTML..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="scheduledAt">Schedule for Later (Optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={newsletterData.scheduledAt}
                  onChange={(e) => setNewsletterData({ ...newsletterData, scheduledAt: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSendNewsletter} 
                  disabled={sending}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Sending...' : 'Send Newsletter'}
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Subscriber Management</CardTitle>
                  <CardDescription>
                    Manage your newsletter subscriber list
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={subscriberFilter} onValueChange={setSubscriberFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subscribers</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  value={newSubscriberEmail}
                  onChange={(e) => setNewSubscriberEmail(e.target.value)}
                  placeholder="Add new subscriber email"
                  type="email"
                />
                <Button onClick={handleAddSubscriber}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {filteredSubscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={subscriber.isActive}
                        onCheckedChange={(checked) => handleToggleSubscriber(subscriber.id, checked)}
                      />
                      <div>
                        <p className="font-medium">{subscriber.email}</p>
                        <p className="text-sm text-gray-500">
                          Subscribed: {new Date(subscriber.subscribedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={subscriber.isActive ? "default" : "secondary"}>
                        {subscriber.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSubscriber(subscriber.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredSubscribers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No subscribers found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Digest</CardTitle>
                <CardDescription>
                  Automatic compilation of latest content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Includes latest blog posts, new courses, community highlights, and upcoming events.
                </p>
                <Button 
                  onClick={() => setNewsletterData({
                    ...newsletterData,
                    subject: '📚 Your Weekly Writing Digest',
                    customContent: `<!-- Weekly digest will be automatically generated -->`
                  })}
                  variant="outline"
                >
                  Use This Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Promotional Newsletter</CardTitle>
                <CardDescription>
                  Promote courses, books, or special offers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Perfect for announcing new courses, limited-time offers, or highlighting featured content.
                </p>
                <Button 
                  onClick={() => setNewsletterData({
                    ...newsletterData,
                    subject: '🎉 Special Offer Just for You!',
                    customContent: `<!-- Promotional content template -->`
                  })}
                  variant="outline"
                >
                  Use This Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Announcement</CardTitle>
                <CardDescription>
                  Announce new courses and enrollments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Introduce new courses, instructor spotlights, and enrollment opportunities.
                </p>
                <Button 
                  onClick={() => setNewsletterData({
                    ...newsletterData,
                    subject: '📝 New Course Alert: Transform Your Writing',
                    customContent: `<!-- Course announcement template -->`
                  })}
                  variant="outline"
                >
                  Use This Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Community Spotlight</CardTitle>
                <CardDescription>
                  Highlight community achievements and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Feature student success stories, community-generated content, and peer recognition.
                </p>
                <Button 
                  onClick={() => setNewsletterData({
                    ...newsletterData,
                    subject: '⭐ Amazing Writers in Our Community',
                    customContent: `<!-- Community spotlight template -->`
                  })}
                  variant="outline"
                >
                  Use This Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
