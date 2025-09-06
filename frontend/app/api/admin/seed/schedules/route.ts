import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schema for sample schedule data
const sampleScheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  duration: z.number().min(30, 'Duration must be at least 30 minutes').max(180, 'Duration cannot exceed 3 hours'),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(10, 'Capacity cannot exceed 10'),
  available: z.boolean().default(true),
  notes: z.string().optional()
});

const seedSchedulesSchema = z.object({
  schedules: z.array(sampleScheduleSchema)
});

export async function POST() {
  try {
    // Sample schedule data for the next 30 days
    const sampleSchedules = [];
    const today = new Date();
    
    // Generate schedules for the next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Morning sessions
      sampleSchedules.push({
        date: dateString,
        time: '09:00',
        duration: 90,
        capacity: 3,
        available: true,
        notes: 'Morning birth chart reading session',
        created_at: new Date().toISOString()
      });
      
      sampleSchedules.push({
        date: dateString,
        time: '11:00',
        duration: 60,
        capacity: 2,
        available: true,
        notes: 'Morning relationship compatibility session',
        created_at: new Date().toISOString()
      });
      
      // Afternoon sessions
      sampleSchedules.push({
        date: dateString,
        time: '14:00',
        duration: 90,
        capacity: 3,
        available: true,
        notes: 'Afternoon birth chart reading session',
        created_at: new Date().toISOString()
      });
      
      sampleSchedules.push({
        date: dateString,
        time: '16:00',
        duration: 60,
        capacity: 2,
        available: true,
        notes: 'Afternoon career guidance session',
        created_at: new Date().toISOString()
      });
      
      // Evening sessions
      sampleSchedules.push({
        date: dateString,
        time: '18:00',
        duration: 90,
        capacity: 2,
        available: true,
        notes: 'Evening birth chart reading session',
        created_at: new Date().toISOString()
      });
    }

    // Validate sample schedules data
    const validation = seedSchedulesSchema.safeParse({ schedules: sampleSchedules });
    if (!validation.success) {
      console.error('Validation error:', validation.error.issues);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Sample schedule data validation failed',
        details: validation.error.issues,
        toast: {
          type: 'error',
          title: 'Validation Error',
          description: 'Sample schedule data validation failed. Please check the data format.'
        }
      }, { status: 400 });
    }

    // Check for existing schedules to avoid duplicates
    const { data: existingSchedules, error: checkError } = await supabase
      .from('schedules')
      .select('date, time')
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

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

    const newSchedules = sampleSchedules.filter(schedule => 
      !existingScheduleKeys.has(`${schedule.date}-${schedule.time}`)
    );

    if (newSchedules.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No new schedules',
        message: 'All sample schedules already exist',
        toast: {
          type: 'warning',
          title: 'No New Schedules',
          description: 'All sample schedules already exist'
        }
      }, { status: 400 });
    }

    // Insert new schedules
    const { data, error } = await supabase
      .from('schedules')
      .insert(newSchedules)
      .select();

    if (error) {
      console.error('Error seeding schedules:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to seed schedules',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Database Error',
          description: 'Failed to create sample schedules. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Sample schedules created successfully',
      count: data?.length || 0,
      schedules: data,
      toast: {
        type: 'success',
        title: 'Success!',
        description: `Successfully created ${data?.length || 0} sample schedules`
      }
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
