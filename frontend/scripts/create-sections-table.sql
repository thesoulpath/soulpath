-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  section_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) DEFAULT 'content',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'Circle',
  component VARCHAR(100) NOT NULL,
  "order" INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  mobile_config JSONB,
  desktop_config JSONB,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Create index on section_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sections_section_id ON sections(section_id);

-- Create index on enabled sections for filtering
CREATE INDEX IF NOT EXISTS idx_sections_enabled ON sections(enabled);

-- Create index on order for sorting
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections("order");

-- Insert default sections
INSERT INTO sections (section_id, type, title, description, icon, component, "order", enabled, mobile_config, desktop_config) VALUES
('invitation', 'hero', 'Invitation', 'Main landing section with cosmic theme', 'Star', 'HeroSection', 0, true, 
 '{"padding": "pt-20 pb-12", "layout": "center", "imageSize": "large"}',
 '{"padding": "pt-16 pb-20", "layout": "center", "imageSize": "large"}'),
('approach', 'content', 'Our Approach', 'How we work and our methodology', 'Compass', 'ApproachSection', 1, true,
 '{"padding": "pt-20 pb-12", "layout": "stack", "imageSize": "medium"}',
 '{"padding": "pt-16 pb-20", "layout": "grid", "imageSize": "medium"}'),
('session', 'content', 'Sessions & Services', 'Available services and session types', 'Clock', 'SessionSection', 2, true,
 '{"padding": "pt-20 pb-12", "layout": "stack", "imageSize": "medium"}',
 '{"padding": "pt-16 pb-20", "layout": "grid", "imageSize": "medium"}'),
('about', 'content', 'About SoulPath', 'Information about José and SoulPath', 'User', 'AboutSection', 3, true,
 '{"padding": "pt-20 pb-12", "layout": "stack", "imageSize": "large"}',
 '{"padding": "pt-16 pb-20", "layout": "grid", "imageSize": "large"}'),
('apply', 'form', 'Book Your Session', 'Booking form and scheduling', 'Calendar', 'BookingSection', 4, true,
 '{"padding": "pt-20 pb-12", "layout": "center", "imageSize": "small"}',
 '{"padding": "pt-16 pb-20", "layout": "center", "imageSize": "small"}')
ON CONFLICT (section_id) DO NOTHING;

-- Show the created sections
SELECT section_id, title, "order", enabled FROM sections ORDER BY "order";
