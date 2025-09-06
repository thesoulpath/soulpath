import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { headers } from 'next/headers';

// Initialize Stripe client inside the function to avoid build-time issues
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn('STRIPE_SECRET_KEY is not configured - Stripe webhook disabled');
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });
};

const getEndpointSecret = () => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('STRIPE_WEBHOOK_SECRET is not configured - Stripe webhook disabled');
    return null;
  }
  return secret;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const endpointSecret = getEndpointSecret();

    // If Stripe is not configured, return success to avoid build errors
    if (!stripe || !endpointSecret) {
      console.log('Stripe webhook disabled - returning success');
      return NextResponse.json({ received: true, message: 'Stripe webhook disabled' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase as any);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabase as any);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, supabase as any);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  try {
    console.log('Processing checkout session completed:', session.id);

    const metadata = session.metadata;
    if (!metadata) {
      console.error('No metadata found in session');
      return;
    }

    const customerId = metadata.customer_id;
    const packageId = metadata.package_id;
    // const paymentMethodId = metadata.payment_method_id; // Unused for now
    const quantity = parseInt(metadata.quantity || '1');
    const totalAmount = parseFloat(metadata.total_amount || '0');

    // Update purchase record to completed
    const { error: purchaseUpdateError } = await supabase
      .from('purchases')
      .update({
        status: 'completed',
        transaction_id: session.payment_intent as string,
        updated_at: new Date().toISOString(),
        metadata: {
          ...session.metadata,
          stripe_payment_intent: session.payment_intent,
          stripe_customer: session.customer
        }
      })
      .eq('stripe_session_id', session.id);

    if (purchaseUpdateError) {
      console.error('Error updating purchase record:', purchaseUpdateError);
    }

    // Get package details
    const { data: packageData, error: packageError } = await supabase
      .from('package_definitions')
      .select(`
        id,
        name,
        description,
        sessions_count,
        session_duration_id,
        package_type,
        max_group_size
      `)
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      console.error('Package not found:', packageId);
      return;
    }

    // Create purchase record
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: customerId,
        total_amount: totalAmount,
        currency_code: 'USD', // Assuming USD, you may want to get this from metadata
        payment_method: 'stripe',
        payment_status: 'completed',
        transaction_id: session.payment_intent as string,
        purchased_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (purchaseError || !purchaseData) {
      console.error('Error creating purchase:', purchaseError);
      return;
    }

    // Create user packages for each quantity
    for (let i = 0; i < quantity; i++) {
      // First get the package price for this package definition
      const { data: packagePrice, error: priceError } = await supabase
        .from('package_prices')
        .select('id')
        .eq('package_definition_id', packageId)
        .single();

      if (priceError || !packagePrice) {
        console.error('Error finding package price:', priceError);
        continue;
      }

      const { error: userPackageError } = await supabase
        .from('user_packages')
        .insert({
          user_id: customerId,
          purchase_id: purchaseData.id,
          package_price_id: packagePrice.id,
          quantity: 1,
          sessions_used: 0,
          is_active: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (userPackageError) {
        console.error('Error creating user package:', userPackageError);
      }
    }

    // Send confirmation email (you can implement this)
    console.log(`Successfully processed payment for customer ${customerId}, package ${packageId}`);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  try {
    console.log('Processing payment intent succeeded:', paymentIntent.id);

    // Update any pending purchases with this payment intent
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        status: 'completed',
        transaction_id: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('transaction_id', paymentIntent.id)
      .eq('status', 'pending');

    if (updateError) {
      console.error('Error updating purchase with payment intent:', updateError);
    }

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  try {
    console.log('Processing payment intent failed:', paymentIntent.id);

    // Update purchase record to failed
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        metadata: {
          failure_reason: paymentIntent.last_payment_error?.message,
          failure_code: paymentIntent.last_payment_error?.code
        }
      })
      .eq('transaction_id', paymentIntent.id);

    if (updateError) {
      console.error('Error updating failed purchase:', updateError);
    }

  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Processing invoice payment succeeded:', invoice.id);

    // Handle subscription payments if needed
    if ('subscription' in invoice && invoice.subscription) {
      // Update subscription status
      console.log('Subscription payment processed:', invoice.subscription);
    }

  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('Processing invoice payment failed:', invoice.id);

    // Handle failed subscription payments
    if ('subscription' in invoice && invoice.subscription) {
      console.log('Subscription payment failed:', invoice.subscription);
    }

  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}
