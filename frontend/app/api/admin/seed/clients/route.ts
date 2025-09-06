import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Zod schema for sample customer data
const sampleCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  status: z.enum(['active', 'confirmed', 'pending', 'inactive']),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  birth_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  birth_place: z.string().min(1, 'Birth place is required'),
  question: z.string().min(10, 'Question must be at least 10 characters'),
  language: z.enum(['en', 'es']),
  admin_notes: z.string().optional()
});

const seedClientsSchema = z.object({
  customers: z.array(sampleCustomerSchema)
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

    // Sample customer data with complete astrology consultation information
    const sampleCustomers = [
      {
        name: 'Maria Garcia',
        email: 'maria.garcia@example.com',
        phone: '+1 (555) 123-4567',
        status: 'active' as const,
        birth_date: '1985-03-15',
        birth_time: '14:30',
        birth_place: 'Madrid, Spain',
        question: 'I want to understand my relationship patterns and find true love. I\'ve been through several relationships but none seem to last. What does my chart reveal about my romantic destiny?',
        language: 'es' as const,
        admin_notes: 'Spanish-speaking client, interested in relationship astrology. Very engaged and asks thoughtful questions. Prefers evening sessions.'
      },
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1 (555) 234-5678',
        status: 'confirmed' as const,
        birth_date: '1990-07-22',
        birth_time: '09:15',
        birth_place: 'New York, USA',
        question: 'I\'m at a crossroads in my career. Should I stay in my current job or take the leap to start my own business? I need guidance on timing and what my chart suggests about my professional path.',
        language: 'en' as const,
        admin_notes: 'Career-focused client, analytical mindset. Interested in business astrology and timing. Good candidate for follow-up sessions.'
      },
      {
        name: 'Ana Rodriguez',
        email: 'ana.rodriguez@example.com',
        phone: '+1 (555) 345-6789',
        status: 'pending' as const,
        birth_date: '1988-11-08',
        birth_time: '16:45',
        birth_place: 'Barcelona, Spain',
        question: 'I feel lost and don\'t know my life purpose. What does my birth chart reveal about my spiritual journey and the work I\'m meant to do in this lifetime?',
        language: 'es' as const,
        admin_notes: 'Spiritual seeker, very open to guidance. First-time astrology client. May need extra support and explanation of concepts.'
      }
    ];
    
    console.log('Sample customers data structure:', sampleCustomers.map(c => ({
      name: c.name,
      email: c.email,
      status: c.status,
      birth_date: c.birth_date,
      birth_time: c.birth_time,
      birth_place: c.birth_place
    })));

    // Check if we should clear existing customers first
    const { searchParams } = new URL(request.url);
    const clearExisting = searchParams.get('clear') === 'true';
    
    if (clearExisting) {
      // Clear existing sample customers
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .in('email', sampleCustomers.map(c => c.email));
      
      if (deleteError) {
        console.error('Error clearing existing customers:', deleteError);
        return NextResponse.json({
          success: false,
          error: 'Database error',
          message: 'Failed to clear existing customers',
          details: deleteError.message
        }, { status: 500 });
      }
    }

    // Validate sample customers data
    const validationResult = seedClientsSchema.safeParse({ customers: sampleCustomers });
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.issues);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: 'Sample customer data validation failed',
        details: validationResult.error.issues,
        toast: {
          type: 'error',
          title: 'Validation Error',
          description: 'Sample customer data validation failed. Please check the data format.'
        }
      }, { status: 400 });
    }

    console.log('Attempting to seed customers with data:', sampleCustomers);
    
    // First, let's check what's currently in the database
    const { data: existingClients, error: checkError } = await supabase
      .from('clients')
      .select('email, name, status')
      .in('email', sampleCustomers.map(c => c.email));
      
    console.log('Existing clients check:', { existingClients, checkError });
    
    // Insert all sample customers, ignoring conflicts
    const { data, error } = await supabase
      .from('clients')
      .upsert(sampleCustomers, { 
        onConflict: 'email',
        ignoreDuplicates: false  // Changed to false to see what happens
      })
      .select();
      
    console.log('Seed result - data:', data, 'error:', error);

    if (error) {
      console.error('Error seeding customers:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to seed customers',
        details: error.message,
        toast: {
          type: 'error',
          title: 'Database Error',
          description: 'Failed to create sample customers. Please try again.'
        }
      }, { status: 500 });
    }

    // Check if any customers were actually created
    const createdCount = data?.length || 0;
    if (createdCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'All sample customers already exist in the database',
        count: 0,
        customers: [],
        toast: {
          type: 'info',
          title: 'Info',
          description: 'Sample customers already exist in the database'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Sample customers created successfully',
      count: data?.length || 0,
      customers: data,
      toast: {
        type: 'success',
        title: 'Success!',
        description: `Successfully created ${data?.length || 0} sample customers`
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
