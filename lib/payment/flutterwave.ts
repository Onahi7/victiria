import axios from "axios"
import { paymentConfig } from "./config"

export interface FlutterwaveInitializeResponse {
  status: string
  message: string
  data: {
    link: string
  }
}

export interface FlutterwaveVerifyResponse {
  status: string
  message: string
  data: {
    id: number
    tx_ref: string
    flw_ref: string
    device_fingerprint: string
    amount: number
    currency: string
    charged_amount: number
    app_fee: number
    merchant_fee: number
    processor_response: string
    auth_model: string
    ip: string
    narration: string
    status: string
    payment_type: string
    created_at: string
    account_id: number
    customer: {
      id: number
      name: string
      phone_number: string
      email: string
      created_at: string
    }
    card: {
      first_6digits: string
      last_4digits: string
      issuer: string
      country: string
      type: string
      token: string
      expiry: string
    }
    meta: {
      authorization: {
        mode: string
        redirect: string
      }
    }
  }
}

export interface FlutterwavePaymentData {
  tx_ref: string
  amount: number
  currency: string
  redirect_url: string
  payment_options?: string
  customer: {
    email: string
    phonenumber?: string
    name: string
  }
  customizations: {
    title: string
    description: string
    logo?: string
  }
  meta?: {
    orderId: string
    userId: string
    bookId: string
  }
}

class FlutterwaveService {
  private baseUrl: string
  private secretKey: string
  private publicKey: string

  constructor() {
    this.baseUrl = paymentConfig.flutterwave.baseUrl
    this.secretKey = paymentConfig.flutterwave.secretKey
    this.publicKey = paymentConfig.flutterwave.publicKey
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    }
  }

  async initializePayment(data: FlutterwavePaymentData): Promise<FlutterwaveInitializeResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        data,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error: any) {
      console.error("Flutterwave initialization error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to initialize payment")
    }
  }

  async verifyPayment(transactionId: string): Promise<FlutterwaveVerifyResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/${transactionId}/verify`,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error: any) {
      console.error("Flutterwave verification error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to verify payment")
    }
  }

  async createCustomer(data: {
    email: string
    name: string
    phone_number?: string
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/customers`,
        data,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error: any) {
      console.error("Flutterwave customer creation error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to create customer")
    }
  }

  async getBanks(country: string = "NG") {
    try {
      const response = await axios.get(
        `${this.baseUrl}/banks/${country}`,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error: any) {
      console.error("Flutterwave banks fetch error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to fetch banks")
    }
  }

  async createTransfer(data: {
    account_bank: string
    account_number: string
    amount: number
    narration: string
    currency: string
    reference?: string
    callback_url?: string
    debit_currency?: string
    beneficiary_name?: string
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transfers`,
        data,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error: any) {
      console.error("Flutterwave transfer error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to create transfer")
    }
  }

  async verifyAccountNumber(data: {
    account_number: string
    account_bank: string
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/accounts/resolve`,
        data,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error: any) {
      console.error("Flutterwave account verification error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to verify account")
    }
  }

  async getTransaction(transactionId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/${transactionId}`,
        { headers: this.getHeaders() }
      )
      
      return response.data
    } catch (error: any) {
      console.error("Flutterwave transaction fetch error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Failed to fetch transaction")
    }
  }

  // Helper method to generate unique transaction reference
  generateTxRef(prefix: string = "VIC"): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
  }

  // Validate webhook signature
  validateWebhook(payload: string, signature: string): boolean {
    const crypto = require("crypto")
    const hash = crypto
      .createHmac("sha256", this.secretKey)
      .update(payload)
      .digest("hex")
    
    return hash === signature
  }

  // Get supported payment methods
  getPaymentMethods() {
    return [
      "card",
      "banktransfer", 
      "ussd",
      "qr",
      "mobilemoney",
      "mpesa",
      "account"
    ]
  }
}

export const flutterwaveService = new FlutterwaveService()
