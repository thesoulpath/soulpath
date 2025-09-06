# Stripe Inline Payment Forms

This guide explains how to integrate Stripe inline payment forms into your application, allowing users to enter card details manually or use Stripe Link for faster checkout.

## 🚀 Features

- **Manual Card Entry**: Full card input with real-time validation
- **Stripe Link Integration**: One-click checkout for returning customers
- **3D Secure Support**: Automatic handling of strong customer authentication
- **Mobile Optimized**: Responsive design for all devices
- **Customizable Styling**: Flexible appearance options
- **Error Handling**: Comprehensive error states and recovery
- **TypeScript Support**: Full type safety

## 📦 Components

### 1. StripeInlineForm
The main inline payment form component with full Stripe Elements integration.

### 2. StripePaymentButton
A button that opens a modal with the payment form - perfect for embedding in existing UI.

### 3. StripePaymentDemo
A complete demo page showing all features and usage examples.

## 🔧 Installation

### 1. Install Dependencies
```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
```

### 2. Environment Variables
Add these to your `.env.local` file:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

## 💻 Basic Usage

### Simple Payment Form
```tsx
import { StripeInlineForm } from '@/components/stripe/StripeInlineForm';

export function CheckoutPage() {
  return (
    <StripeInlineForm
      amount={2500} // $25.00 in cents
      currency="usd"
      description="Consultation Session"
      customerEmail="user@example.com"
      onSuccess={(paymentIntentId) => {
        console.log('Payment successful:', paymentIntentId);
        // Handle success (redirect, show confirmation, etc.)
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
        // Handle error (show message, retry, etc.)
      }}
    />
  );
}
```

### Payment Button with Modal
```tsx
import { StripePaymentButton } from '@/components/stripe/StripePaymentButton';

export function ProductPage() {
  return (
    <div>
      <h1>Premium Service</h1>
      <p>$25.00 - One hour consultation</p>

      <StripePaymentButton
        amount={2500}
        currency="usd"
        description="Premium Consultation Service"
        customerEmail="user@example.com"
        buttonText="Book Now"
        onSuccess={(paymentIntentId) => {
          // Handle successful payment
          router.push('/thank-you');
        }}
        onError={(error) => {
          // Handle payment error
          alert('Payment failed: ' + error);
        }}
      />
    </div>
  );
}
```

## 🎨 Customization

### Appearance Customization
```tsx
<StripeInlineForm
  amount={5000}
  currency="usd"
  description="Service Payment"
  appearance={{
    theme: 'stripe', // 'stripe' | 'night' | 'flat'
    variables: {
      colorPrimary: '#0066cc',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '2px',
      borderRadius: '6px',
    },
    rules: {
      '.Input': {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      },
    },
  }}
/>
```

### Custom Button Styling
```tsx
<StripePaymentButton
  amount={10000}
  currency="usd"
  description="Premium Package"
  buttonText="Upgrade to Premium"
  buttonVariant="secondary"
  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

## 🔧 Advanced Configuration

### With Customer Management
```tsx
<StripeInlineForm
  amount={7500}
  currency="usd"
  description="Monthly Subscription"
  customerEmail="subscriber@example.com"
  customerId="cus_1234567890" // If you have an existing Stripe customer
  metadata={{
    plan: 'premium_monthly',
    user_id: 'user_123',
    source: 'website_checkout'
  }}
  onSuccess={async (paymentIntentId) => {
    // Update your database with payment info
    await updateUserSubscription(paymentIntentId);

    // Redirect to success page
    router.push('/subscription/success');
  }}
  onError={(error) => {
    // Log error for debugging
    console.error('Payment error:', error);

    // Show user-friendly message
    toast.error('Payment failed. Please try again.');
  }}
/>
```

### Multiple Payment Options
```tsx
const paymentOptions = [
  { amount: 2500, description: 'Basic Session', id: 'basic' },
  { amount: 5000, description: 'Extended Session', id: 'extended' },
  { amount: 10000, description: 'Premium Package', id: 'premium' },
];

