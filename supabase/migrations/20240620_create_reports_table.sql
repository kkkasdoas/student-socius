-- Create ENUM for report types
CREATE TYPE report_type AS ENUM ('chatroom', 'message', 'profile', 'post');

-- Create the reports table
CREATE TABLE IF NOT EXISTS public.reports (
  report_id BIGSERIAL PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  reported_entity_id BIGINT NOT NULL,
  type report_type NOT NULL,
  reason VARCHAR(50) NOT NULL,
  reporter_note TEXT,
  message_id BIGINT REFERENCES public.messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_reported_entity_id ON public.reports(reported_entity_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert reports only with their own user ID
CREATE POLICY "Users can create their own reports" ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Restrict read access to prevent users from viewing other users' reports
-- In a real application, you would have policies for admin/moderator access 