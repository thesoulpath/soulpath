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
    // For checkout, we don't require authentication as customers need to pay
    // But you can add authentication if needed
    
    const body = await request.json();
    const {
      amount,
      currency,
      description,
      customerEmail,
      customerId,
      metadata,
      successUrl,
      cancelUrl,
    } = body;

    // Validate required fields
    if (!amount || !currency || !description || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create checkout session
    const result = await StripePaymentService.createCheckoutSession({
      customerId,
      customerEmail,
      lineItems: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description,
              description: `Payment for ${description}`,
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      successUrl,
      cancelUrl,
      metadata: {
        ...metadata,
        source: 'soulpath_checkout',
        timestamp: new Date().toISOString(),
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      url: result.url,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
