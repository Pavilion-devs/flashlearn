// Types for our Supabase database tables
// Based on supabase-schema.sql

export interface User {
  id: string; // UUID
  username: string;
  email: string;
  name?: string;
  streak: number;
  xp: number;
  daily_goal: number;
  daily_progress: number;
  is_admin: boolean;
  last_studied?: string; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Deck {
  id: number;
  user_id: string; // UUID
  name: string;
  description?: string;
  color?: string;
  card_count: number;
  is_public: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Flashcard {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  part_of_speech?: string;
  example_sentence?: string;
  audio_url?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface UserFlashcardProgress {
  id: number;
  user_id: string; // UUID
  flashcard_id: number;
  e_factor: number; // Multiplied by 100 for precision
  interval_days: number;
  repetitions: number;
  next_review: string; // ISO timestamp
  last_reviewed?: string; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface QuizAttempt {
  id: number;
  user_id: string; // UUID
  deck_id: number;
  quiz_type: string; // 'multiple-choice', 'typing', 'listening'
  score: number;
  total_questions: number;
  created_at: string; // ISO timestamp
}

export interface ProgressStat {
  id: number;
  user_id: string; // UUID
  date: string; // ISO date
  cards_reviewed: number;
  xp_earned: number;
  time_spent: number; // in seconds
  accuracy: Record<string, any>; // JSON object
  created_at: string; // ISO timestamp
}

// Insert types (for creating new records)
export interface InsertUser {
  username: string;
  email: string;
  name?: string;
}

export interface InsertDeck {
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  is_public?: boolean;
}

export interface InsertFlashcard {
  deck_id: number;
  front: string;
  back: string;
  part_of_speech?: string;
  example_sentence?: string;
  audio_url?: string;
}

export interface InsertUserFlashcardProgress {
  user_id: string;
  flashcard_id: number;
  e_factor?: number;
  interval_days?: number;
  repetitions?: number;
  next_review?: string;
}

export interface InsertQuizAttempt {
  user_id: string;
  deck_id: number;
  quiz_type: string;
  score: number;
  total_questions: number;
}

export interface InsertProgressStat {
  user_id: string;
  cards_reviewed?: number;
  xp_earned?: number;
  time_spent?: number;
  accuracy?: Record<string, any>;
} 