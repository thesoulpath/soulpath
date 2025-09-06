import { NextRequest, NextResponse } from 'next/server';
import { StripePaymentService } from '@/lib/stripe/payment-service';

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { 
        error: 'Stripe not configured',
        message: 'Payment processing is not available. Please contact support.',
        code: 'STRIPE_NOT_CONFIGURED'
      },
      { status: 503 }
    );
  }

  // Runtime check - ensure Stripe is available
  if (!StripePaymentService) {
    return NextResponse.json(
      { 
        error: 'Stripe service unavailable',
        message: 'Payment processing is temporarily unavailable.',
        code: 'STRIPE_SERVICE_UNAVAILABLE'
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const {
      amount,
      currency,
      customerEmail,
      customerId,
      metadata,
      description,
    } = body;

    // Validate required fields
    if (!amount || !currency || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create payment intent
    const result = await StripePaymentService.createPaymentIntent({
      amount, // Amount in cents
      currency: currency.toLowerCase(),
      customerId,
      customerEmail,
      metadata: {
        ...metadata,
        source: 'soulpath_payment_intent',
        timestamp: new Date().toISOString(),
      },
      description,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
