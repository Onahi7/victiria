"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BookOpen, 
  Plus, 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  PenTool,
  Award,
  MessageSquare
} from "lucide-react"

interface Submission {
  id: string
  title: string
  genre: string
  status: string
  submittedAt: string | null
  createdAt: string
  updatedAt: string
  submissionFeeStatus: string
  adminFeedback: string | null
}

export default function SubmissionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [genreFilter, setGenreFilter] = useState('all')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin?callbackUrl=/publishing/submissions')
      return
    }

    fetchSubmissions()
  }, [session, status])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/publishing/submissions')
      const result = await response.json()
      
      if (result.success) {
        setSubmissions(result.data)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
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

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.genre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter
    const matchesGenre = genreFilter === 'all' || submission.genre === genreFilter
    
    return matchesSearch && matchesStatus && matchesGenre
  })

  const genres = Array.from(new Set(submissions.map(s => s.genre))).filter(Boolean)

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
              My Submissions
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Manage all your book submissions in one place
            </p>
          </div>
          <Button onClick={() => router.push('/publishing/submissions/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Submission
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>

              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger>
                  <BookOpen className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Grid */}
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No submissions found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {submissions.length === 0 
                  ? "You haven't submitted any books yet. Start your publishing journey today!"
                  : "No submissions match your current filters. Try adjusting your search criteria."
                }
              </p>
              {submissions.length === 0 && (
                <Button onClick={() => router.push('/publishing/submissions/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Your First Book
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(submission.status)}
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/publishing/submissions/${submission.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {submission.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/publishing/submissions/${submission.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{submission.title}</CardTitle>
                  <CardDescription>{submission.genre}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
                    </div>
                    {submission.submittedAt && (
                      <div className="flex justify-between">
                        <span>Submitted:</span>
                        <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <Badge variant={submission.submissionFeeStatus === 'paid' ? 'default' : 'secondary'}>
                        {submission.submissionFeeStatus}
                      </Badge>
                    </div>
                    {submission.adminFeedback && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <MessageSquare className="w-3 h-3" />
                          Admin feedback available
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(`/publishing/submissions/${submission.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statistics */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="text-center pt-6">
              <div className="text-2xl font-bold">{submissions.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {submissions.filter(s => s.status === 'under_review').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Under Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center pt-6">
              <div className="text-2xl font-bold text-green-600">
                {submissions.filter(s => s.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {submissions.filter(s => s.status === 'published').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Published</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
