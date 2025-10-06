'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, DollarSign, Smartphone, Globe } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface PaymentGatewaySelectionProps {
  currency: 'USD' | 'NGN'
  amount: number
  bookId: string
  onGatewaySelect: (gateway: 'paypal' | 'mtn-momo' | 'paystack', phoneNumber?: string) => void
  onCancel: () => void
}

export default function PaymentGatewaySelection({ 
  currency, 
  amount, 
  bookId, 
  onGatewaySelect, 
  onCancel 
}: PaymentGatewaySelectionProps) {
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showPhoneInput, setShowPhoneInput] = useState(false)

  const handleGatewaySelect = async (gateway: 'paypal' | 'mtn-momo' | 'paystack') => {
    if (gateway === 'mtn-momo') {
      setShowPhoneInput(true)
      setSelectedGateway(gateway)
      return
    }

    setSelectedGateway(gateway)
    setLoading(true)

    try {
      // Call the parent callback
      onGatewaySelect(gateway)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment gateway",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setSelectedGateway(null)
    }
  }

  const handleMtnMomoSubmit = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your mobile money phone number",
        variant: "destructive"
      })
      return
    }

    // Basic phone number validation
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '')
    if (cleanPhone.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      onGatewaySelect('mtn-momo', cleanPhone)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize MTN MOMO payment",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    if (currency === 'USD') return `$${amount.toFixed(2)}`
    if (currency === 'NGN') return `₦${amount.toLocaleString()}`
    return `${currency} ${amount.toLocaleString()}`
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Choose Payment Method
        </CardTitle>
        <CardDescription>
          Select your preferred payment gateway for {formatPrice(amount, currency)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currency === 'USD' && (
          <>
            {/* PayPal Option */}
            <Button
              onClick={() => handleGatewaySelect('paypal')}
              disabled={loading}
              className="w-full justify-between p-6 h-auto"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">PayPal</div>
                  <div className="text-sm text-gray-600">
                    International cards & PayPal balance
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatPrice(amount, currency)}</div>
                <Badge variant="secondary" className="text-xs">
                  Worldwide
                </Badge>
              </div>
            </Button>

            {/* MTN MOMO Option */}
            <Button
              onClick={() => handleGatewaySelect('mtn-momo')}
              disabled={loading}
              className="w-full justify-between p-6 h-auto"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded">
                  <Smartphone className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">MTN Mobile Money</div>
                  <div className="text-sm text-gray-600">
                    Mobile money payments
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatPrice(amount, currency)}</div>
                <Badge variant="secondary" className="text-xs">
                  Africa
                </Badge>
              </div>
            </Button>
          </>
        )}

        {currency === 'NGN' && (
          /* Paystack Option */
          <Button
            onClick={() => handleGatewaySelect('paystack')}
            disabled={loading}
            className="w-full justify-between p-6 h-auto"
            variant="outline"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Paystack</div>
                <div className="text-sm text-gray-600">
                  Nigerian cards, bank transfer & USSD
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">{formatPrice(amount, currency)}</div>
              <Badge variant="secondary" className="text-xs">
                Nigeria
              </Badge>
            </div>
          </Button>
        )}

        <Separator />

        {/* Cancel Option */}
        <Button
          onClick={onCancel}
          variant="ghost"
          className="w-full"
          disabled={loading}
        >
          ← Back to currency selection
        </Button>

        {/* MTN MOMO Phone Number Input */}
        {showPhoneInput && selectedGateway === 'mtn-momo' && (
          <div className="space-y-4 p-4 border rounded-lg bg-yellow-50">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold">MTN Mobile Money</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Money Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+256 700 123 456"
                className="font-mono"
              />
              <div className="text-xs text-gray-600">
                Enter your registered MTN Mobile Money number with country code
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => {
                  setShowPhoneInput(false)
                  setSelectedGateway(null)
                  setPhoneNumber('')
                }}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMtnMomoSubmit}
                disabled={loading || !phoneNumber.trim()}
              >
                {loading ? 'Processing...' : 'Continue'}
              </Button>
            </div>
          </div>
        )}

        {loading && selectedGateway && !showPhoneInput && (
          <div className="text-center py-4">
            <div className="text-sm text-gray-600">
              Initializing {selectedGateway === 'paypal' ? 'PayPal' : selectedGateway === 'mtn-momo' ? 'MTN MOMO' : 'Paystack'}...
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
          {currency === 'USD' && (
            <>
              <div>• PayPal: Visa, MasterCard, American Express</div>
              <div>• MTN MOMO: Mobile money across Africa</div>
            </>
          )}
          {currency === 'NGN' && (
            <>
              <div>• Paystack: All Nigerian banks supported</div>
              <div>• USSD codes for feature phones</div>
            </>
          )}
          <div>• Secure SSL encryption</div>
          <div>• 30-day money-back guarantee</div>
        </div>
      </CardContent>
    </Card>
  )
}
