import { paystackService, PaystackPaymentData } from "./paystack"
import { flutterwaveService, FlutterwavePaymentData } from "./flutterwave"
import { PaymentMethod, paymentMethods } from "./config"
import { v4 as uuidv4 } from "uuid"

export interface PaymentIntentData {
  orderId: string
  userId: string
  bookId: string
  amount: number
  currency: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  callbackUrl: string
  metadata?: Record<string, any>
}

export interface PaymentResult {
  success: boolean
  paymentUrl?: string
  reference?: string
  error?: string
  provider: PaymentMethod
  data?: any
}

export interface VerificationResult {
  success: boolean
  status: string
  amount: number
  currency: string
  reference: string
  customerEmail: string
  metadata?: Record<string, any>
  provider: PaymentMethod
  data?: any
}

class PaymentService {
  async initializePayment(
    provider: PaymentMethod,
    paymentData: PaymentIntentData
  ): Promise<PaymentResult> {
    try {
      switch (provider) {
        case paymentMethods.PAYSTACK:
          return await this.initializePaystackPayment(paymentData)
        
        case paymentMethods.FLUTTERWAVE:
          return await this.initializeFlutterwavePayment(paymentData)
        
        default:
          throw new Error(`Unsupported payment provider: ${provider}`)
      }
    } catch (error: any) {
      console.error(`Payment initialization error (${provider}):`, error.message)
      return {
        success: false,
        error: error.message,
        provider,
      }
    }
  }

  private async initializePaystackPayment(data: PaymentIntentData): Promise<PaymentResult> {
    const reference = `${data.orderId}-${uuidv4()}`
    
    const paystackData: PaystackPaymentData = {
      reference,
      amount: paystackService.toKobo(data.amount), // Convert to kobo
      email: data.customerEmail,
      currency: data.currency,
      callback_url: data.callbackUrl,
      metadata: {
        orderId: data.orderId,
        userId: data.userId,
        bookId: data.bookId,
        ...data.metadata,
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: data.orderId,
          },
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: data.customerName,
          },
        ],
      },
      channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
    }

    const response = await paystackService.initializePayment(paystackData)
    
    if (response.status) {
      return {
        success: true,
        paymentUrl: response.data.authorization_url,
        reference: response.data.reference,
        provider: paymentMethods.PAYSTACK,
        data: response.data,
      }
    } else {
      throw new Error(response.message)
    }
  }

  private async initializeFlutterwavePayment(data: PaymentIntentData): Promise<PaymentResult> {
    const txRef = flutterwaveService.generateTxRef("VIC")
    
    const flutterwaveData: FlutterwavePaymentData = {
      tx_ref: txRef,
      amount: data.amount,
      currency: data.currency,
      redirect_url: data.callbackUrl,
      payment_options: "card,banktransfer,ussd,account",
      customer: {
        email: data.customerEmail,
        phonenumber: data.customerPhone,
        name: data.customerName,
      },
      customizations: {
        title: "EdifyPub",
        description: "Book Purchase",
        logo: `${process.env.NEXTAUTH_URL}/placeholder-logo.png`,
      },
      meta: {
        orderId: data.orderId,
        userId: data.userId,
        bookId: data.bookId,
        ...data.metadata,
      },
    }

    const response = await flutterwaveService.initializePayment(flutterwaveData)
    
    if (response.status === "success") {
      return {
        success: true,
        paymentUrl: response.data.link,
        reference: txRef,
        provider: paymentMethods.FLUTTERWAVE,
        data: response.data,
      }
    } else {
      throw new Error(response.message)
    }
  }

  async verifyPayment(
    provider: PaymentMethod,
    reference: string
  ): Promise<VerificationResult> {
    try {
      switch (provider) {
        case paymentMethods.PAYSTACK:
          return await this.verifyPaystackPayment(reference)
        
        case paymentMethods.FLUTTERWAVE:
          return await this.verifyFlutterwavePayment(reference)
        
        default:
          throw new Error(`Unsupported payment provider: ${provider}`)
      }
    } catch (error: any) {
      console.error(`Payment verification error (${provider}):`, error.message)
      throw error
    }
  }

  private async verifyPaystackPayment(reference: string): Promise<VerificationResult> {
    const response = await paystackService.verifyPayment(reference)
    
    if (!response.status) {
      throw new Error(response.message)
    }

    return {
      success: response.data.status === "success",
      status: response.data.status,
      amount: paystackService.fromKobo(response.data.amount), // Convert from kobo
      currency: response.data.currency,
      reference: response.data.reference,
      customerEmail: response.data.customer.email,
      metadata: response.data.metadata,
      provider: paymentMethods.PAYSTACK,
      data: response.data,
    }
  }

  private async verifyFlutterwavePayment(transactionId: string): Promise<VerificationResult> {
    const response = await flutterwaveService.verifyPayment(transactionId)
    
    if (response.status !== "success") {
      throw new Error(response.message)
    }

    return {
      success: response.data.status === "successful",
      status: response.data.status,
      amount: response.data.amount,
      currency: response.data.currency,
      reference: response.data.tx_ref,
      customerEmail: response.data.customer.email,
      metadata: response.data.meta,
      provider: paymentMethods.FLUTTERWAVE,
      data: response.data,
    }
  }

  // Utility method to determine the best payment provider based on currency
  getRecommendedProvider(currency: string): PaymentMethod {
    switch (currency.toUpperCase()) {
      case "NGN":
        return paymentMethods.PAYSTACK // Paystack is better for NGN
      case "USD":
      case "GBP":
      case "EUR":
        return paymentMethods.FLUTTERWAVE // Flutterwave better for international
      default:
        return paymentMethods.PAYSTACK // Default fallback
    }
  }

  // Get available payment methods for a currency
  getAvailableProviders(currency: string): PaymentMethod[] {
    const providers: PaymentMethod[] = []
    
    // Both providers support NGN
    if (currency.toUpperCase() === "NGN") {
      providers.push(paymentMethods.PAYSTACK, paymentMethods.FLUTTERWAVE)
    }
    
    // Flutterwave supports more international currencies
    if (["USD", "GBP", "EUR", "KES", "GHS", "UGX", "TZS"].includes(currency.toUpperCase())) {
      providers.push(paymentMethods.FLUTTERWAVE)
    }
    
    return providers.length > 0 ? providers : [paymentMethods.PAYSTACK] // Fallback
  }

  // Format amount for display
  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }
}

export const paymentService = new PaymentService()
