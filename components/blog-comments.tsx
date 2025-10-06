'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Send, User, ThumbsUp, Reply } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    avatar: string | null
  }
  likes: number
  userHasLiked: boolean
  replies?: Comment[]
}

interface BlogCommentsProps {
  postId: string
  postSlug: string
}

export default function BlogComments({ postId, postSlug }: BlogCommentsProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/blog/${postSlug}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
        variant: "destructive",
      })
      return
    }

    if (!newComment.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/blog/${postSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (response.ok) {
        toast({
          title: "Comment posted!",
          description: "Your comment has been published",
        })
        setNewComment('')
        fetchComments()
      } else {
        const data = await response.json()
        toast({
          title: "Failed to post comment",
          description: data.error || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (commentId: string) => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like comments",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/blog/comments/${commentId}/like`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchComments()
      }
    } catch (error) {
      console.error('Failed to like comment:', error)
    }
  }

  const CommentCard = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-12 mt-4' : ''}`}>
      <Avatar className="h-10 w-10">
        <AvatarImage src={comment.author.avatar || undefined} />
        <AvatarFallback>
          {comment.author.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm">{comment.author.name}</span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleLike(comment.id)}
            className="h-8 px-2"
          >
            <ThumbsUp className={`w-4 h-4 mr-1 ${comment.userHasLiked ? 'fill-purple-600 text-purple-600' : ''}`} />
            <span className="text-xs">{comment.likes}</span>
          </Button>
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(comment.id)}
              className="h-8 px-2"
            >
              <Reply className="w-4 h-4 mr-1" />
              <span className="text-xs">Reply</span>
            </Button>
          )}
        </div>
        {comment.replies && comment.replies.map((reply) => (
          <CommentCard key={reply.id} comment={reply} isReply />
        ))}
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        <div className="space-y-4">
          {session ? (
            <>
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className="w-full sm:w-auto"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Sign in to join the conversation
              </p>
              <Button asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-300">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
