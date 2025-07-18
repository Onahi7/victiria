import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, CreditCard, Receipt, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-200 mb-2">
            Payment Successful!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your payment has been processed successfully.
          </p>
        </div>

        {/* Payment Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Payment Details</CardTitle>
            <CardDescription>Transaction information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Transaction ID:</span>
              <Badge variant="secondary">#TXN-2024-001</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Amount:</span>
              <span className="font-bold text-green-600 dark:text-green-400">₦29,999</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Method:</span>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">Paystack</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Completed
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Date:</span>
              <span className="text-sm">{new Date().toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Receipt</CardTitle>
            <CardDescription>Your payment receipt and next steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium">Email Receipt</h4>
                <p className="text-sm text-muted-foreground">
                  A detailed receipt has been sent to your email address
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium">Payment Confirmation</h4>
                <p className="text-sm text-muted-foreground">
                  Your payment will appear on your bank statement within 1-2 business days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button className="flex-1" asChild>
            <Link href="/account/library">
              <Receipt className="w-4 h-4 mr-2" />
              Access Content
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/account/orders">
              View Order History
            </Link>
          </Button>
        </div>

        {/* Continue Shopping */}
        <div className="text-center mt-8 pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Thank you for your purchase!
          </p>
          <Button variant="ghost" asChild>
            <Link href="/books">
              Continue Shopping
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
