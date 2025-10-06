'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  BookOpen, 
  Clock, 
  User, 
  Star, 
  Eye, 
  MessageSquare, 
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Send
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Author {
  id: string
  name: string
  email: string
  bio: string
  avatar: string
  joinedAt: string
  totalSubmissions: number
  publishedBooks: number
  averageRating: number
}

interface Submission {
  id: string
  title: string
  description: string
  category: string
  genre: string
  subgenre: string
  wordCount: number
  language: string
  author: Author
  status: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'published'
  submittedAt: string
  reviewedAt: string | null
  publishedAt: string | null
  manuscriptUrl: string
  coverImageUrl: string | null
  targetAudience: string
  themes: string[]
  contentWarnings: string[]
  isSeriesBook: boolean
  seriesInfo: {
    seriesTitle: string
    bookNumber: number
    totalBooks: number
  } | null
  collaborators: string[]
  previouslyPublished: boolean
  publishingRights: 'exclusive' | 'non-exclusive'
  marketingBudget: number
  expectedReleaseDate: string
  reviewerNotes: string
  contractTerms: any
}

export default function AdminSubmissionsManagement() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [reviewNotes, setReviewNotes] = useState('')
  const [contractTerms, setContractTerms] = useState({
    royaltyPercentage: '',
    advancePayment: '',
    contractLength: '',
    territories: 'worldwide',
    formats: ['print', 'ebook']
  })

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    published: 'bg-purple-100 text-purple-800'
  }

  const genreCategories = {
    fiction: [
      'Literary Fiction',
      'Romance',
      'Mystery/Thriller',
      'Fantasy',
      'Science Fiction',
      'Horror',
      'Historical Fiction',
      'Contemporary Fiction',
      'Young Adult',
      'African Literature',
      'Magical Realism'
    ],
    'non-fiction': [
      'Biography/Memoir',
      'Self-Help',
      'Business',
      'Health/Wellness',
      'Travel',
      'Cooking',
      'History',
      'Politics',
      'Religion/Spirituality'
    ]
  }

  const handleStatusUpdate = async (submissionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          reviewerNotes: reviewNotes,
          contractTerms: newStatus === 'accepted' ? contractTerms : undefined
        }),
      })

      if (response.ok) {
        toast({
          title: "Status Updated",
          description: `Submission ${newStatus} successfully`,
        })
        // Refresh submissions list
        fetchSubmissions()
      } else {
        toast({
          title: "Error",
          description: "Failed to update submission status",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update submission status",
        variant: "destructive"
      })
    }
  }

  const fetchSubmissions = async () => {
    // Implementation for fetching submissions
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'under_review':
        return <Eye className="w-4 h-4" />
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      case 'published':
        return <BookOpen className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const renderSubmissionCard = (submission: Submission) => (
    <Card key={submission.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{submission.title}</CardTitle>
            <CardDescription className="mb-3">
              by {submission.author.name} • {submission.genre}
              {submission.subgenre && ` • ${submission.subgenre}`}
            </CardDescription>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{submission.wordCount.toLocaleString()} words</span>
              <span>{submission.language}</span>
              <span>Submitted {new Date(submission.submittedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[submission.status]}>
              {getStatusIcon(submission.status)}
              <span className="ml-1 capitalize">{submission.status.replace('_', ' ')}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
          {submission.description}
        </p>
        
        {/* Enhanced Fiction Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <span className="font-medium">Target Audience:</span>
            <br />
            {submission.targetAudience}
          </div>
          {submission.isSeriesBook && submission.seriesInfo && (
            <div>
              <span className="font-medium">Series:</span>
              <br />
              {submission.seriesInfo.seriesTitle} (Book {submission.seriesInfo.bookNumber})
            </div>
          )}
          <div>
            <span className="font-medium">Rights:</span>
            <br />
            {submission.publishingRights}
          </div>
          <div>
            <span className="font-medium">Author Rating:</span>
            <br />
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {submission.author.averageRating.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Themes and Content Warnings */}
        {submission.themes.length > 0 && (
          <div className="mb-3">
            <span className="text-sm font-medium">Themes: </span>
            {submission.themes.map((theme, index) => (
              <Badge key={index} variant="outline" className="mr-1 text-xs">
                {theme}
              </Badge>
            ))}
          </div>
        )}

        {submission.contentWarnings.length > 0 && (
          <div className="mb-4">
            <span className="text-sm font-medium text-orange-600">Content Warnings: </span>
            {submission.contentWarnings.map((warning, index) => (
              <Badge key={index} variant="destructive" className="mr-1 text-xs">
                {warning}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedSubmission(submission)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Review
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(submission.manuscriptUrl, '_blank')}
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Open author profile */}}
          >
            <User className="w-4 h-4 mr-1" />
            Author
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fiction Submissions</h1>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              <SelectItem value="fiction">Fiction</SelectItem>
              <SelectItem value="romance">Romance</SelectItem>
              <SelectItem value="thriller">Thriller</SelectItem>
              <SelectItem value="fantasy">Fantasy</SelectItem>
              <SelectItem value="african">African Literature</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Submissions</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {/* Mock data - replace with actual submissions */}
            {[].map(renderSubmissionCard)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detailed Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{selectedSubmission.title}</CardTitle>
                  <CardDescription className="text-lg mt-2">
                    by {selectedSubmission.author.name}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSubmission(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Author Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Author Profile</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Submissions:</span>
                    <br />
                    {selectedSubmission.author.totalSubmissions}
                  </div>
                  <div>
                    <span className="font-medium">Published Books:</span>
                    <br />
                    {selectedSubmission.author.publishedBooks}
                  </div>
                  <div>
                    <span className="font-medium">Average Rating:</span>
                    <br />
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {selectedSubmission.author.averageRating.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Member Since:</span>
                    <br />
                    {new Date(selectedSubmission.author.joinedAt).getFullYear()}
                  </div>
                </div>
              </div>

              {/* Book Details */}
              <div>
                <h3 className="font-semibold mb-3">Manuscript Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Genre:</span> {selectedSubmission.genre}
                  </div>
                  <div>
                    <span className="font-medium">Word Count:</span> {selectedSubmission.wordCount.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Target Audience:</span> {selectedSubmission.targetAudience}
                  </div>
                  <div>
                    <span className="font-medium">Publishing Rights:</span> {selectedSubmission.publishingRights}
                  </div>
                </div>
              </div>

              {/* Synopsis */}
              <div>
                <h3 className="font-semibold mb-2">Synopsis</h3>
                <p className="text-sm text-gray-700">{selectedSubmission.description}</p>
              </div>

              {/* Review Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Review & Decision</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reviewNotes">Review Notes</Label>
                    <Textarea
                      id="reviewNotes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add your review comments..."
                      rows={4}
                    />
                  </div>

                  {/* Contract Terms (for accepted submissions) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="royalty">Royalty Percentage (%)</Label>
                      <Input
                        id="royalty"
                        type="number"
                        value={contractTerms.royaltyPercentage}
                        onChange={(e) => setContractTerms({
                          ...contractTerms,
                          royaltyPercentage: e.target.value
                        })}
                        placeholder="15"
                      />
                    </div>
                    <div>
                      <Label htmlFor="advance">Advance Payment ($)</Label>
                      <Input
                        id="advance"
                        type="number"
                        value={contractTerms.advancePayment}
                        onChange={(e) => setContractTerms({
                          ...contractTerms,
                          advancePayment: e.target.value
                        })}
                        placeholder="1000"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStatusUpdate(selectedSubmission.id, 'accepted')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept for Publishing
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(selectedSubmission.id, 'rejected')}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(selectedSubmission.id, 'under_review')}
                      variant="outline"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Request Revisions
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
