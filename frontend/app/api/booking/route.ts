import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Zod schema for booking creation
const bookingCreateSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  schedule_slot_id: z.number().int('Invalid schedule slot ID'),
  user_package_id: z.number().int('Invalid user package ID'),
  session_type: z.string().min(1, 'Session type is required'),
  notes: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('confirmed')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate booking data
    const validation = bookingCreateSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', validation.error.issues);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Booking data validation failed',
        details: validation.error.issues,
        toast: {
          type: 'error',
          title: 'Validation Error',
          description: 'Booking data validation failed. Please check the form fields.'
        }
      }, { status: 400 });
    }

    const bookingData = validation.data;

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', bookingData.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        message: 'The specified user does not exist',
        toast: {
          type: 'error',
          title: 'User Not Found',
          description: 'The specified user does not exist'
        }
      }, { status: 404 });
    }

    // Check if schedule slot exists and is available
    const { data: scheduleSlot, error: scheduleError } = await supabase
      .from('schedule_slots')
      .select('id, start_time, end_time, capacity, booked_count, is_available')
      .eq('id', bookingData.schedule_slot_id)
      .single();

    if (scheduleError || !scheduleSlot) {
      return NextResponse.json({
        success: false,
        error: 'Schedule slot not found',
        message: 'The specified schedule slot does not exist',
        toast: {
          type: 'error',
          title: 'Schedule Slot Not Found',
          description: 'The specified schedule slot does not exist'
        }
      }, { status: 404 });
    }

    if (!scheduleSlot.is_available) {
      return NextResponse.json({
        success: false,
        error: 'Schedule slot unavailable',
        message: 'The specified schedule slot is not available',
        toast: {
          type: 'error',
          title: 'Schedule Slot Unavailable',
          description: 'The specified schedule slot is not available'
        }
      }, { status: 400 });
    }

    // Check current bookings for this schedule slot
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('schedule_slot_id', bookingData.schedule_slot_id)
      .eq('status', 'confirmed');

    if (bookingsError) {
      console.error('Error checking existing bookings:', bookingsError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to check schedule slot availability',
        details: bookingsError.message,
        toast: {
          type: 'error',
          title: 'Database Error',
          description: 'Failed to check schedule slot availability. Please try again.'
        }
      }, { status: 500 });
    }

    const currentBookings = existingBookings?.length || 0;
    if (currentBookings >= (scheduleSlot.capacity || 3)) {
      return NextResponse.json({
        success: false,
        error: 'Schedule slot full',
        message: 'The specified schedule slot is at full capacity',
        toast: {
          type: 'error',
          title: 'Schedule Slot Full',
          description: 'The specified schedule slot is at full capacity'
        }
      }, { status: 400 });
    }

    // Create booking
    const { data: booking, error: createError } = await supabase
      .from('bookings')
      .insert({
        user_id: bookingData.user_id,
        schedule_slot_id: bookingData.schedule_slot_id,
        user_package_id: bookingData.user_package_id,
        session_type: bookingData.session_type,
        notes: bookingData.notes,
        status: bookingData.status,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating booking:', createError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create booking',
        details: createError.message,
        toast: {
          type: 'error',
          title: 'Booking Creation Failed',
          description: 'Failed to create booking. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
      toast: {
        type: 'success',
        title: 'Success!',
        description: `Booking created for ${user.full_name} on ${scheduleSlot.start_time}`
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      toast: {
        type: 'error',
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.'
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const scheduleSlotId = searchParams.get('schedule_slot_id');

    let query = supabase
      .from('bookings')
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (scheduleSlotId) {
      query = query.eq('schedule_slot_id', scheduleSlotId);
    }

    const { data: bookings, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch bookings',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Database Error',
          description: 'Failed to fetch bookings. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      toast: {
        type: 'error',
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.'
      }
    }, { status: 500 });
  }
}
