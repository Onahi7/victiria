# Week 3 Testing Guide - Payment Integration & Advanced Features

## Quick Setup

### 1. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Fill in your actual credentials:
# - Database URL (Neon PostgreSQL)
# - Paystack keys (test mode)
# - Flutterwave keys (test mode)
# - Resend API key
# - ImageKit credentials
```

### 2. Database Setup
```bash
# Install dependencies
pnpm install

# Reset and seed database with new schema
pnpm db:push
pnpm db:seed
```

### 3. Start Development Server
```bash
pnpm dev
```

## Testing Payment Integration

### Test Cards for Development

#### Paystack Test Cards
```
# Successful Payment
Card: 4084084084084081
CVV: 408
Expiry: Any future date
OTP: 123456

# Failed Payment  
Card: 4084084084084081
CVV: 408
Expiry: Any future date
OTP: 654321
```

#### Flutterwave Test Cards
```
# Successful Payment
Card: 5531886652142950
CVV: 564
Expiry: 09/32
OTP: 12345

# Insufficient Funds
Card: 5143010522339965
CVV: 564
Expiry: 09/32
```

### Payment Flow Testing

1. **Create Test Order**
   ```bash
   POST /api/orders
   {
     "items": [
       { "bookId": 1, "quantity": 2, "price": 2500 }
     ],
     "shippingAddress": {
       "fullName": "Test User",
       "phone": "08012345678",
       "address": "123 Test Street",
       "city": "Lagos",
       "state": "Lagos",
       "postalCode": "100001"
     }
   }
   ```

2. **Initialize Payment**
   ```bash
   POST /api/payment/initialize
   {
     "orderId": "generated-order-id",
     "provider": "paystack" // or "flutterwave"
   }
   ```

3. **Test Webhook (using ngrok)**
   ```bash
   # Install ngrok
   npm install -g ngrok

   # Expose local server
   ngrok http 3000

   # Update webhook URLs in payment dashboards:
   # Paystack: https://your-ngrok-url.ngrok.io/api/payment/webhook/paystack
   # Flutterwave: https://your-ngrok-url.ngrok.io/api/payment/webhook/flutterwave
   ```

## Testing Advanced Features

### 1. Recommendations System
```bash
# Get personalized recommendations
GET /api/recommendations?userId=1

# Get popular books
GET /api/recommendations/popular

# Get similar books
GET /api/recommendations/similar?bookId=1
```

### 2. Wishlist Management
```bash
# Add to wishlist
POST /api/wishlist
{ "bookId": 1 }

# Get user wishlist
GET /api/wishlist

# Remove from wishlist
DELETE /api/wishlist/1
```

### 3. Reviews & Ratings
```bash
# Create review
POST /api/reviews
{
  "bookId": 1,
  "rating": 5,
  "comment": "Excellent book!",
  "title": "Amazing read"
}

# Get book reviews
GET /api/reviews?bookId=1

# Update review
PUT /api/reviews/1
{ "rating": 4, "comment": "Updated review" }
```

### 4. Reading Progress
```bash
# Update reading progress
POST /api/reading-progress
{
  "bookId": 1,
  "currentPage": 150,
  "totalPages": 300
}

# Get reading statistics
GET /api/reading-progress?userId=1
```

### 5. Dashboard Analytics
```bash
# Get complete dashboard data
GET /api/dashboard

# Response includes:
# - Overview statistics
# - Recent activities
# - Reading insights
# - User preferences
```

## Database Testing

### Verify New Tables
```sql
-- Check payment transactions
SELECT * FROM payment_transactions LIMIT 5;

-- Check wishlists
SELECT * FROM wishlists LIMIT 5;

-- Check reviews
SELECT * FROM reviews LIMIT 5;

-- Check reading progress
SELECT * FROM reading_progress LIMIT 5;

-- Check user preferences
SELECT * FROM user_preferences LIMIT 5;
```

### Sample Data Verification
```sql
-- Verify seeded books with enhanced data
SELECT id, title, price, category, tags FROM books LIMIT 5;

-- Check users with preferences
SELECT u.name, up.favorite_genres, up.reading_goal 
FROM users u 
LEFT JOIN user_preferences up ON u.id = up.user_id 
LIMIT 5;
```

## Common Issues & Solutions

### Payment Integration Issues
1. **Webhook not receiving data**
   - Check ngrok is running
   - Verify webhook URLs in payment dashboards
   - Check webhook secrets in environment

2. **Payment initialization fails**
   - Verify API keys are correct
   - Check test mode vs live mode
   - Ensure proper request format

### Feature Testing Issues
1. **Recommendations returning empty**
   - Check if user has purchase/view history
   - Verify books have proper categories and tags
   - Check database seeding completed

2. **Dashboard not loading**
   - Verify user authentication
   - Check if user has associated data
   - Ensure all tables are properly seeded

## Next Steps (Week 4 Preview)

Week 4 will focus on:
- Performance optimization
- Monitoring and analytics
- Production deployment
- Advanced caching
- Security hardening
- Load testing

## Support

Check the following files for implementation details:
- `WEEK_3_COMPLETE.md` - Complete feature overview
- `lib/payment/` - Payment integration code
- `app/api/` - All API endpoints
- Database schema in migration files
