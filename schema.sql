-- This schema is for a PostgreSQL database hosted on Supabase.
-- It is idempotent, meaning it can be run multiple times without error.
-- It first drops existing objects before recreating them to ensure a clean setup.

-- Drop existing tables with CASCADE to handle foreign key dependencies.
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.chat_history CASCADE;
DROP TABLE IF EXISTS public.cover_letter_drafts CASCADE;
DROP TABLE IF EXISTS public.cv_drafts CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.user_profile CASCADE;

-- TABLE 1: user_profile
-- Stores Maryanne's professional profile data. This table will only ever contain one row.
CREATE TABLE public.user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT DEFAULT 'Maryanne Njenga',
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    profile_data JSONB NOT NULL, -- Stores the entire profile object (skills, experience, education, etc.)
    preferred_tone TEXT DEFAULT 'confident and professional', -- User's preferred writing style
    language_preference TEXT DEFAULT 'British English',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_profile IS 'Stores the persistent professional profile for the single user, Maryanne Njenga.';

-- TABLE 2: jobs
-- Stores the job descriptions pasted by the user.
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_title TEXT, -- Extracted job title
    company_name TEXT, -- Extracted company name
    job_description TEXT NOT NULL,
    job_url TEXT, -- Optional URL to the job posting
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.jobs IS 'Stores job descriptions provided by the user for generation tasks.';

-- TABLE 3: chat_history
-- Stores the conversational flow between AI and user
CREATE TABLE public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL CHECK (message_type IN ('ai_question', 'user_response')),
    message_content TEXT NOT NULL,
    message_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.chat_history IS 'Stores the chat conversation between AI and user for each job application.';

-- TABLE 4: cv_drafts
-- Stores generated CVs, linked to a specific job.
CREATE TABLE public.cv_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    content_text TEXT NOT NULL,
    content_json JSONB, -- Structured CV data for easier manipulation
    version INTEGER DEFAULT 1,
    is_final BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cv_drafts IS 'Stores generated CV content, linked to a specific job description.';

-- TABLE 5: cover_letter_drafts
-- Stores generated cover letters, linked to a specific job.
CREATE TABLE public.cover_letter_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    content_text TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_final BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cover_letter_drafts IS 'Stores generated cover letter content, linked to a specific job description.';

-- TABLE 6: feedback
-- Stores user feedback on generated content
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_draft_id UUID REFERENCES public.cv_drafts(id) ON DELETE CASCADE,
    cover_letter_draft_id UUID REFERENCES public.cover_letter_drafts(id) ON DELETE CASCADE,
    feedback_type TEXT CHECK (feedback_type IN ('positive', 'negative', 'suggestion')),
    feedback_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Ensure at least one draft reference is provided
    CONSTRAINT feedback_has_reference CHECK (
        cv_draft_id IS NOT NULL OR cover_letter_draft_id IS NOT NULL
    )
);

COMMENT ON TABLE public.feedback IS 'Stores user feedback on generated CV and cover letter drafts.';

-- Add indexes for foreign keys and common queries
CREATE INDEX idx_cv_drafts_job_id ON public.cv_drafts (job_id);
CREATE INDEX idx_cover_letter_drafts_job_id ON public.cover_letter_drafts (job_id);
CREATE INDEX idx_chat_history_job_id ON public.chat_history (job_id);
CREATE INDEX idx_chat_history_order ON public.chat_history (job_id, message_order);
CREATE INDEX idx_feedback_cv_draft ON public.feedback (cv_draft_id);
CREATE INDEX idx_feedback_cover_letter_draft ON public.feedback (cover_letter_draft_id);

-- Enable Row Level Security (RLS) and set broad policies for single-user access.
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for user_profile" ON public.user_profile;
CREATE POLICY "Public access for user_profile" ON public.user_profile FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for jobs" ON public.jobs;
CREATE POLICY "Public access for jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for chat_history" ON public.chat_history;
CREATE POLICY "Public access for chat_history" ON public.chat_history FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.cv_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for cv_drafts" ON public.cv_drafts;
CREATE POLICY "Public access for cv_drafts" ON public.cv_drafts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.cover_letter_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for cover_letter_drafts" ON public.cover_letter_drafts;
CREATE POLICY "Public access for cover_letter_drafts" ON public.cover_letter_drafts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for feedback" ON public.feedback;
CREATE POLICY "Public access for feedback" ON public.feedback FOR ALL USING (true) WITH CHECK (true);

-- Insert default user profile for Maryanne Njenga (only if not exists)
INSERT INTO public.user_profile (full_name, profile_data, preferred_tone, language_preference)
SELECT 
    'Maryanne Njenga',
    '{
        "skills": [],
        "experience": [],
        "education": [],
        "achievements": [],
        "summary": ""
    }'::jsonb,
    'confident and professional',
    'British English'
WHERE NOT EXISTS (SELECT 1 FROM public.user_profile LIMIT 1);