-- Create SOULPATH database tables
-- This migration creates all necessary tables for the SOULPATH application

-- 1. Create email_config table
CREATE TABLE IF NOT EXISTS email_config (
  id SERIAL PRIMARY KEY,
  smtp_host TEXT DEFAULT 'smtp.gmail.com',
  smtp_port INTEGER DEFAULT 587,
  smtp_user TEXT DEFAULT '',
  smtp_pass TEXT DEFAULT '',
  from_email TEXT DEFAULT 'noreply@soulpath.lat',
  from_name TEXT DEFAULT 'SOULPATH',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  template_key TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create content table
CREATE TABLE IF NOT EXISTS content (
  id SERIAL PRIMARY KEY,
  hero_title_en TEXT DEFAULT 'Welcome to SOULPATH',
  hero_title_es TEXT DEFAULT 'Bienvenido a SOULPATH',
  hero_subtitle_en TEXT DEFAULT 'Your journey to wellness starts here',
  hero_subtitle_es TEXT DEFAULT 'Tu camino al bienestar comienza aquí',
  about_title_en TEXT DEFAULT 'About Us',
  about_title_es TEXT DEFAULT 'Sobre Nosotros',
  about_content_en TEXT DEFAULT 'We are dedicated to helping you achieve your wellness goals.',
  about_content_es TEXT DEFAULT 'Estamos dedicados a ayudarte a alcanzar tus metas de bienestar.',
  approach_title_en TEXT DEFAULT 'Our Approach',
  approach_title_es TEXT DEFAULT 'Nuestro Enfoque',
  approach_content_en TEXT DEFAULT 'We use a holistic approach to wellness.',
  approach_content_es TEXT DEFAULT 'Usamos un enfoque holístico para el bienestar.',
  services_title_en TEXT DEFAULT 'Our Services',
  services_title_es TEXT DEFAULT 'Nuestros Servicios',
  services_content_en TEXT DEFAULT 'Professional wellness services in a peaceful environment.',
  services_content_es TEXT DEFAULT 'Servicios profesionales de bienestar en un ambiente pacífico.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create logo_settings table
CREATE TABLE IF NOT EXISTS logo_settings (
  id SERIAL PRIMARY KEY,
  type TEXT DEFAULT 'text',
  text TEXT DEFAULT 'SOULPATH',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create seo table
CREATE TABLE IF NOT EXISTS seo (
  id SERIAL PRIMARY KEY,
  title TEXT DEFAULT 'SOULPATH - Wellness & Healing',
  description TEXT DEFAULT 'Your journey to wellness starts here. Professional wellness services in a peaceful environment.',
  keywords TEXT DEFAULT 'wellness, healing, therapy, meditation, soulpath',
  og_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'active',
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_place TEXT NOT NULL,
  question TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  admin_notes TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  session_type TEXT,
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  last_booking TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  client_email TEXT NOT NULL,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  session_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (client_email) REFERENCES clients(email)
);

-- 9. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create images table
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create profile_images table
CREATE TABLE IF NOT EXISTS profile_images (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial data
INSERT INTO email_config (smtp_host, smtp_port, smtp_user, smtp_pass, from_email, from_name)
VALUES ('smtp.gmail.com', 587, '', '', 'noreply@soulpath.lat', 'SOULPATH')
ON CONFLICT (id) DO NOTHING;

INSERT INTO email_templates (template_key, subject, body, language) VALUES
('booking_confirmation_en', 'Booking Confirmation - SOULPATH', 'Your session has been confirmed. We look forward to seeing you!', 'en'),
('booking_confirmation_es', 'Confirmación de Reserva - SOULPATH', 'Tu sesión ha sido confirmada. ¡Esperamos verte!', 'es'),
('reminder_en', 'Session Reminder - SOULPATH', 'This is a reminder for your upcoming session. Please arrive 10 minutes early.', 'en'),
('reminder_es', 'Recordatorio de Sesión - SOULPATH', 'Este es un recordatorio para tu próxima sesión. Por favor llega 10 minutos antes.', 'es')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO content (hero_title_en, hero_title_es, hero_subtitle_en, hero_subtitle_es, about_title_en, about_title_es, about_content_en, about_content_es)
VALUES ('Welcome to SOULPATH', 'Bienvenido a SOULPATH', 'Your journey to wellness starts here', 'Tu camino al bienestar comienza aquí', 'About Us', 'Sobre Nosotros', 'We are dedicated to helping you achieve your wellness goals.', 'Estamos dedicados a ayudarte a alcanzar tus metas de bienestar.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO logo_settings (type, text, image_url)
VALUES ('text', 'SOULPATH', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO seo (title, description, keywords)
VALUES ('SOULPATH - Wellness & Healing', 'Your journey to wellness starts here. Professional wellness services in a peaceful environment.', 'wellness, healing, therapy, meditation, soulpath')
ON CONFLICT (id) DO NOTHING;

INSERT INTO schedules (day_of_week, start_time, end_time, is_available)
VALUES ('Monday', '09:00', '17:00', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO clients (email, name, phone, status, birth_date, birth_place, question, language, created_at)
VALUES ('test@example.com', 'Test Client', '+1234567890', 'active', '1990-01-01', 'Test City, Test Country', 'Test question for development purposes', 'en', NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (id, email, full_name, role)
VALUES ('admin-profile', 'admin@soulpath.lat', 'Admin User', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profile_images (key, url, alt_text)
VALUES ('hero_profile', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', 'Jose Profile - SOULPATH Wellness')
ON CONFLICT (key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_bookings_client_email ON bookings(client_email);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(session_date);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);

-- Enable Row Level Security (RLS)
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE logo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_images ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can manage email_config" ON email_config FOR ALL USING (true);
CREATE POLICY "Admin can manage email_templates" ON email_templates FOR ALL USING (true);
CREATE POLICY "Admin can manage content" ON content FOR ALL USING (true);
CREATE POLICY "Admin can manage logo_settings" ON logo_settings FOR ALL USING (true);
CREATE POLICY "Admin can manage seo" ON seo FOR ALL USING (true);
CREATE POLICY "Admin can manage schedules" ON schedules FOR ALL USING (true);
CREATE POLICY "Admin can manage clients" ON clients FOR ALL USING (true);
CREATE POLICY "Admin can manage bookings" ON bookings FOR ALL USING (true);
CREATE POLICY "Admin can manage profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Admin can manage images" ON images FOR ALL USING (true);
CREATE POLICY "Admin can manage profile_images" ON profile_images FOR ALL USING (true);

-- Create policies for public read access (where appropriate)
CREATE POLICY "Public can read content" ON content FOR SELECT USING (true);
CREATE POLICY "Public can read logo_settings" ON logo_settings FOR SELECT USING (true);
CREATE POLICY "Public can read seo" ON seo FOR SELECT USING (true);
CREATE POLICY "Public can read schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "Public can read images" ON images FOR SELECT USING (true);
CREATE POLICY "Public can read profile_images" ON profile_images FOR SELECT USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'SOULPATH Database tables created successfully!' as message;
