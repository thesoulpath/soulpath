import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Zod schema for schedule data
const scheduleSchema = z.object({
  id: z.number(),
  date: z.string(),
  time: z.string(),
  duration: z.number(),
  capacity: z.number(),
  is_available: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
});

// Zod schema for client data
const clientSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable(),
  status: z.string(),
  birth_date: z.string(),
  birth_time: z.string().nullable(),
  birth_place: z.string(),
  question: z.string(),
  language: z.string(),
  admin_notes: z.string().nullable(),
  scheduled_date: z.string().nullable(),
  scheduled_time: z.string().nullable(),
  session_type: z.string().nullable(),
  last_reminder_sent: z.string().nullable(),
  last_booking: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export async function getSchedules() {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_available', true)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching schedules:', error);
      throw new Error('Failed to fetch schedules');
    }

    // Validate schedule data
    const validatedSchedules = data?.map(schedule => {
      const validation = scheduleSchema.safeParse(schedule);
      if (!validation.success) {
        console.error('Schedule validation error:', validation.error);
        return null;
      }
      return validation.data;
    }).filter(Boolean) || [];

    // Transform data for frontend compatibility
    return validatedSchedules.filter((schedule): schedule is NonNullable<typeof schedule> => schedule !== null).map(schedule => ({
      id: schedule.id,
      date: schedule.date,
      time: schedule.time,
      duration: schedule.duration,
      capacity: schedule.capacity,
      isAvailable: schedule.is_available,
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at
    }));

  } catch (error) {
    console.error('Error in getSchedules:', error);
    throw error;
  }
}

export async function getClients() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      throw new Error('Failed to fetch clients');
    }

    // Validate client data
    const validatedClients = data?.map(client => {
      const validation = clientSchema.safeParse(client);
      if (!validation.success) {
        console.error('Client validation error:', validation.error);
        return null;
      }
      return validation.data;
    }).filter(Boolean) || [];

    // Transform data for frontend compatibility
    return validatedClients.filter((client): client is NonNullable<typeof client> => client !== null).map(client => ({
      id: client.id,
      email: client.email,
      name: client.name,
      phone: client.phone,
      status: client.status,
      birthDate: client.birth_date,
      birthTime: client.birth_time,
      birthPlace: client.birth_place,
      question: client.question,
      language: client.language,
      adminNotes: client.admin_notes,
      scheduledDate: client.scheduled_date,
      scheduledTime: client.scheduled_time,
      sessionType: client.session_type,
      lastReminderSent: client.last_reminder_sent,
      lastBooking: client.last_booking,
      createdAt: client.created_at,
      updatedAt: client.updated_at
    }));

  } catch (error) {
    console.error('Error in getClients:', error);
    throw error;
  }
}

export async function getContent() {
  try {
    const { data, error } = await supabase
      .from('kv_store_f839855f')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      console.error('Error fetching content:', error);
      throw new Error('Failed to fetch content');
    }

    // Transform content data
    const content = data?.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, any>) || {};

    return content;

  } catch (error) {
    console.error('Error in getContent:', error);
    throw error;
  }
}

export async function getLogo() {
  try {
    const { data, error } = await supabase
      .from('logo')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching logo:', error);
      // Return default logo if table doesn't exist
      return {
        id: 1,
        type: 'text',
        text: 'SOULPATH',
        imageUrl: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    return data;

  } catch (error) {
    console.error('Error in getLogo:', error);
    // Return default logo on error
    return {
      id: 1,
      type: 'text',
      text: 'SOULPATH',
      imageUrl: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}
