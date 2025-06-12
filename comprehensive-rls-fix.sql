-- Comprehensive RLS Policy Fix for SmartFlashLearn
-- Run this in your Supabase SQL Editor

-- ===============================
-- USERS TABLE POLICIES
-- ===============================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create comprehensive user policies
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() = id
  );

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (
    auth.uid() = id
  );

-- ===============================
-- DECKS TABLE POLICIES
-- ===============================

-- Drop all existing deck policies
DROP POLICY IF EXISTS "Users can insert own decks" ON public.decks;
DROP POLICY IF EXISTS "Users can create their own decks" ON public.decks;
DROP POLICY IF EXISTS "Users can view own decks and public decks" ON public.decks;
DROP POLICY IF EXISTS "Users can view own decks" ON public.decks;
DROP POLICY IF EXISTS "Users can view public decks" ON public.decks;
DROP POLICY IF EXISTS "Users can create own decks" ON public.decks;
DROP POLICY IF EXISTS "Users can update own decks" ON public.decks;
DROP POLICY IF EXISTS "Users can delete own decks" ON public.decks;

-- Create comprehensive deck policies
CREATE POLICY "Users can create their own decks" ON public.decks
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can view own and public decks" ON public.decks
  FOR SELECT USING (
    auth.uid() = user_id OR is_public = true
  );

CREATE POLICY "Users can update own decks" ON public.decks
  FOR UPDATE USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete own decks" ON public.decks
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- ===============================
-- FLASHCARDS TABLE POLICIES
-- ===============================

-- Drop all existing flashcard policies
DROP POLICY IF EXISTS "Users can view flashcards from accessible decks" ON public.flashcards;
DROP POLICY IF EXISTS "Users can view flashcards in accessible decks" ON public.flashcards;
DROP POLICY IF EXISTS "Users can insert flashcards to own decks" ON public.flashcards;
DROP POLICY IF EXISTS "Users can create flashcards in own decks" ON public.flashcards;
DROP POLICY IF EXISTS "Users can update flashcards in own decks" ON public.flashcards;
DROP POLICY IF EXISTS "Users can delete flashcards from own decks" ON public.flashcards;
DROP POLICY IF EXISTS "Users can delete flashcards in own decks" ON public.flashcards;

-- Create comprehensive flashcard policies
CREATE POLICY "Users can view flashcards from accessible decks" ON public.flashcards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.decks 
      WHERE decks.id = flashcards.deck_id 
      AND (decks.user_id = auth.uid() OR decks.is_public = true)
    )
  );

CREATE POLICY "Users can insert flashcards to own decks" ON public.flashcards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.decks 
      WHERE decks.id = flashcards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update flashcards in own decks" ON public.flashcards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.decks 
      WHERE decks.id = flashcards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete flashcards from own decks" ON public.flashcards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.decks 
      WHERE decks.id = flashcards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

-- ===============================
-- OTHER TABLES POLICIES
-- ===============================

-- User Flashcard Progress policies
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_flashcard_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_flashcard_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_flashcard_progress;

CREATE POLICY "Users can view own progress" ON public.user_flashcard_progress
  FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert own progress" ON public.user_flashcard_progress
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update own progress" ON public.user_flashcard_progress
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Quiz Attempts policies
DROP POLICY IF EXISTS "Users can view own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON public.quiz_attempts;

CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Progress Stats policies (correct table name)
DROP POLICY IF EXISTS "Users can view own stats" ON public.progress_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.progress_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.progress_stats;

CREATE POLICY "Users can view own stats" ON public.progress_stats
  FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert own stats" ON public.progress_stats
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update own stats" ON public.progress_stats
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- ===============================
-- ENABLE RLS ON ALL TABLES
-- ===============================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_stats ENABLE ROW LEVEL SECURITY; 