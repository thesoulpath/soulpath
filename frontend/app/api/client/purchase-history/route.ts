import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';



interface PurchaseWithDetails {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  transaction_id?: string;
  package_definitions?: Array<{
    id: string;
    name: string;
    description?: string;
    sessions_count?: number;
  }>;
  payment_methods?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  currencies?: Array<{
    symbol: string;
    code: string;
    name?: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const user = await requireAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get customer ID from user
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email')
      .eq('email', user.email)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get purchase history with related data
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select(`
        id,
        created_at,
        amount,
        status,
        transaction_id,
        payment_methods (
          id,
          name,
          description
        ),
        package_definitions (
          id,
          name,
          description,
          sessions_count
        ),
        currencies (
          symbol,
          code,
          name
        )
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .returns<PurchaseWithDetails[]>();

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch purchase history' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedPurchases = (purchases as PurchaseWithDetails[])?.map((purchase: PurchaseWithDetails) => ({
      id: purchase.id,
      date: purchase.created_at,
      packageName: purchase.package_definitions?.[0]?.name || 'Unknown Package',
      amount: purchase.amount,
      status: purchase.status,
      paymentMethod: purchase.payment_methods?.[0]?.name || 'Unknown'
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedPurchases
    });

  } catch (error) {
    console.error('Error in purchase-history API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
