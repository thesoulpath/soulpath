# 🚀 Stripe Payment Integration

This document outlines the complete Stripe payment integration for the SOULPATH application.

## 📋 **Overview**

The Stripe integration provides:
- **Credit Card Payments** via Stripe Checkout
- **Payment Intent Management** for custom payment flows
- **Webhook Handling** for payment status updates
- **Customer Management** with Stripe
- **Secure Payment Processing** with PCI DSS compliance

## 🔧 **Setup Requirements**

### **Environment Variables**
Add these to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### **Stripe Dashboard Setup**
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Dashboard
3. Set up webhook endpoints for payment events
4. Configure your business profile and payment methods

## 🏗️ **Architecture**

### **File Structure**
```
lib/stripe/
├── config.ts              # Stripe configuration
├── payment-service.ts     # Payment service layer
└── index.ts              # Main exports

components/
├── stripe/
│   └── StripeCheckout.tsx    # Checkout component
└── payment/
    └── StripePaymentMethod.tsx # Payment form component

app/api/stripe/
├── create-checkout-session/  # Checkout session API
├── create-payment-intent/    # Payment intent API
└── webhook/                  # Webhook handler

app/payment/
├── success/                  # Success page
└── cancel/                   # Cancel page
```

## 💳 **Payment Methods**

### **1. Stripe Checkout (Recommended)**
- **Pros**: Secure, PCI compliant, handles all payment methods
- **Use Case**: Complete checkout flow with redirect
- **Component**: `StripeCheckout`

```tsx
import { StripeCheckout } from '@/components/stripe/StripeCheckout';

<StripeCheckout
  amount={5000} // $50.00 in cents
  currency="usd"
  description="Wellness Session Package"
  customerEmail="customer@example.com"
  onSuccess={(sessionId) => console.log('Payment successful:', sessionId)}
  onError={(error) => console.error('Payment failed:', error)}
/>
```

### **2. Custom Payment Form**
- **Pros**: Full control over UI/UX
- **Use Case**: Embedded payment forms
- **Component**: `StripePaymentMethod`

```tsx
import { StripePaymentMethod } from '@/components/payment/StripePaymentMethod';

<StripePaymentMethod
  amount={5000}
  currency="usd"
  description="Wellness Session Package"
  customerEmail="customer@example.com"
  onSuccess={(paymentIntentId) => console.log('Payment successful:', paymentIntentId)}
  onError={(error) => console.error('Payment failed:', error)}
/>
```

## 🔌 **API Endpoints**

### **Create Checkout Session**
```http
POST /api/stripe/create-checkout-session
Content-Type: application/json

{
  "amount": 5000,
  "currency": "usd",
  "description": "Wellness Session Package",
  "customerEmail": "customer@example.com",
  "successUrl": "https://yoursite.com/payment/success",
  "cancelUrl": "https://yoursite.com/payment/cancel"
}
```

### **Create Payment Intent**
```http
POST /api/stripe/create-payment-intent
Content-Type: application/json

{
  "amount": 5000,
  "currency": "usd",
  "description": "Wellness Session Package",
  "customerEmail": "customer@example.com"
}
```

### **Webhook Handler**
```http
POST /api/stripe/webhook
Stripe-Signature: whsec_...
```

## 🔄 **Payment Flow**

### **Checkout Flow**
1. User selects payment method
2. `StripeCheckout` component creates checkout session
3. User redirected to Stripe Checkout
4. Payment processed by Stripe
5. User redirected to success/cancel page
6. Webhook updates payment status

### **Payment Intent Flow**
1. User fills payment form
2. `StripePaymentMethod` creates payment intent
3. Payment confirmed with Stripe Elements
4. Payment processed and status updated
5. Success/error callback triggered

## 🎯 **Integration Examples**

### **Booking Payment**
```tsx
import { StripeCheckout } from '@/components/stripe/StripeCheckout';

function BookingPayment({ booking, client }) {
  const handlePaymentSuccess = (sessionId: string) => {
    // Update booking status
    // Send confirmation email
    // Redirect to success page
  };

  return (
    <StripeCheckout
      amount={booking.totalAmount * 100} // Convert to cents
      currency={booking.currency}
      description={`Booking for ${booking.sessionType}`}
      customerEmail={client.email}
      metadata={{
        bookingId: booking.id,
        clientId: client.id,
        sessionType: booking.sessionType,
      }}
      onSuccess={handlePaymentSuccess}
      onError={(error) => toast.error(error)}
    />
  );
}
```

### **Package Purchase**
```tsx
import { StripePaymentMethod } from '@/components/payment/StripePaymentMethod';

function PackagePurchase({ package, client }) {
  const handlePaymentSuccess = (paymentIntentId: string) => {
    // Create user package record
    // Update client credits
    // Send confirmation email
  };

  return (
    <StripePaymentMethod
      amount={package.price * 100}
      currency={package.currency}
      description={`${package.name} Package`}
      customerEmail={client.email}
      onSuccess={handlePaymentSuccess}
      onError={(error) => toast.error(error)}
    />
  );
}
```

## 🛡️ **Security Features**

### **PCI Compliance**
- Stripe handles all sensitive card data
- No card information stored on your servers
- Automatic encryption and security updates

### **Webhook Verification**
- Signature verification for all webhook events
- Secure event processing
- Idempotency handling

### **Error Handling**
- Comprehensive error logging
- User-friendly error messages
- Fallback payment methods

## 📊 **Monitoring & Analytics**

### **Stripe Dashboard**
- Real-time payment monitoring
- Detailed transaction logs
- Fraud detection alerts
- Revenue analytics

### **Application Logs**
- Payment attempt logging
- Error tracking
- Performance monitoring
- Audit trails

## 🚀 **Deployment**

### **Production Checklist**
- [ ] Update environment variables with live keys
- [ ] Configure webhook endpoints
- [ ] Test payment flows
- [ ] Set up monitoring
- [ ] Configure error reporting

### **Testing**
- Use Stripe test keys for development
- Test with Stripe test cards
- Verify webhook handling
- Test error scenarios

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Payment Declined**
- Check card details
- Verify card has sufficient funds
- Check for fraud detection

#### **Webhook Failures**
- Verify webhook secret
- Check endpoint accessibility
- Monitor webhook logs

#### **Integration Errors**
- Verify API keys
- Check environment variables
- Review error logs

## 📚 **Additional Resources**

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Security](https://stripe.com/docs/security)

## 🤝 **Support**

For Stripe-specific issues:
- Check Stripe documentation
- Contact Stripe support
- Review Stripe status page

For application integration issues:
- Check application logs
- Review error messages
- Test with Stripe test mode
