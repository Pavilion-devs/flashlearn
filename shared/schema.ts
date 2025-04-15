import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  streak: integer("streak").default(0),
  xp: integer("xp").default(0),
  dailyGoal: integer("daily_goal").default(20),
  dailyProgress: integer("daily_progress").default(0),
  isAdmin: boolean("is_admin").default(false),
  lastStudied: timestamp("last_studied"),
  createdAt: timestamp("created_at").defaultNow()
});

// Decks Table
export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  cardCount: integer("card_count").default(0),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Flashcards Table
export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  partOfSpeech: text("part_of_speech"),
  exampleSentence: text("example_sentence"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow()
});

// User Flashcard Progress Table
export const userFlashcardProgress = pgTable("user_flashcard_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  flashcardId: integer("flashcard_id").notNull(),
  eFactor: integer("e_factor").default(250), // SM-2 algorithm - multiplied by 100 to store as integer
  interval: integer("interval").default(0), // days
  repetitions: integer("repetitions").default(0),
  nextReview: timestamp("next_review"),
  lastReviewed: timestamp("last_reviewed")
});

// Quiz Attempts Table
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  deckId: integer("deck_id").notNull(),
  quizType: text("quiz_type").notNull(), // 'multiple-choice', 'typing', 'listening'
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  date: timestamp("date").defaultNow()
});

// Progress Stats Table
export const progressStats = pgTable("progress_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").defaultNow(),
  cardsReviewed: integer("cards_reviewed").default(0),
  xpEarned: integer("xp_earned").default(0),
  timeSpent: integer("time_spent").default(0), // in seconds
  accuracy: json("accuracy").default({})
});

// Define Insert and Select Types
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
});

export const insertDeckSchema = createInsertSchema(decks).pick({
  userId: true,
  name: true,
  description: true,
  color: true,
  isPublic: true,
});

export const insertFlashcardSchema = createInsertSchema(flashcards).pick({
  deckId: true,
  front: true,
  back: true,
  partOfSpeech: true,
  exampleSentence: true,
  audioUrl: true,
});

export const insertUserFlashcardProgressSchema = createInsertSchema(userFlashcardProgress).pick({
  userId: true,
  flashcardId: true,
  eFactor: true,
  interval: true,
  repetitions: true,
  nextReview: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).pick({
  userId: true,
  deckId: true,
  quizType: true,
  score: true,
  totalQuestions: true,
});

export const insertProgressStatSchema = createInsertSchema(progressStats).pick({
  userId: true,
  cardsReviewed: true,
  xpEarned: true,
  timeSpent: true,
  accuracy: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type Deck = typeof decks.$inferSelect;

export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;

export type InsertUserFlashcardProgress = z.infer<typeof insertUserFlashcardProgressSchema>;
export type UserFlashcardProgress = typeof userFlashcardProgress.$inferSelect;

export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

export type InsertProgressStat = z.infer<typeof insertProgressStatSchema>;
export type ProgressStat = typeof progressStats.$inferSelect;
