import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';

// GET - Get specific payment method
export async function GET(
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('clients')
      .select('status')
      .eq('email', user.email)
      .single();

    if (adminError || adminCheck?.status !== 'active') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: paymentMethod, error } = await supabase
      .from('payment_methods')
      .select(`
        *,
        currencies:currency_id(
          id,
          code,
          symbol,
          name
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching payment method:', error);
      return NextResponse.json({ error: 'Failed to fetch payment method' }, { status: 500 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: paymentMethod
    });

  } catch (error) {
    console.error('Error in GET /api/admin/payment-methods/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update payment method
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    const body = await request.json();
    const { name, description, is_active, currency_id } = body;

    if (!name || !currency_id) {
      return NextResponse.json(
        { error: 'Name and currency are required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (currency_id !== undefined) updateData.currency_id = currency_id;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('payment_methods')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        currencies:currency_id(
          id,
          code,
          symbol,
          name
        )
      `)
      .single();

    if (error) {
      console.error('Error updating payment method:', error);
      return NextResponse.json(
        { error: 'Failed to update payment method' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: 'Payment method updated successfully'
    });
  } catch (error) {
    console.error('Error in payment methods PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete payment method
export async function DELETE(
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('clients')
      .select('status')
      .eq('email', user.email)
      .single();

    if (adminError || adminCheck?.status !== 'active') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if payment method is being used
    const { data: usageData, error: usageError } = await supabase
      .from('payment_records')
      .select('id')
      .eq('payment_method', params.id)
      .limit(1);

    if (usageError) {
      console.error('Error checking payment method usage:', usageError);
      return NextResponse.json(
        { error: 'Failed to check payment method usage' },
        { status: 500 }
      );
    }

    if (usageData && usageData.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete payment method that is being used' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting payment method:', error);
      return NextResponse.json(
        { error: 'Failed to delete payment method' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in payment methods DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
