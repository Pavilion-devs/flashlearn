-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  streak INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  "dailyGoal" INTEGER DEFAULT 10,
  "dailyProgress" INTEGER DEFAULT 0,
  "isAdmin" BOOLEAN DEFAULT FALSE,
  "lastStudied" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Decks Table
CREATE TABLE IF NOT EXISTS decks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  "cardCount" INTEGER DEFAULT 0,
  "isPublic" BOOLEAN DEFAULT FALSE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Flashcards Table
CREATE TABLE IF NOT EXISTS flashcards (
  id SERIAL PRIMARY KEY,
  "deckId" INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  "partOfSpeech" TEXT,
  "exampleSentence" TEXT,
  "audioUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- User Flashcard Progress Table
CREATE TABLE IF NOT EXISTS user_flashcard_progress (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "flashcardId" INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  "eFactor" FLOAT DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  "nextReview" TIMESTAMP,
  "lastReviewed" TIMESTAMP DEFAULT NOW(),
  UNIQUE ("userId", "flashcardId")
);

-- Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "quizType" TEXT NOT NULL,
  score INTEGER NOT NULL,
  "totalQuestions" INTEGER NOT NULL,
  date TIMESTAMP DEFAULT NOW()
);

-- Progress Stats Table
CREATE TABLE IF NOT EXISTS progress_stats (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "cardsReviewed" INTEGER DEFAULT 0,
  "xpEarned" INTEGER DEFAULT 0,
  "timeSpent" INTEGER DEFAULT 0,
  accuracy JSONB DEFAULT '{}'::jsonb,
  date TIMESTAMP DEFAULT NOW()
);

-- Import the functions and triggers
\ir migrations/00001_initial_schema.sql