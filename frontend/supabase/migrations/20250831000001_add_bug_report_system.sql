-- Migration: Add Bug Report System
-- Date: 2025-08-31
-- Description: Creates tables for bug reporting system

-- Create enum types
CREATE TYPE bug_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ARCHIVED');
CREATE TYPE priority_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Create bug_reports table
CREATE TABLE bug_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    screenshot TEXT, -- Base64 encoded screenshot
    status bug_status DEFAULT 'OPEN',
    priority priority_level DEFAULT 'MEDIUM',
    category VARCHAR(100),
    reporter_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_to TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ
);

-- Create bug_comments table
CREATE TABLE bug_comments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bug_report_id TEXT NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bug_reports_status ON bug_reports(status);
CREATE INDEX idx_bug_reports_priority ON bug_reports(priority);
CREATE INDEX idx_bug_reports_reporter ON bug_reports(reporter_id);
CREATE INDEX idx_bug_reports_assignee ON bug_reports(assigned_to);
CREATE INDEX idx_bug_reports_created ON bug_reports(created_at);
CREATE INDEX idx_bug_comments_bug_report ON bug_comments(bug_report_id);
CREATE INDEX idx_bug_comments_author ON bug_comments(author_id);

-- Add RLS policies
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for bug_reports
-- Users can view their own bug reports
CREATE POLICY "Users can view own bug reports" ON bug_reports
    FOR SELECT USING (auth.uid()::text = reporter_id);

-- Users can insert their own bug reports
CREATE POLICY "Users can insert own bug reports" ON bug_reports
    FOR INSERT WITH CHECK (auth.uid()::text = reporter_id);

-- Users can update their own bug reports
CREATE POLICY "Users can update own bug reports" ON bug_reports
    FOR UPDATE USING (auth.uid()::text = reporter_id);

-- Admins can view all bug reports
CREATE POLICY "Admins can view all bug reports" ON bug_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()::text 
            AND profiles.role = 'admin'
        )
    );

-- Admins can update all bug reports
CREATE POLICY "Admins can update all bug reports" ON bug_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()::text 
            AND profiles.role = 'admin'
        )
    );

-- RLS policies for bug_comments
-- Users can view comments on bug reports they can see
CREATE POLICY "Users can view comments on accessible bug reports" ON bug_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bug_reports 
            WHERE bug_reports.id = bug_comments.bug_report_id 
            AND (bug_reports.reporter_id = auth.uid()::text OR 
                 EXISTS (
                     SELECT 1 FROM profiles 
                     WHERE profiles.id = auth.uid()::text 
                     AND profiles.role = 'admin'
                 ))
        )
    );

-- Users can insert comments on bug reports they can see
CREATE POLICY "Users can insert comments on accessible bug reports" ON bug_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bug_reports 
            WHERE bug_reports.id = bug_comments.bug_report_id 
            AND (bug_reports.reporter_id = auth.uid()::text OR 
                 EXISTS (
                     SELECT 1 FROM profiles 
                     WHERE profiles.id = auth.uid()::text 
                     AND profiles.role = 'admin'
                 ))
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON bug_comments
    FOR UPDATE USING (auth.uid()::text = author_id);

-- Admins can view all comments
CREATE POLICY "Admins can view all comments" ON bug_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()::text 
            AND profiles.role = 'admin'
        )
    );

-- Admins can update all comments
CREATE POLICY "Admins can update all comments" ON bug_comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()::text 
            AND profiles.role = 'admin'
        )
    );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_bug_reports_updated_at 
    BEFORE UPDATE ON bug_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bug_comments_updated_at 
    BEFORE UPDATE ON bug_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample bug report categories
INSERT INTO bug_reports (title, description, category, priority, status) VALUES
('Sample Bug Report', 'This is a sample bug report for testing purposes', 'UI/UX', 'MEDIUM', 'OPEN')
ON CONFLICT DO NOTHING;
