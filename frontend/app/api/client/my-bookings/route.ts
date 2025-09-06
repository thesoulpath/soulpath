import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

interface BookingData {
  id: string;
  date: string;
  time: string;
  status: string;
  session_type: string;
  price?: number;
  notes?: string;
  rating?: number;
  feedback?: string;
  created_at: string;
  completed_at?: string;
  customer_packages?: {
    id: string;
    package_definitions?: {
      name: string;
      description?: string;
    }[];
  }[];
  schedules?: {
    id: string;
    session_type: string;
    capacity: number;
    booked_count: number;
  }[];
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

    // Get customer bookings with related data
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        date,
        time,
        status,
        session_type,
        price,
        notes,
        rating,
        feedback,
        created_at,
        completed_at,
        customer_packages (
          id,
          package_definitions (
            name,
            description
          )
        ),
        schedules (
          id,
          session_type,
          capacity,
          booked_count
        )
      `)
      .eq('customer_id', customer.id)
      .order('date', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedBookings = bookings?.map((booking: BookingData) => ({
      id: booking.id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      sessionType: booking.session_type,
      packageId: booking.customer_packages?.[0]?.id,
      packageName: booking.customer_packages?.[0]?.package_definitions?.[0]?.name,
      createdAt: booking.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedBookings
    });

  } catch (error) {
    console.error('Error in my-bookings API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      packageId,
      scheduleId,
      clientName,
      clientEmail,
      clientPhone,
      birthDate,
      birthTime,
      birthPlace,
      question,
      specialRequests,
      language
    } = body;

    // Validate required fields
    if (!packageId || !scheduleId || !clientName || !clientEmail || !birthDate || !birthPlace || !question) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
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

    // Verify the package belongs to the customer and has remaining sessions
    const { data: packageData, error: packageError } = await supabase
      .from('customer_packages')
      .select(`
        id,
        sessions_remaining,
        status,
        package_definitions (
          name,
          session_duration_id
        )
      `)
      .eq('id', packageId)
      .eq('customer_id', customer.id)
      .single();

    if (packageError || !packageData) {
      return NextResponse.json(
        { success: false, error: 'Package not found or not owned by customer' },
        { status: 404 }
      );
    }

    if (packageData.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Package is not active' },
        { status: 400 }
      );
    }

    if (packageData.sessions_remaining <= 0) {
      return NextResponse.json(
        { success: false, error: 'No sessions remaining in this package' },
        { status: 400 }
      );
    }

    // Verify the schedule is available
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('id, date, time, capacity, booked_count, is_available')
      .eq('id', scheduleId)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    if (!schedule.is_available || schedule.booked_count >= schedule.capacity) {
      return NextResponse.json(
        { success: false, error: 'Schedule is not available' },
        { status: 400 }
      );
    }

    // Check if customer already has a booking for this schedule
    const { data: existingBooking, error: existingBookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('schedule_id', scheduleId)
      .single();

    if (existingBooking && !existingBookingError) {
      return NextResponse.json(
        { success: false, error: 'You already have a booking for this schedule' },
        { status: 400 }
      );
    }

    // Create the booking
    const { data: newBooking, error: bookingCreateError } = await supabase
      .from('bookings')
      .insert({
        customer_id: customer.id,
        customer_package_id: packageId,
        schedule_id: scheduleId,
        date: schedule.date,
        time: schedule.time,
        status: 'pending',
        session_type: packageData.package_definitions?.[0]?.name || 'Standard Reading',
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        birth_date: birthDate,
        birth_time: birthTime,
        birth_place: birthPlace,
        question: question,
        special_requests: specialRequests,
        language: language
      })
      .select()
      .single();

    if (bookingCreateError) {
      console.error('Error creating booking:', bookingCreateError);
      return NextResponse.json(
        { success: false, error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Update the schedule booked count
    const { error: scheduleUpdateError } = await supabase
      .from('schedules')
      .update({ booked_count: schedule.booked_count + 1 })
      .eq('id', scheduleId);

    if (scheduleUpdateError) {
      console.error('Error updating schedule:', scheduleUpdateError);
      // Don't fail the booking creation, but log the error
    }

    // Decrease the sessions remaining in the package
    const { error: packageUpdateError } = await supabase
      .from('customer_packages')
      .update({ sessions_remaining: packageData.sessions_remaining - 1 })
      .eq('id', packageId);

    if (packageUpdateError) {
      console.error('Error updating package sessions:', packageUpdateError);
      // Don't fail the booking creation, but log the error
    }

    return NextResponse.json({
      success: true,
      data: {
        booking: newBooking,
        message: 'Booking created successfully'
      }
    });

  } catch (error) {
    console.error('Error in create booking API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
