# MTN MOMO Environment Variables Setup

Add these environment variables to your `.env.local` file for MTN MOMO integration:

```env
# MTN MOMO Configuration
MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MTN_MOMO_SUBSCRIPTION_KEY=your_subscription_key_here
MTN_MOMO_USER_ID=your_user_id_here
MTN_MOMO_API_KEY=your_api_key_here
MTN_MOMO_TARGET_ENVIRONMENT=sandbox

# For production, change to:
# MTN_MOMO_BASE_URL=https://momodeveloper.mtn.com
# MTN_MOMO_TARGET_ENVIRONMENT=live
```

## Getting MTN MOMO Credentials

1. **Register as a Developer**
   - Go to [MTN MOMO Developer Portal](https://momodeveloper.mtn.com/)
   - Create an account and verify your email
   - Complete the KYC process

2. **Create a Subscription**
   - Subscribe to the Collections product
   - You'll get a `Primary Key` (this is your subscription key)

3. **Create API User and Key**
   - Use the MTN MOMO API to create a user and API key
   - Or use their developer tools to generate these

4. **Test Environment Setup**
   - Start with sandbox environment
   - Use test phone numbers provided by MTN
   - Test transaction flows

## API Usage Example

```javascript
// Initialize payment
const response = await fetch('/api/payment/mtn-momo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'order_123',
    amount: 25.00,
    currency: 'USD',
    phoneNumber: '+256700000000', // User's mobile money number
    email: 'user@example.com'
  })
})

// Check payment status
const statusResponse = await fetch(`/api/payment/mtn-momo?transactionRef=${transactionRef}`)
```

## Important Notes

1. **Phone Number Format**: MTN MOMO requires phone numbers in international format without special characters
2. **Currency Support**: Check which currencies are supported in your target countries
3. **Callback URL**: Must be HTTPS in production
4. **Rate Limits**: Be aware of API rate limits
5. **Error Handling**: Implement proper error handling and retry logic

## Testing

Use MTN's sandbox environment with these test phone numbers:
- +256700000000 (successful payment)
- +256700000001 (failed payment)
- +256700000002 (pending payment)

## Security Considerations

1. **Never expose API keys** in frontend code
2. **Validate all webhooks** using MTN's signature verification
3. **Use HTTPS** for all callback URLs
4. **Store sensitive data** securely in environment variables
5. **Implement rate limiting** on your API endpoints
