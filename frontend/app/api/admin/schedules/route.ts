import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schema for schedule creation
const scheduleCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  duration: z.number().min(30, 'Duration must be at least 30 minutes').max(180, 'Duration cannot exceed 3 hours'),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(10, 'Capacity cannot exceed 10'),
  available: z.boolean().default(true),
  notes: z.string().optional()
});

// Zod schema for schedule update
const scheduleUpdateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  duration: z.number().min(30, 'Duration must be at least 30 minutes').max(180, 'Duration cannot exceed 3 hours').optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(10, 'Capacity cannot exceed 10').optional(),
  available: z.boolean().optional(),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const date = searchParams.get('date');
    const available = searchParams.get('available');

    let query = supabase
      .from('schedules')
      .select('*', { count: 'exact' });

    if (date) {
      query = query.eq('date', date);
    }

    if (available !== null) {
      query = query.eq('available', available === 'true');
    }

    const { data: schedules, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

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
      data: schedules,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
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
      .from('schedules')
      .select('id')
      .eq('date', scheduleData.date)
      .eq('time', scheduleData.time)
      .single();

    if (existingSchedule) {
      return NextResponse.json({
        success: false,
        error: 'Schedule already exists',
        message: 'A schedule already exists for this date and time',
        toast: {
          type: 'error',
          title: 'Schedule Exists',
          description: 'A schedule already exists for this date and time'
        }
      }, { status: 409 });
    }

    // Insert schedule into database
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        date: scheduleData.date,
        time: scheduleData.time,
        duration: scheduleData.duration,
        capacity: scheduleData.capacity,
        available: scheduleData.available,
        notes: scheduleData.notes,
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
        description: `Schedule for ${data.date} at ${data.time} created successfully`
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

export async function PUT(request: NextRequest) {
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'Schedule ID is required for update',
        toast: {
          type: 'error',
          title: 'Missing Information',
          description: 'Schedule ID is required for update'
        }
      }, { status: 400 });
    }

    // Validate update data
    const validation = scheduleUpdateSchema.safeParse(updateData);
    if (!validation.success) {
      console.error('Validation error:', validation.error.issues);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Update data validation failed',
        details: validation.error.issues,
        toast: {
          type: 'error',
          title: 'Validation Error',
          description: 'Update data validation failed. Please check the form fields.'
        }
      }, { status: 400 });
    }

    const validUpdateData = validation.data;

    // Check if updated date/time conflicts with existing schedule
    if (validUpdateData.date || validUpdateData.time) {
      const { data: existingSchedule } = await supabase
        .from('schedules')
        .select('id')
        .eq('date', validUpdateData.date || body.date)
        .eq('time', validUpdateData.time || body.time)
        .neq('id', id)
        .single();

      if (existingSchedule) {
        return NextResponse.json({
          success: false,
          error: 'Schedule conflict',
          message: 'A schedule already exists for this date and time',
          toast: {
            type: 'error',
            title: 'Schedule Conflict',
            description: 'A schedule already exists for this date and time'
          }
        }, { status: 409 });
      }
    }

    // Update schedule in database
    const { data, error } = await supabase
      .from('schedules')
      .update({
        ...validUpdateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating schedule:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to update schedule',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Update Failed',
          description: 'Failed to update schedule. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule updated successfully',
      data,
      toast: {
        type: 'success',
        title: 'Success!',
        description: `Schedule for ${data.date} at ${data.time} updated successfully`
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

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing ID',
        message: 'Schedule ID is required for deletion',
        toast: {
          type: 'error',
          title: 'Missing Information',
          description: 'Schedule ID is required for deletion'
        }
      }, { status: 400 });
    }

    // Check if schedule has any bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('schedule_id', id);

    if (bookings && bookings.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Schedule has bookings',
        message: 'Cannot delete schedule with existing bookings',
        toast: {
          type: 'error',
          title: 'Cannot Delete',
          description: 'Cannot delete schedule with existing bookings'
        }
      }, { status: 400 });
    }

    // Delete schedule from database
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting schedule:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to delete schedule',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Deletion Failed',
          description: 'Failed to delete schedule. Please try again.'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully',
      toast: {
        type: 'success',
        title: 'Success!',
        description: 'Schedule deleted successfully'
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
