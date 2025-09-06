-- Migration: Fix Bug Reports System User References
-- Date: 2025-01-03
-- Description: Update bug reports to reference users table instead of profiles

-- First, drop existing foreign key constraints
ALTER TABLE bug_reports
DROP CONSTRAINT IF EXISTS bug_reports_reporter_id_fkey,
DROP CONSTRAINT IF EXISTS bug_reports_assigned_to_fkey;

ALTER TABLE bug_comments
DROP CONSTRAINT IF EXISTS bug_comments_author_id_fkey;

-- Update foreign key references to use users table
ALTER TABLE bug_reports
ADD CONSTRAINT bug_reports_reporter_id_fkey
FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE bug_reports
ADD CONSTRAINT bug_reports_assigned_to_fkey
FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE bug_comments
ADD CONSTRAINT bug_comments_author_id_fkey
FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Users can insert own bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Users can update own bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admins can view all bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admins can update all bug reports" ON bug_reports;

DROP POLICY IF EXISTS "Users can view comments on accessible bug reports" ON bug_comments;
DROP POLICY IF EXISTS "Users can insert comments on accessible bug reports" ON bug_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON bug_comments;
DROP POLICY IF EXISTS "Admins can view all comments" ON bug_comments;
DROP POLICY IF EXISTS "Admins can update all comments" ON bug_comments;

-- Create new RLS policies for bug_reports using users table
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
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Admins can update all bug reports
CREATE POLICY "Admins can update all bug reports" ON bug_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Admins can insert bug reports (for system reports)
CREATE POLICY "Admins can insert bug reports" ON bug_reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Create new RLS policies for bug_comments using users table
-- Users can view comments on bug reports they can see
CREATE POLICY "Users can view comments on accessible bug reports" ON bug_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bug_reports
            WHERE bug_reports.id = bug_comments.bug_report_id
            AND (bug_reports.reporter_id = auth.uid()::text OR
                 EXISTS (
                     SELECT 1 FROM users
                     WHERE users.id = auth.uid()::text
                     AND users.role = 'admin'
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
                     SELECT 1 FROM users
                     WHERE users.id = auth.uid()::text
                     AND users.role = 'admin'
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
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Admins can update all comments
CREATE POLICY "Admins can update all comments" ON bug_comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Add annotations column if it doesn't exist (for storing annotation data)
ALTER TABLE bug_reports
ADD COLUMN IF NOT EXISTS annotations JSONB;

-- Add resolved_at and archived_at columns if they don't exist
ALTER TABLE bug_reports
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_priority ON bug_reports(priority);
CREATE INDEX IF NOT EXISTS idx_bug_reports_reporter ON bug_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_assignee ON bug_reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_bug_comments_bug_report ON bug_comments(bug_report_id);
CREATE INDEX IF NOT EXISTS idx_bug_comments_author ON bug_comments(author_id);
