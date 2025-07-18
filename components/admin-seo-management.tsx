"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search, 
  Settings, 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  BarChart3, 
  Globe, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PAGE_TYPES } from '@/lib/seo/config'

interface SEOSetting {
  id: string
  pageType: string
  pageSlug?: string
  title: string
  description: string
  keywords: string[]
  canonicalUrl?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType: string
  twitterCard: string
  twitterSite?: string
  twitterCreator?: string
  robotsIndex: boolean
  robotsFollow: boolean
  priority: number
  changeFreq: string
  isActive: boolean
  lastModified?: Date
}

interface SEORedirect {
  id: string
  fromUrl: string
  toUrl: string
  statusCode: string
  isActive: boolean
  hitCount: number
  createdAt: Date
}

interface AnalyticsData {
  pageUrl: string
  pageTitle?: string
  views: number
  bounceRate?: number
  avgSessionDuration?: number
  organicTraffic?: number
}

export default function AdminSEOManagement() {
  const [activeTab, setActiveTab] = useState('settings')
  const [seoSettings, setSeoSettings] = useState<SEOSetting[]>([])
  const [redirects, setRedirects] = useState<SEORedirect[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingSettings, setEditingSettings] = useState<SEOSetting | null>(null)
  const [newRedirect, setNewRedirect] = useState({ fromUrl: '', toUrl: '', statusCode: '301' })
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  // Form state for SEO settings
  const [formData, setFormData] = useState<Partial<SEOSetting>>({
    pageType: '',
    pageSlug: '',
    title: '',
    description: '',
    keywords: [],
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterSite: '@edifypub',
    twitterCreator: '@edifypub',
    robotsIndex: true,
    robotsFollow: true,
    priority: 0.5,
    changeFreq: 'monthly',
    isActive: true,
  })

  useEffect(() => {
    fetchSEOSettings()
    fetchRedirects()
    fetchAnalytics()
  }, [])

  const fetchSEOSettings = async () => {
    try {
      const response = await fetch('/api/admin/seo/settings')
      if (response.ok) {
        const data = await response.json()
        setSeoSettings(data)
      }
    } catch (error) {
      console.error('Error fetching SEO settings:', error)
    }
  }

  const fetchRedirects = async () => {
    try {
      const response = await fetch('/api/admin/seo/redirects')
      if (response.ok) {
        const data = await response.json()
        setRedirects(data)
      }
    } catch (error) {
      console.error('Error fetching redirects:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/seo/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/seo/settings', {
        method: editingSettings ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingSettings?.id,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `SEO settings ${editingSettings ? 'updated' : 'created'} successfully.`,
        })
        fetchSEOSettings()
        setEditingSettings(null)
        setFormData({
          pageType: '',
          pageSlug: '',
          title: '',
          description: '',
          keywords: [],
          canonicalUrl: '',
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          ogType: 'website',
          twitterCard: 'summary_large_image',
          twitterSite: '@edifypub',
          twitterCreator: '@edifypub',
          robotsIndex: true,
          robotsFollow: true,
          priority: 0.5,
          changeFreq: 'monthly',
          isActive: true,
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save SEO settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSettings = (setting: SEOSetting) => {
    setEditingSettings(setting)
    setFormData(setting)
  }

  const handleDeleteSettings = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/seo/settings/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "SEO settings deleted successfully.",
        })
        fetchSEOSettings()
      } else {
        throw new Error('Failed to delete settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete SEO settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreateRedirect = async () => {
    try {
      const response = await fetch('/api/admin/seo/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRedirect),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Redirect created successfully.",
        })
        fetchRedirects()
        setNewRedirect({ fromUrl: '', toUrl: '', statusCode: '301' })
      } else {
        throw new Error('Failed to create redirect')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create redirect. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRedirect = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/seo/redirects/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Redirect deleted successfully.",
        })
        fetchRedirects()
      } else {
        throw new Error('Failed to delete redirect')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete redirect. Please try again.",
        variant: "destructive",
      })
    }
  }

  const generateSitemap = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/seo/sitemap', {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Sitemap generated successfully.",
        })
      } else {
        throw new Error('Failed to generate sitemap')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate sitemap. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSettings = seoSettings.filter(
    setting =>
      setting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.pageType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (setting.pageSlug && setting.pageSlug.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SEO Management</h1>
          <p className="text-muted-foreground">
            Manage SEO settings, redirects, and analytics for EdifyPub
          </p>
        </div>
        <Button onClick={generateSitemap} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Globe className="mr-2 h-4 w-4" />
          )}
          Generate Sitemap
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">SEO Settings</TabsTrigger>
          <TabsTrigger value="redirects">Redirects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Configure SEO metadata for different page types and specific pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search settings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => setEditingSettings({} as SEOSetting)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Setting
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page Type</TableHead>
                      <TableHead>Page Slug</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSettings.map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell>
                          <Badge variant="secondary">{setting.pageType}</Badge>
                        </TableCell>
                        <TableCell>{setting.pageSlug || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{setting.title}</TableCell>
                        <TableCell>
                          <Badge variant={setting.isActive ? "default" : "secondary"}>
                            {setting.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{setting.priority}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSettings(setting)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSettings(setting.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {editingSettings && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingSettings.id ? 'Edit' : 'Add'} SEO Settings
                </CardTitle>
                <CardDescription>
                  Configure SEO metadata for a specific page or page type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pageType">Page Type</Label>
                    <Select
                      value={formData.pageType}
                      onValueChange={(value) => setFormData({ ...formData, pageType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select page type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAGE_TYPES).map(([key, value]) => (
                          <SelectItem key={key} value={value}>
                            {key.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pageSlug">Page Slug (Optional)</Label>
                    <Input
                      id="pageSlug"
                      placeholder="e.g., book-slug, blog-post-slug"
                      value={formData.pageSlug}
                      onChange={(e) => setFormData({ ...formData, pageSlug: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Page title (max 60 characters)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    maxLength={60}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.title?.length || 0}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Page description (max 160 characters)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.description?.length || 0}/160 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    placeholder="Enter keywords separated by commas"
                    value={formData.keywords?.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k.length > 0)
                    })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ogTitle">OG Title</Label>
                    <Input
                      id="ogTitle"
                      placeholder="Open Graph title"
                      value={formData.ogTitle}
                      onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ogImage">OG Image</Label>
                    <Input
                      id="ogImage"
                      placeholder="Open Graph image URL"
                      value={formData.ogImage}
                      onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ogDescription">OG Description</Label>
                  <Textarea
                    id="ogDescription"
                    placeholder="Open Graph description"
                    value={formData.ogDescription}
                    onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="changeFreq">Change Frequency</Label>
                    <Select
                      value={formData.changeFreq}
                      onValueChange={(value) => setFormData({ ...formData, changeFreq: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="always">Always</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ogType">OG Type</Label>
                    <Select
                      value={formData.ogType}
                      onValueChange={(value) => setFormData({ ...formData, ogType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="book">Book</SelectItem>
                        <SelectItem value="profile">Profile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="robotsIndex"
                        checked={formData.robotsIndex}
                        onCheckedChange={(checked) => setFormData({ ...formData, robotsIndex: checked })}
                      />
                      <Label htmlFor="robotsIndex">Index</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="robotsFollow"
                        checked={formData.robotsFollow}
                        onCheckedChange={(checked) => setFormData({ ...formData, robotsFollow: checked })}
                      />
                      <Label htmlFor="robotsFollow">Follow</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={handleSaveSettings} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {editingSettings.id ? 'Update' : 'Create'} Settings
                  </Button>
                  <Button variant="outline" onClick={() => setEditingSettings(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="redirects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>URL Redirects</CardTitle>
              <CardDescription>
                Manage URL redirects for changed or moved pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Input
                  placeholder="From URL"
                  value={newRedirect.fromUrl}
                  onChange={(e) => setNewRedirect({ ...newRedirect, fromUrl: e.target.value })}
                />
                <Input
                  placeholder="To URL"
                  value={newRedirect.toUrl}
                  onChange={(e) => setNewRedirect({ ...newRedirect, toUrl: e.target.value })}
                />
                <Select
                  value={newRedirect.statusCode}
                  onValueChange={(value) => setNewRedirect({ ...newRedirect, statusCode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="301">301 Permanent</SelectItem>
                    <SelectItem value="302">302 Temporary</SelectItem>
                    <SelectItem value="307">307 Temporary</SelectItem>
                    <SelectItem value="308">308 Permanent</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateRedirect}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Redirect
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From URL</TableHead>
                      <TableHead>To URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hits</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redirects.map((redirect) => (
                      <TableRow key={redirect.id}>
                        <TableCell className="max-w-xs truncate">{redirect.fromUrl}</TableCell>
                        <TableCell className="max-w-xs truncate">{redirect.toUrl}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{redirect.statusCode}</Badge>
                        </TableCell>
                        <TableCell>{redirect.hitCount}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRedirect(redirect.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organic Traffic</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.reduce((sum, item) => sum + (item.organicTraffic || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +15.3% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Bounce Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(analytics.reduce((sum, item) => sum + (item.bounceRate || 0), 0) / analytics.length || 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  -5.2% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>
                Most visited pages and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page URL</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Bounce Rate</TableHead>
                      <TableHead>Avg. Session</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="max-w-xs truncate">{item.pageUrl}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.pageTitle || '-'}</TableCell>
                        <TableCell>{item.views.toLocaleString()}</TableCell>
                        <TableCell>{item.bounceRate?.toFixed(1) || '-'}%</TableCell>
                        <TableCell>{item.avgSessionDuration ? `${Math.round(item.avgSessionDuration / 60)}m` : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sitemap Generator</CardTitle>
                <CardDescription>
                  Generate XML sitemap for search engines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={generateSitemap} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="mr-2 h-4 w-4" />
                  )}
                  Generate Sitemap
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Generate sitemap.xml file for search engine crawling
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Audit</CardTitle>
                <CardDescription>
                  Analyze pages for SEO issues and optimization opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Run SEO Audit
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Coming soon: Automated SEO analysis and recommendations
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Meta Tags Preview</CardTitle>
              <CardDescription>
                Preview how your pages will appear in search results and social media
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Meta tags preview tool coming soon. You can manually check your pages using browser developer tools.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
