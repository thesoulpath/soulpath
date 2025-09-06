import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Zod schema for schedule creation
const scheduleCreateSchema = z.object({
  day_of_week: z.string().min(1, 'Day of week is required'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(10, 'Capacity cannot exceed 10').optional(),
  is_available: z.boolean().default(true),
  auto_available: z.boolean().default(true).optional(),
  session_duration_id: z.number().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dayOfWeek = searchParams.get('day_of_week');
    const available = searchParams.get('available');

    let query = supabase
      .from('schedule_templates')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (dayOfWeek) {
      query = query.eq('day_of_week', dayOfWeek);
    }

    if (available !== null) {
      query = query.eq('is_available', available === 'true');
    }

    const { data: schedules, error } = await query;

    if (error) {
      console.error('Error fetching schedules:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch schedules',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Database Error',
          description: 'Failed to fetch schedules. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: schedules
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate schedule data
    const validation = scheduleCreateSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', validation.error.issues);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Schedule data validation failed',
        details: validation.error.issues,
        toast: {
          type: 'error',
          title: 'Validation Error',
          description: 'Schedule data validation failed. Please check the form fields.'
        }
      }, { status: 400 });
    }

    const scheduleData = validation.data;

    // Check if schedule already exists
    const { data: existingSchedule } = await supabase
      .from('schedule_templates')
      .select('id')
      .eq('day_of_week', scheduleData.day_of_week)
      .eq('start_time', scheduleData.start_time)
      .single();

    if (existingSchedule) {
      return NextResponse.json({
        success: false,
        error: 'Schedule already exists',
        message: 'A schedule already exists for this day and time',
        toast: {
          type: 'error',
          title: 'Schedule Exists',
          description: 'A schedule already exists for this day and time'
        }
      }, { status: 409 });
    }

    // Insert schedule into database
    const { data, error } = await supabase
      .from('schedule_templates')
      .insert({
        day_of_week: scheduleData.day_of_week,
        start_time: scheduleData.start_time,
        end_time: scheduleData.end_time,
        capacity: scheduleData.capacity,
        is_available: scheduleData.is_available,
        auto_available: scheduleData.auto_available,
        session_duration_id: scheduleData.session_duration_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create schedule',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Schedule Creation Failed',
          description: 'Failed to create schedule. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule created successfully',
      data,
      toast: {
        type: 'success',
        title: 'Success!',
        description: `Schedule for ${data.day_of_week} at ${data.start_time} created successfully`
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
