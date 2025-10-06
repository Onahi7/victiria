'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import TiptapEditor from '@/components/tiptap-editor'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  User,
  BookOpen,
  Image as ImageIcon,
  Link as LinkIcon,
  FormInput,
  Save,
  X
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatDistance } from 'date-fns'
import Image from 'next/image'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  slug: string
  coverImage: string | null
  category: string | null
  tags: string[]
  status: 'draft' | 'published' | 'scheduled'
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    avatar: string | null
  }
  seoTitle?: string
  seoDescription?: string
}

interface BlogPostFormData {
  title: string
  content: string
  excerpt: string
  category: string
  tags: string[]
  coverImage: string
  seoTitle: string
  seoDescription: string
  status: 'draft' | 'published' | 'scheduled'
}

export default function AdminBlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: [],
    coverImage: '',
    seoTitle: '',
    seoDescription: '',
    status: 'draft'
  })
  const [tagInput, setTagInput] = useState('')

  const categories = [
    'writing', 'publishing', 'academy', 'industry', 'tips', 'news', 'personal'
  ]

  useEffect(() => {
    fetchPosts()
  }, [])

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'blog-covers')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload image')
    }

    const { data } = await response.json()
    return data.url
  }

  const handleImageUpload = async (file: File, setter: (url: string) => void) => {
    setUploading(true)
    try {
      const imageUrl = await uploadImage(file)
      setter(imageUrl)
      toast({
        title: "Success",
        description: "Image uploaded successfully!"
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/admin/blog')
      if (!response.ok) throw new Error('Failed to fetch posts')
      
      const data = await response.json()
      if (data.success && data.data && Array.isArray(data.data.posts)) {
        setPosts(data.data.posts)
      } else if (data.success && Array.isArray(data.data)) {
        // Fallback for direct array response
        setPosts(data.data)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([]) // Ensure posts is always an array
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let finalFormData = { ...formData }
      
      // If there's a cover image file to upload and no URL set yet
      if (coverImageFile && !formData.coverImage) {
        try {
          const coverImageUrl = await uploadImage(coverImageFile)
          finalFormData.coverImage = coverImageUrl
        } catch (error) {
          console.error('Error uploading cover image:', error)
          toast({
            title: "Error",
            description: "Failed to upload cover image",
            variant: "destructive"
          })
          return
        }
      }
      
      const url = selectedPost ? `/api/admin/blog/${selectedPost.id}` : '/api/admin/blog'
      const method = selectedPost ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFormData),
      })

      if (!response.ok) throw new Error('Failed to save post')

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: selectedPost ? "Blog post updated successfully" : "Blog post created successfully",
        })
        
        fetchPosts()
        setShowCreateDialog(false)
        setShowEditDialog(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving post:', error)
      toast({
        title: "Error",
        description: "Failed to save blog post",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedPost) return

    try {
      const response = await fetch(`/api/admin/blog/${selectedPost.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete post')

      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      })
      
      fetchPosts()
      setShowDeleteDialog(false)
      setSelectedPost(null)
    } catch (error) {
      console.error('Error deleting post:', error)
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      tags: [],
      coverImage: '',
      seoTitle: '',
      seoDescription: '',
      status: 'draft'
    })
    setTagInput('')
    setSelectedPost(null)
    setCoverImageFile(null)
    setUploading(false)
  }

  const openEditDialog = (post: BlogPost) => {
    setSelectedPost(post)
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      category: post.category || '',
      tags: post.tags || [],
      coverImage: post.coverImage || '',
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      status: post.status
    })
    setShowEditDialog(true)
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPosts = Array.isArray(posts) ? posts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  }) : []

  const PostForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="excerpt">Excerpt *</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              rows={3}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="coverImage">Cover Image</Label>
            <div className="space-y-2">
              <Input
                id="coverImage"
                value={formData.coverImage}
                onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
              <div className="text-center text-muted-foreground">OR</div>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setCoverImageFile(file)
                      handleImageUpload(file, (url) => {
                        setFormData(prev => ({ ...prev, coverImage: url }))
                      })
                    }
                  }}
                  disabled={uploading}
                />
                {uploading && <span className="text-sm">Uploading...</span>}
              </div>
              {formData.coverImage && (
                <div className="mt-2">
                  <Image
                    src={formData.coverImage}
                    alt="Cover preview"
                    width={200}
                    height={120}
                    className="rounded object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              value={formData.seoTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
              placeholder="SEO optimized title"
            />
          </div>
          
          <div>
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              value={formData.seoDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
              rows={3}
              placeholder="SEO meta description"
            />
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor="content">Content *</Label>
        <TiptapEditor
          content={formData.content}
          onChange={(content) => setFormData(prev => ({ ...prev, content }))}
          placeholder="Write your blog post content here..."
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            setShowCreateDialog(false)
            setShowEditDialog(false)
            resetForm()
          }}
        >
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {selectedPost ? 'Update Post' : 'Create Post'}
        </Button>
      </div>
    </form>
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Blog Management</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Blog Post</DialogTitle>
              <DialogDescription>
                Create a new blog post with rich content and SEO optimization.
              </DialogDescription>
            </DialogHeader>
            <PostForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="statusFilter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="categoryFilter">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts ({filteredPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {post.coverImage ? (
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            width={40}
                            height={40}
                            className="rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{post.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">
                            {post.excerpt}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(post.status)}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {post.category && (
                        <Badge variant="outline">{post.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {post.author.avatar ? (
                          <Image
                            src={post.author.avatar}
                            alt={post.author.name}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span className="text-sm">{post.author.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {post.publishedAt 
                          ? formatDistance(new Date(post.publishedAt), new Date(), { addSuffix: true })
                          : 'Not published'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedPost(post)
                            setShowDeleteDialog(true)
                          }}
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>
              Edit your blog post with rich content and SEO optimization.
            </DialogDescription>
          </DialogHeader>
          <PostForm />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPost?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
