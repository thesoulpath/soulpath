import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schema for bulk schedule creation
const bulkScheduleSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format (YYYY-MM-DD)'),
  timeSlots: z.array(z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)')).min(1, 'At least one time slot is required'),
  duration: z.number().min(30, 'Duration must be at least 30 minutes').max(180, 'Duration cannot exceed 3 hours'),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(10, 'Capacity cannot exceed 10'),
  available: z.boolean().default(true),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
        toast: {
          type: 'error',
          title: 'Authentication Failed',
          description: 'You must be logged in to perform this action'
        }
      }, { status: 401 });
    }

    const body = await request.json();

    // Validate bulk schedule data
    const validation = bulkScheduleSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', validation.error.issues);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Bulk schedule data validation failed',
        details: validation.error.issues,
        toast: {
          type: 'error',
          title: 'Validation Error',
          description: 'Bulk schedule data validation failed. Please check the form fields.'
        }
      }, { status: 400 });
    }

    const scheduleData = validation.data;

    // Parse dates
    const startDate = new Date(scheduleData.startDate);
    const endDate = new Date(scheduleData.endDate);

    if (startDate > endDate) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date range',
        message: 'Start date must be before or equal to end date',
        toast: {
          type: 'error',
          title: 'Invalid Date Range',
          description: 'Start date must be before or equal to end date'
        }
      }, { status: 400 });
    }

    // Generate all dates in the range
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate all schedule combinations
    const schedulesToCreate: Array<{
      date: string;
      time: string;
      duration: number;
      capacity: number;
      serviceType: string;
    }> = [];
    for (const date of dates) {
      for (const time of scheduleData.timeSlots) {
        (schedulesToCreate as any[]).push({
          date,
          time,
          duration: scheduleData.duration,
          capacity: scheduleData.capacity,
          created_at: new Date().toISOString()
        });
      }
    }

    // Check for existing schedules to avoid duplicates
    const { data: existingSchedules, error: checkError } = await supabase
      .from('schedules')
      .select('date, time')
      .in('date', dates)
      .in('time', scheduleData.timeSlots);

    if (checkError) {
      console.error('Error checking existing schedules:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to check existing schedules',
        details: checkError.message,
        toast: {
          type: 'error',
          title: 'Database Error',
          description: 'Failed to check existing schedules. Please try again.'
        }
      }, { status: 500 });
    }

    // Filter out existing schedules
    const existingScheduleKeys = new Set(
      existingSchedules?.map(s => `${s.date}-${s.time}`) || []
    );

    const newSchedules = schedulesToCreate.filter(schedule => 
      !existingScheduleKeys.has(`${schedule.date}-${schedule.time}`)
    );

    if (newSchedules.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No new schedules',
        message: 'All schedules in the specified range already exist',
        toast: {
          type: 'warning',
          title: 'No New Schedules',
          description: 'All schedules in the specified range already exist'
        }
      }, { status: 400 });
    }

    // Insert new schedules
    const { data: createdSchedules, error: createError } = await supabase
      .from('schedules')
      .insert(newSchedules)
      .select();

    if (createError) {
      console.error('Error creating bulk schedules:', createError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to create bulk schedules',
        details: createError.message,
        toast: {
          type: 'error',
          title: 'Bulk Creation Failed',
          description: 'Failed to create bulk schedules. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Bulk schedules created successfully',
      count: createdSchedules?.length || 0,
      data: createdSchedules,
      toast: {
        type: 'success',
        title: 'Success!',
        description: `Successfully created ${createdSchedules?.length || 0} new schedules`
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
