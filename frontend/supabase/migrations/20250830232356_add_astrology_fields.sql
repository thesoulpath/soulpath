-- Add all missing columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_time TIME,
ADD COLUMN IF NOT EXISTS birth_place TEXT,
ADD COLUMN IF NOT EXISTS question TEXT,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME,
ADD COLUMN IF NOT EXISTS session_type TEXT,
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_booking TIMESTAMP WITH TIME ZONE;

-- Make required fields NOT NULL after adding them
ALTER TABLE clients 
ALTER COLUMN birth_date SET NOT NULL,
ALTER COLUMN birth_place SET NOT NULL,
ALTER COLUMN question SET NOT NULL;

-- Update existing test client with required fields
UPDATE clients 
SET 
    birth_date = '1990-01-01',
    birth_place = 'Test City, Test Country',
    question = 'Test question for development purposes',
    language = 'en'
WHERE email = 'test@example.com';

-- Insert sample customers with complete data
INSERT INTO clients (
    name, 
    email, 
    phone, 
    status, 
    birth_date, 
    birth_time, 
    birth_place, 
    question, 
    language, 
    admin_notes, 
    created_at
) VALUES 
    (
        'Maria Garcia', 
        'maria.garcia@example.com', 
        '+1 (555) 123-4567', 
        'active', 
        '1985-03-15', 
        '14:30', 
        'Madrid, Spain', 
        'I want to understand my relationship patterns and find true love. I''ve been through several relationships but none seem to last. What does my chart reveal about my romantic destiny?', 
        'es', 
        'Spanish-speaking client, interested in relationship astrology. Very engaged and asks thoughtful questions. Prefers evening sessions.',
        NOW()
    ),
    (
        'John Smith', 
        'john.smith@example.com', 
        '+1 (555) 234-5678', 
        'confirmed', 
        '1990-07-22', 
        '09:15', 
        'New York, USA', 
        'I''m at a crossroads in my career. Should I stay in my current job or take the leap to start my own business? I need guidance on timing and what my chart suggests about my professional path.', 
        'en', 
        'Career-focused client, analytical mindset. Interested in business astrology and timing. Good candidate for follow-up sessions.',
        NOW()
    ),
    (
        'Ana Rodriguez', 
        'ana.rodriguez@example.com', 
        '+1 (555) 345-6789', 
        'pending', 
        '1988-11-08', 
        '16:45', 
        'Barcelona, Spain', 
        'I feel lost and don''t know my life purpose. What does my birth chart reveal about my spiritual journey and the work I''m meant to do in this lifetime?', 
        'es', 
        'Spiritual seeker, very open to guidance. First-time astrology client. May need extra support and explanation of concepts.',
        NOW()
    )
ON CONFLICT (email) DO NOTHING;
