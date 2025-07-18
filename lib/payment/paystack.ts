import axios from "axios"
import { paymentConfig, PaymentMethod } from "./config"

export interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    domain: string
    status: string
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata: Record<string, any>
    log: any
    fees: number
    fees_split: any
    authorization: {
      authorization_code: string
      bin: string
      last4: string
      exp_month: string
      exp_year: string
      channel: string
      card_type: string
      bank: string
      country_code: string
      brand: string
      reusable: boolean
      signature: string
    }
    customer: {
      id: number
      first_name: string
      last_name: string
      email: string
      customer_code: string
      phone: string
      metadata: Record<string, any>
      risk_action: string
    }
    plan: any
    split: any
    order_id: any
    paidAt: string
    createdAt: string
    requested_amount: number
    pos_transaction_data: any
    source: any
    fees_breakdown: any
  }
}

export interface PaystackPaymentData {
  reference: string
  amount: number // Amount in kobo (NGN) or cents (USD)
  email: string
  currency?: string
  callback_url?: string
  metadata?: {
    orderId: string
    userId: string
    bookId: string
    custom_fields?: Array<{
      display_name: string
      variable_name: string
      value: string
    }>
  }
  channels?: string[]
}

class PaystackService {
  private baseUrl: string
  private secretKey: string

  constructor() {
    this.baseUrl = paymentConfig.paystack.baseUrl
    this.secretKey = paymentConfig.paystack.secretKey
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    }
  }

  async initializePayment(data: PaystackPaymentData): Promise<PaystackInitializeResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        data,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error: any) {
      console.error("Paystack initialization error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to initialize payment")
    }
  }

  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error: any) {
      console.error("Paystack verification error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to verify payment")
    }
  }

  async createCustomer(data: {
    email: string
    first_name: string
    last_name: string
    phone?: string
    metadata?: Record<string, any>
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/customer`,
        data,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error: any) {
      console.error("Paystack customer creation error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to create customer")
    }
  }

  async getAllBanks() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/bank`,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error: any) {
      console.error("Paystack banks fetch error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to fetch banks")
    }
  }

  async createTransferRecipient(data: {
    type: string
    name: string
    account_number: string
    bank_code: string
    currency?: string
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transferrecipient`,
        data,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error: any) {
      console.error("Paystack transfer recipient error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to create transfer recipient")
    }
  }

  async initiateTransfer(data: {
    source: string
    amount: number
    recipient: string
    reason?: string
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transfer`,
        data,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error: any) {
      console.error("Paystack transfer error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to initiate transfer")
    }
  }

  // Helper method to convert amount to kobo (Paystack's smallest unit)
  toKobo(amount: number): number {
    return Math.round(amount * 100)
  }

  // Helper method to convert from kobo to naira
  fromKobo(amount: number): number {
    return amount / 100
  }

  // Validate webhook signature
  validateWebhook(payload: string, signature: string): boolean {
    const crypto = require("crypto")
    const hash = crypto
      .createHmac("sha512", this.secretKey)
      .update(payload)
      .digest("hex")
    
    return hash === signature
  }
}

export const paystackService = new PaystackService()
