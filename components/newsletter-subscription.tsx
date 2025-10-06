'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface NewsletterSubscriptionProps {
  className?: string
  title?: string
  description?: string
  variant?: 'default' | 'compact' | 'hero'
}

export default function NewsletterSubscription({ 
  className = '',
  title = "Stay Updated with DIFY Academy",
  description = "Get weekly writing tips, course updates, and community highlights delivered to your inbox.",
  variant = 'default'
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setSubscribed(true)
        setEmail('')
        toast({
          title: "Success!",
          description: data.message
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to subscribe",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'hero') {
    return (
      <div className={`text-center py-16 px-4 ${className}`}>
        <div className="max-w-2xl mx-auto">
          <Mail className="h-16 w-16 text-purple-500 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">{title}</h2>
          <p className="text-xl text-gray-600 mb-8">{description}</p>
          
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <span className="text-lg font-semibold">Thank you for subscribing!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                disabled={loading}
              />
              <Button type="submit" disabled={loading} size="lg">
                {loading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          )}
          
          <p className="text-sm text-gray-500 mt-4">
            Join 1,000+ writers improving their craft. Unsubscribe anytime.
          </p>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Mail className="h-6 w-6" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        {subscribed ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>Thank you for subscribing!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
              disabled={loading}
            />
            <Button 
              type="submit" 
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? 'Subscribing...' : 'Subscribe Now'}
            </Button>
          </form>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-purple-100 rounded-full">
            <Mail className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {subscribed ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              Successfully Subscribed!
            </h3>
            <p className="text-gray-600">
              Check your email for a welcome message with more details.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Subscribing...' : 'Subscribe to Newsletter'}
              </Button>
            </form>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Weekly writing tips and tutorials</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>New course announcements</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Community highlights and success stories</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Exclusive discounts and early access</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
