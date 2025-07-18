// Payment configuration for Week 3 implementation
export const paymentConfig = {
  paystack: {
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
    secretKey: process.env.PAYSTACK_SECRET_KEY || "",
    baseUrl: "https://api.paystack.co",
  },
  flutterwave: {
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || "",
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY || "",
    baseUrl: "https://api.flutterwave.com/v3",
  },
  currency: "NGN", // Nigerian Naira
  supportedCurrencies: ["NGN", "USD", "GBP", "EUR"],
  webhookEndpoints: {
    paystack: "/api/webhooks/paystack",
    flutterwave: "/api/webhooks/flutterwave",
  },
}

export const paymentMethods = {
  PAYSTACK: "paystack",
  FLUTTERWAVE: "flutterwave",
  BANK_TRANSFER: "bank_transfer",
} as const

export type PaymentMethod = typeof paymentMethods[keyof typeof paymentMethods]

export const orderStatuses = {
  PENDING: "pending",
  CONFIRMED: "confirmed", 
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const

export type OrderStatus = typeof orderStatuses[keyof typeof orderStatuses]
