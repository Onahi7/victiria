import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Download, Eye, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-200 mb-2">
            Order Successful!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Order Details</CardTitle>
            <CardDescription>Your order information and next steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Order Number:</span>
              <Badge variant="secondary">#ORD-2024-001</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Confirmed
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Amount:</span>
              <span className="font-bold">₦29,999</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Method:</span>
              <span className="text-sm">Paystack</span>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">What's Next?</CardTitle>
            <CardDescription>Here's what you can do now</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium">Download Your Books</h4>
                <p className="text-sm text-muted-foreground">
                  Access your purchased books in your library
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium">Check Your Email</h4>
                <p className="text-sm text-muted-foreground">
                  We've sent you a confirmation email with receipt
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button className="flex-1" asChild>
            <Link href="/account/library">
              <Download className="w-4 h-4 mr-2" />
              Go to Library
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/account/orders">
              <Eye className="w-4 h-4 mr-2" />
              View All Orders
            </Link>
          </Button>
        </div>

        {/* Continue Shopping */}
        <div className="text-center mt-8 pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Want to continue shopping?
          </p>
          <Button variant="ghost" asChild>
            <Link href="/books">
              Browse More Books
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