export function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState(paymentOptions[0]);

  return (
    <div>
      <h1>Choose Your Plan</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {paymentOptions.map((plan) => (
          <div
            key={plan.id}
            className={`p-4 border rounded-lg cursor-pointer ${
              selectedPlan.id === plan.id ? 'border-blue-500' : 'border-gray-300'
            }`}
            onClick={() => setSelectedPlan(plan)}
          >
            <h3>{plan.description}</h3>
            <p>${(plan.amount / 100).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <StripeInlineForm
        amount={selectedPlan.amount}
        currency="usd"
        description={selectedPlan.description}
        metadata={{ plan_id: selectedPlan.id }}
        onSuccess={(paymentIntentId) => {
          // Handle payment success
          trackPurchase(selectedPlan.id, paymentIntentId);
        }}
        onError={(error) => {
          // Handle payment error
          trackPaymentError(selectedPlan.id, error);
        }}
      />
    </div>
  );
}
```

## 🔒 Security Features

- **PCI DSS Compliant**: All card data is handled securely by Stripe
- **Tokenization**: Card details are never stored on your server
- **HTTPS Required**: All payments require secure connections
- **3D Secure**: Automatic handling of additional authentication
- **Fraud Detection**: Built-in fraud prevention by Stripe

## 📱 Mobile Optimization

The components are fully responsive and optimized for mobile devices:

- Touch-friendly input fields
- Optimized keyboard layouts
- Responsive modal dialogs
- Mobile-optimized card input

## 🐛 Error Handling

### Common Error Scenarios
```tsx
<StripeInlineForm
  amount={2500}
  currency="usd"
  description="Service Payment"
  onError={(error) => {
    // Handle different error types
    if (error.includes('card_declined')) {
      alert('Your card was declined. Please try a different card.');
    } else if (error.includes('insufficient_funds')) {
      alert('Insufficient funds. Please check your balance.');
    } else if (error.includes('expired_card')) {
      alert('Your card has expired. Please use a different card.');
    } else {
      alert('Payment failed. Please try again or contact support.');
    }
  }}
/>
```

### Network Error Handling
```tsx
<StripeInlineForm
  amount={2500}
  currency="usd"
  description="Service Payment"
  onError={(error) => {
    if (error.includes('network') || error.includes('timeout')) {
      // Retry logic
      setTimeout(() => {
        // Retry the payment
        window.location.reload();
      }, 3000);
    }
  }}
/>
```

## 🎯 Testing

### Test Cards
Use these test card numbers for testing:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Insufficient Funds**: `4000 0000 0000 9995`

### Test Demo Page
Visit `/payment-demo` to see all features in action with test payments.

## 📊 Analytics & Tracking

### Payment Success Tracking
```tsx
<StripeInlineForm
  amount={2500}
  currency="usd"
  description="Consultation"
  metadata={{
    source: 'website',
    campaign: 'summer_promo',
    user_type: 'new_customer'
  }}
  onSuccess={(paymentIntentId) => {
    // Track successful payment
    analytics.track('payment_completed', {
      payment_intent_id: paymentIntentId,
      amount: 2500,
      currency: 'usd',
      source: 'website'
    });

    // Update user status
    updateUserPaymentStatus(paymentIntentId);
  }}
/>
```

## 🚀 Production Deployment

### Before Going Live
1. **Replace test keys** with live Stripe keys
2. **Enable 3D Secure** in your Stripe dashboard
3. **Configure webhooks** for payment confirmations
4. **Set up proper error logging**
5. **Test with real cards** (small amounts)

### Environment Variables for Production
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 🔗 Integration Examples

### E-commerce Product Page
```tsx
export function ProductCheckout({ product }) {
  return (
    <div className="product-page">
      <div className="product-info">
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <p className="price">${product.price}</p>
      </div>

      <StripeInlineForm
        amount={product.price * 100}
        currency="usd"
        description={`Purchase: ${product.name}`}
        metadata={{
          product_id: product.id,
          product_name: product.name,
          category: product.category
        }}
        onSuccess={(paymentIntentId) => {
          // Record purchase in database
          recordPurchase(paymentIntentId, product.id);

          // Send confirmation email
          sendPurchaseConfirmation(product, paymentIntentId);
        }}
      />
    </div>
  );
}
```

### Booking/Reservation System
```tsx
export function BookingConfirmation({ booking }) {
  return (
    <div className="booking-confirmation">
      <h2>Confirm Your Booking</h2>

      <div className="booking-details">
        <p>Date: {booking.date}</p>
        <p>Time: {booking.time}</p>
        <p>Service: {booking.service}</p>
        <p className="total">Total: ${booking.total}</p>
      </div>

      <StripePaymentButton
        amount={booking.total * 100}
        currency="usd"
        description={`Booking: ${booking.service}`}
        customerEmail={booking.customerEmail}
        buttonText="Confirm & Pay"
        onSuccess={(paymentIntentId) => {
          // Update booking status
          confirmBooking(booking.id, paymentIntentId);

          // Send confirmation
          sendBookingConfirmation(booking, paymentIntentId);
        }}
      />
    </div>
  );
}
```

## 📞 Support

For issues with Stripe integration:
1. Check the browser console for error messages
2. Verify your Stripe keys are correct
3. Ensure you're using HTTPS in production
4. Check the Stripe dashboard for payment attempts

## 📝 API Reference

### StripeInlineForm Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `amount` | `number` | ✅ | Payment amount in cents |
| `currency` | `string` | ✅ | Currency code (e.g., 'usd') |
| `description` | `string` | ✅ | Payment description |
| `customerEmail` | `string` | ❌ | Customer email address |
| `customerId` | `string` | ❌ | Existing Stripe customer ID |
| `metadata` | `object` | ❌ | Additional metadata |
| `onSuccess` | `function` | ❌ | Success callback |
| `onError` | `function` | ❌ | Error callback |
| `onCancel` | `function` | ❌ | Cancel callback |
| `appearance` | `object` | ❌ | Styling configuration |
| `className` | `string` | ❌ | Additional CSS classes |

### StripePaymentButton Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `amount` | `number` | ✅ | Payment amount in cents |
| `currency` | `string` | ✅ | Currency code |
| `description` | `string` | ✅ | Payment description |
| `buttonText` | `string` | ❌ | Custom button text |
| `buttonVariant` | `string` | ❌ | Button style variant |
| `customerEmail` | `string` | ❌ | Customer email |
| `customerId` | `string` | ❌ | Stripe customer ID |
| `metadata` | `object` | ❌ | Additional metadata |
| `onSuccess` | `function` | ❌ | Success callback |
| `onError` | `function` | ❌ | Error callback |
| `appearance` | `object` | ❌ | Form styling |
| `className` | `string` | ❌ | Additional CSS classes |

---

🎉 **You're all set to accept payments with Stripe inline forms!** Users can now enter their card details manually or use Stripe Link for faster checkout.
