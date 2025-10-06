import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, DollarSign, Calendar, Zap, Star } from 'lucide-react'

export default function TestFeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Victoria Publishing House - Feature Test</h1>
        <p className="text-xl text-gray-600">
          Test the new coupon system and book preorder functionality
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Preorder System */}
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Book Preorders
            </CardTitle>
            <CardDescription>
              Early access to upcoming fiction releases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <Zap className="w-3 h-3 mr-1" />
                New Feature
              </Badge>
              <p className="text-sm text-gray-600">
                Authors can set up preorder campaigns with special pricing and early access benefits.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Features:</h4>
              <ul className="text-sm space-y-1">
                <li>• Time-limited preorder periods</li>
                <li>• Early access discounts</li>
                <li>• Quantity limits and tracking</li>
                <li>• Automatic release date delivery</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Link href="/preorders">
                <Button size="sm">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Browse Preorders
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Admin Panel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Coupon System */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Discount Coupons
            </CardTitle>
            <CardDescription>
              Flexible discount system for marketing campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Star className="w-3 h-3 mr-1" />
                Marketing Tool
              </Badge>
              <p className="text-sm text-gray-600">
                Create percentage or fixed-amount discounts with advanced targeting options.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Features:</h4>
              <ul className="text-sm space-y-1">
                <li>• Percentage & fixed discounts</li>
                <li>• Usage limits & expiry dates</li>
                <li>• Genre-specific targeting</li>
                <li>• Real-time validation</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled>
                <DollarSign className="w-4 h-4 mr-1" />
                Test Coupon: SAVE20
              </Button>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Manage Coupons
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Author Dashboard */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Author Experience
            </CardTitle>
            <CardDescription>
              Enhanced dashboard for fiction authors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <BookOpen className="w-3 h-3 mr-1" />
                Fiction Focus
              </Badge>
              <p className="text-sm text-gray-600">
                Specialized tools for novelists and creative writers to manage their publishing journey.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Features:</h4>
              <ul className="text-sm space-y-1">
                <li>• Manuscript submission tracking</li>
                <li>• Sales analytics by genre</li>
                <li>• Preorder campaign management</li>
                <li>• Achievement system</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Link href="/account">
                <Button size="sm">
                  <Users className="w-4 h-4 mr-1" />
                  Author Portal
                </Button>
              </Link>
              <Link href="/publishing/submit">
                <Button variant="outline" size="sm">
                  Submit Work
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Integration */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>🎯 Complete Fiction Publishing Ecosystem</CardTitle>
            <CardDescription>
              Victoria Publishing House now offers end-to-end solutions for fiction authors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">For Authors:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Submit novels, short stories, and creative works
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Set up preorder campaigns for upcoming releases
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Track sales and reader engagement
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Manage series and multi-book projects
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">For Readers:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Get early access to new releases via preorders
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Apply discount coupons for special offers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Discover new fiction across multiple genres
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Support emerging authors and new voices
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">🚀 Ready to Test!</h4>
              <p className="text-sm text-yellow-700">
                All systems are integrated and ready for production. The platform now supports:
                comprehensive coupon management, book preorder campaigns, enhanced author dashboards,
                and fiction-focused publishing workflows.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
