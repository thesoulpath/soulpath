import { getStripe } from './config';

export interface CreateCheckoutSessionParams {
  customerId?: string;
  customerEmail?: string;
  lineItems: Array<{
    price_data: {
      currency: string;
      product_data: {
        name: string;
        description?: string;
        images?: string[];
      };
      unit_amount: number; // Amount in cents
    };
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  mode?: 'payment' | 'subscription';
  paymentMethodTypes?: ('card' | 'sepa_debit' | 'sofort' | 'ideal' | 'bancontact' | 'eps' | 'giropay' | 'p24')[];
}

export interface CreatePaymentIntentParams {
  amount: number; // Amount in cents
  currency: string;
  customerId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  paymentMethodTypes?: ('card' | 'sepa_debit' | 'sofort' | 'ideal' | 'bancontact' | 'eps' | 'giropay' | 'p24')[];
  description?: string;
}

export interface PaymentMethodData {
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      country?: string;
      state?: string;
      city?: string;
      line1?: string;
      line2?: string;
      postal_code?: string;
    };
  };
}

export class StripePaymentService {
  /**
   * Create a Stripe checkout session
   */
  static async createCheckoutSession(params: CreateCheckoutSessionParams) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const session = await stripe.checkout.sessions.create({
        customer: params.customerId,
        customer_email: params.customerEmail,
        line_items: params.lineItems,
        mode: params.mode || 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
        payment_method_types: params.paymentMethodTypes || ['card'],
        billing_address_collection: 'required',
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT'],
        },
        allow_promotion_codes: true,
        automatic_tax: {
          enabled: true,
        },
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
        data: session,
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a payment intent for manual payment processing
   */
  static async createPaymentIntent(params: CreatePaymentIntentParams) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency,
        customer: params.customerId,
        receipt_email: params.customerEmail,
        metadata: params.metadata,
        payment_method_types: params.paymentMethodTypes || ['card'],
        description: params.description,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        data: paymentIntent,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve a checkout session
   */
  static async getCheckoutSession(sessionId: string) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return {
        success: true,
        data: session,
      };
    } catch (error) {
      console.error('Error retrieving checkout session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve a payment intent
   */
  static async getPaymentIntent(paymentIntentId: string) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        success: true,
        data: paymentIntent,
      };
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Confirm a payment intent
   */
  static async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      return {
        success: true,
        data: paymentIntent,
      };
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Cancel a payment intent
   */
  static async cancelPaymentIntent(paymentIntentId: string) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

      return {
        success: true,
        data: paymentIntent,
      };
    } catch (error) {
      console.error('Error canceling payment intent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a customer
   */
  static async createCustomer(params: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: params.metadata,
      });

      return {
        success: true,
        customerId: customer.id,
        data: customer,
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve a customer
   */
  static async getCustomer(customerId: string) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const customer = await stripe.customers.retrieve(customerId);

      return {
        success: true,
        data: customer,
      };
    } catch (error) {
      console.error('Error retrieving customer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update a customer
   */
  static async updateCustomer(customerId: string, params: {
    email?: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const customer = await stripe.customers.update(customerId, params);

      return {
        success: true,
        data: customer,
      };
    } catch (error) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a customer
   */
  static async deleteCustomer(customerId: string) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const customer = await stripe.customers.del(customerId);

      return {
        success: true,
        data: customer,
      };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a payment method
   */
  static async createPaymentMethod(params: {
    type: 'card' | 'sepa_debit' | 'sofort' | 'ideal' | 'bancontact' | 'eps' | 'giropay' | 'p24';
    card?: {
      token: string;
    };
    billing_details?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: {
        country?: string;
        state?: string;
        city?: string;
        line1?: string;
        line2?: string;
        postal_code?: string;
      };
    };
  }) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const paymentMethod = await stripe.paymentMethods.create(params);

      return {
        success: true,
        paymentMethodId: paymentMethod.id,
        data: paymentMethod,
      };
    } catch (error) {
      console.error('Error creating payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Attach a payment method to a customer
   */
  static async attachPaymentMethod(paymentMethodId: string, customerId: string) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      return {
        success: true,
        data: paymentMethod,
      };
    } catch (error) {
      console.error('Error attaching payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Detach a payment method from a customer
   */
  static async detachPaymentMethod(paymentMethodId: string) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

      return {
        success: true,
        data: paymentMethod,
      };
    } catch (error) {
      console.error('Error detaching payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List payment methods for a customer
   */
  static async listPaymentMethods(customerId: string, params?: {
    type?: 'card' | 'sepa_debit' | 'sofort' | 'ideal' | 'bancontact' | 'eps' | 'giropay' | 'p24';
    limit?: number;
    starting_after?: string;
    ending_before?: string;
  }) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: params?.type || 'card',
        limit: params?.limit || 10,
        starting_after: params?.starting_after,
        ending_before: params?.ending_before,
      });

      return {
        success: true,
        data: paymentMethods,
      };
    } catch (error) {
      console.error('Error listing payment methods:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
