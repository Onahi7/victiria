'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Share2, Facebook, Twitter, Linkedin, Link2, Mail, MessageCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface BlogSocialShareProps {
  title: string
  excerpt?: string | null
  slug: string
  url?: string
}

export default function BlogSocialShare({ title, excerpt, slug, url }: BlogSocialShareProps) {
  const [open, setOpen] = useState(false)
  const shareUrl = url || `${typeof window !== 'undefined' ? window.location.origin : ''}/blog/${slug}`
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)
  const encodedExcerpt = encodeURIComponent(excerpt || '')

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedExcerpt}%0A%0A${encodedUrl}`,
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link Copied!",
        description: "Blog post link copied to clipboard",
      })
      setOpen(false)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleShare = (platform: string) => {
    window.open(shareLinks[platform as keyof typeof shareLinks], '_blank', 'width=600,height=400')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this post</DialogTitle>
          <DialogDescription>
            Share this blog post on your favorite social media platform
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleShare('facebook')}
            className="flex items-center justify-center gap-2"
          >
            <Facebook className="w-5 h-5 text-blue-600" />
            Facebook
          </Button>
          <Button
            variant="outline"
            onClick={() => handleShare('twitter')}
            className="flex items-center justify-center gap-2"
          >
            <Twitter className="w-5 h-5 text-sky-500" />
            Twitter
          </Button>
          <Button
            variant="outline"
            onClick={() => handleShare('linkedin')}
            className="flex items-center justify-center gap-2"
          >
            <Linkedin className="w-5 h-5 text-blue-700" />
            LinkedIn
          </Button>
          <Button
            variant="outline"
            onClick={() => handleShare('whatsapp')}
            className="flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5 text-green-600" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() => handleShare('email')}
            className="flex items-center justify-center gap-2"
          >
            <Mail className="w-5 h-5 text-gray-600" />
            Email
          </Button>
          <Button
            variant="outline"
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2"
          >
            <Link2 className="w-5 h-5 text-purple-600" />
            Copy Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
