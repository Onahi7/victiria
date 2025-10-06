'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, Eye, Plus, Save, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  variables: any
  createdAt: string
  updatedAt: string
}

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    variables: {}
  })

  const [sampleData, setSampleData] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch email templates",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch email templates",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingTemplate(null)
    setFormData({ name: '', subject: '', content: '', variables: {} })
  }

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setIsCreating(false)
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      variables: template.variables || {}
    })
  }

  const handleSave = async () => {
    try {
      const url = editingTemplate 
        ? `/api/admin/email-templates/${editingTemplate.id}`
        : '/api/admin/email-templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Template ${editingTemplate ? 'updated' : 'created'} successfully`
        })
        setEditingTemplate(null)
        setIsCreating(false)
        fetchTemplates()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save template",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Template deleted successfully"
        })
        fetchTemplates()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete template",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      })
    }
  }

  const handlePreview = async (template: EmailTemplate) => {
    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleData })
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewData(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to generate preview",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate preview",
        variant: "destructive"
      })
    }
  }

  const defaultTemplates = [
    {
      name: 'Welcome Email',
      variables: ['userName', 'courseName', 'instructorName', 'courseUrl']
    },
    {
      name: 'Course Completion',
      variables: ['userName', 'courseName', 'completionDate', 'certificateUrl']
    },
    {
      name: 'Newsletter',
      variables: ['userName', 'weeklyContent', 'featuredCourse', 'blogPosts']
    },
    {
      name: 'Promotional',
      variables: ['userName', 'offerTitle', 'discount', 'expiryDate', 'ctaUrl']
    }
  ]

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-gray-600 mt-1">Manage your email templates and newsletters</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="editor">Template Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.subject}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {Object.keys(template.variables || {}).length} vars
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(template)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">
                      Updated: {new Date(template.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {templates.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
                <p className="text-gray-600 mb-4">Create your first email template to get started</p>
                <Button onClick={handleCreate}>Create Template</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="editor" className="space-y-6">
          {(isCreating || editingTemplate) ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </CardTitle>
                <CardDescription>
                  Design your email template with dynamic variables
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Welcome Email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g., Welcome to {{courseName}}!"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">Email Content (HTML)</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="HTML content with {{variables}}"
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Template
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditingTemplate(null)
                      setIsCreating(false)
                    }}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No Template Selected</h3>
                <p className="text-gray-600 mb-4">Create a new template or edit an existing one</p>
                <Button onClick={handleCreate}>Create Template</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Template Variables</CardTitle>
              <CardDescription>
                Use these variables in your templates: {`{{variableName}}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {defaultTemplates.map((template) => (
                  <div key={template.name}>
                    <h4 className="font-semibold">{template.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="secondary">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {previewData ? (
            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <CardDescription>
                  Preview how your email will look to recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Subject Line</Label>
                    <div className="bg-gray-50 p-3 rounded border">
                      {previewData.subject}
                    </div>
                  </div>
                  <div>
                    <Label>Email Content</Label>
                    <div 
                      className="bg-white border rounded p-4 max-h-96 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: previewData.content }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No Preview Available</h3>
                <p className="text-gray-600 mb-4">Select a template and click preview to see how it looks</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Sample Data for Preview</CardTitle>
              <CardDescription>
                Enter sample values to replace variables in the preview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userName">User Name</Label>
                  <Input
                    id="userName"
                    value={sampleData.userName || ''}
                    onChange={(e) => setSampleData({ ...sampleData, userName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="courseName">Course Name</Label>
                  <Input
                    id="courseName"
                    value={sampleData.courseName || ''}
                    onChange={(e) => setSampleData({ ...sampleData, courseName: e.target.value })}
                    placeholder="Creative Writing Masterclass"
                  />
                </div>
                <div>
                  <Label htmlFor="instructorName">Instructor Name</Label>
                  <Input
                    id="instructorName"
                    value={sampleData.instructorName || ''}
                    onChange={(e) => setSampleData({ ...sampleData, instructorName: e.target.value })}
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    value={sampleData.discount || ''}
                    onChange={(e) => setSampleData({ ...sampleData, discount: e.target.value })}
                    placeholder="20%"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
