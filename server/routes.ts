import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { supabase } from "./supabase";
import multer from "multer";
import { parse } from "csv-parse";
import { InsertFlashcard, InsertDeck, User } from "@shared/types";
import { z } from "zod";

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User | null;
    }
  }
}

// Basic validation schemas
const insertDeckSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  is_public: z.boolean().optional(),
});

const insertFlashcardSchema = z.object({
  deck_id: z.number(),
  front: z.string().min(1),
  back: z.string().min(1),
  part_of_speech: z.string().optional(),
  example_sentence: z.string().optional(),
  audio_url: z.string().optional(),
});

// Middleware to authenticate with Supabase
async function authenticateSupabase(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      req.user = null;
      return next();
    }

    // Get user data from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error fetching user data:", userError);
    }

    // Set user data
    req.user = {
      id: user.id,
      username: userData?.username || user.user_metadata?.username || user.email?.split('@')[0],
      email: user.email,
      name: userData?.name || user.user_metadata?.display_name || user.user_metadata?.username,
      streak: userData?.streak || 0,
      xp: userData?.xp || 0,
      daily_goal: userData?.daily_goal || 20,
      daily_progress: userData?.daily_progress || 0,
      is_admin: userData?.is_admin || false,
      last_studied: userData?.last_studied || null,
      created_at: userData?.created_at || user.created_at,
      updated_at: userData?.updated_at || user.created_at,
    };
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    req.user = null;
    next();
  }
}

// Helper function to check if user is authenticated
function isAuthenticated(req: any) {
  return req.user !== null && req.user !== undefined;
}

// Set up multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const parseCSV = (csvData: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }, (err, records) => {
      if (err) return reject(err);
      resolve(records);
    });
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Add Supabase auth middleware to all routes
  app.use(authenticateSupabase);
  
  // Setup authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Deck routes
  app.get("/api/decks", async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const decks = await storage.getDecksByUserId(req.user!.id);
    res.json(decks);
  });
  
  app.get("/api/decks/public", async (req, res) => {
    const decks = await storage.getPublicDecks();
    res.json(decks);
  });
  
  app.get("/api/decks/:id", async (req, res) => {
    const deckId = parseInt(req.params.id);
    if (isNaN(deckId)) {
      return res.status(400).json({ message: "Invalid deck ID" });
    }
    
    const deck = await storage.getDeck(deckId);
    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }
    
    // Non-authenticated users can only view public decks
    if (!isAuthenticated(req) && !deck.is_public) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    // Authenticated users can only view their own decks or public decks
    if (isAuthenticated(req) && deck.user_id !== req.user!.id && !deck.is_public) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    res.json(deck);
  });
  
  app.post("/api/decks", async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const deckData = insertDeckSchema.parse({
        ...req.body,
        user_id: req.user!.id
      });
      
      console.log("Creating deck with data:", deckData);
      const deck = await storage.createDeck(deckData);
      res.status(201).json(deck);
    } catch (error) {
      console.error("Deck creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deck data", errors: error.errors });
      }
      res.status(500).json({ 
        message: "Failed to create deck", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  app.put("/api/decks/:id", async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const deckId = parseInt(req.params.id);
    if (isNaN(deckId)) {
      return res.status(400).json({ message: "Invalid deck ID" });
    }
    
    const deck = await storage.getDeck(deckId);
    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }
    
    // Only the owner can update the deck
    if (deck.user_id !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      const updatedDeck = await storage.updateDeck(deckId, req.body);
      res.json(updatedDeck);
    } catch (error) {
      res.status(500).json({ message: "Failed to update deck" });
    }
  });
  
  app.delete("/api/decks/:id", async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const deckId = parseInt(req.params.id);
    if (isNaN(deckId)) {
      return res.status(400).json({ message: "Invalid deck ID" });
    }
    
    const deck = await storage.getDeck(deckId);
    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }
    
    // Only the owner can delete the deck
    if (deck.user_id !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const deleted = await storage.deleteDeck(deckId);
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(500).json({ message: "Failed to delete deck" });
    }
  });
  
  // Flashcard routes
  app.get("/api/decks/:deckId/flashcards", async (req, res) => {
    const deckId = parseInt(req.params.deckId);
    if (isNaN(deckId)) {
      return res.status(400).json({ message: "Invalid deck ID" });
    }
    
    const deck = await storage.getDeck(deckId);
    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }
    
    // Non-authenticated users can only view flashcards from public decks
    if (!isAuthenticated(req) && !deck.is_public) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    // Authenticated users can only view flashcards from their own decks or public decks
    if (isAuthenticated(req) && deck.user_id !== req.user!.id && !deck.is_public) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const flashcards = await storage.getFlashcardsByDeckId(deckId);
    res.json(flashcards);
  });
  
  app.post("/api/decks/:deckId/flashcards", async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const deckId = parseInt(req.params.deckId);
    if (isNaN(deckId)) {
      return res.status(400).json({ message: "Invalid deck ID" });
    }
    
    const deck = await storage.getDeck(deckId);
    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }
    
    // Only the deck owner can add flashcards
    if (deck.user_id !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      const flashcardData = insertFlashcardSchema.parse({
        ...req.body,
        deck_id: deckId
      });
      
      const flashcard = await storage.createFlashcard(flashcardData);
      res.status(201).json(flashcard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid flashcard data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create flashcard" });
    }
  });
  
  app.put("/api/flashcards/:id", async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const flashcardId = parseInt(req.params.id);
    if (isNaN(flashcardId)) {
      return res.status(400).json({ message: "Invalid flashcard ID" });
    }
    
    const flashcard = await storage.getFlashcard(flashcardId);
    if (!flashcard) {
      return res.status(404).json({ message: "Flashcard not found" });
    }
    
    // Only the deck owner can update flashcards
    const deck = await storage.getDeck(flashcard.deck_id);
    if (deck && deck.user_id !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      const updatedFlashcard = await storage.updateFlashcard(flashcardId, req.body);
      res.json(updatedFlashcard);
    } catch (error) {
      res.status(500).json({ message: "Failed to update flashcard" });
    }
  });
  
  app.delete("/api/flashcards/:id", async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const flashcardId = parseInt(req.params.id);
    if (isNaN(flashcardId)) {
      return res.status(400).json({ message: "Invalid flashcard ID" });
    }
    
    const flashcard = await storage.getFlashcard(flashcardId);
    if (!flashcard) {
      return res.status(404).json({ message: "Flashcard not found" });
    }
    
    // Only the deck owner can delete flashcards
    const deck = await storage.getDeck(flashcard.deck_id);
    if (deck && deck.user_id !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const deleted = await storage.deleteFlashcard(flashcardId);
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(500).json({ message: "Failed to delete flashcard" });
    }
  });
  
  // CSV Upload route
  app.post("/api/decks/:deckId/upload-csv", upload.single("csvFile"), async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const deckId = parseInt(req.params.deckId);
    if (isNaN(deckId)) {
      return res.status(400).json({ message: "Invalid deck ID" });
    }
    
    const deck = await storage.getDeck(deckId);
    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }
    
    // Only the deck owner can upload flashcards
    if (deck.user_id !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: "No CSV file uploaded" });
    }
    
    try {
      const csvContent = req.file.buffer.toString("utf-8");
      const records = await parseCSV(csvContent);
      
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      for (const record of records) {
        try {
          // Validate required fields
          if (!record.front || !record.back) {
            results.failed++;
            results.errors.push(`Missing required fields: ${JSON.stringify(record)}`);
            continue;
          }
          
          await storage.createFlashcard({
            deck_id: deckId,
            front: record.front,
            back: record.back,
            part_of_speech: record.part_of_speech || null,
            example_sentence: record.example_sentence || null,
            audio_url: record.audio_url || null
          });
          
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Error processing record: ${JSON.stringify(record)}`);
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error("CSV processing error:", error);
      res.status(500).json({ message: "Failed to process CSV file" });
    }
  });
  
  // Study routes
  app.get("/api/study/due", async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const dueCards = await storage.getDueFlashcards(req.user!.id);
      res.json(dueCards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch due flashcards" });
    }
  });
  
  app.post("/api/study/progress", async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { flashcardId, quality } = req.body;
    
    if (typeof flashcardId !== "number" || typeof quality !== "number" || quality < 0 || quality > 5) {
      return res.status(400).json({ message: "Invalid request data" });
    }
    
    try {
      let progress = await storage.getUserFlashcardProgress(req.user!.id, flashcardId);
      
      // If no progress exists for this flashcard yet, create it
      if (!progress) {
        progress = await storage.createUserFlashcardProgress({
          user_id: req.user!.id,
          flashcard_id: flashcardId,
          e_factor: 250, // 2.5 * 100
          interval: 0,
          repetitions: 0,
          next_review: new Date()
        });
      }
      
      // Apply spaced repetition algorithm (SM-2)
      const oldEFactor = progress.e_factor / 100; // Convert to decimal
      const newRepetitions = quality < 3 ? 0 : progress.repetitions + 1;
      
      // Calculate new eFactor (minimum 1.3)
      const newEFactor = Math.max(1.3, oldEFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
      
      // Calculate new interval
      let newInterval;
      if (quality < 3) {
        newInterval = 1; // Reset to 1 day if response wasn't good
      } else if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.round(progress.interval * newEFactor);
      }
      
      // Calculate next review date
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + newInterval);
      
      // Update progress
      const updatedProgress = await storage.updateUserFlashcardProgress(progress.id, {
        e_factor: Math.round(newEFactor * 100),
        interval: newInterval,
        repetitions: newRepetitions,
        next_review: nextReview,
        last_reviewed: new Date()
      });
      
      // Update user's daily progress and last studied date
      const user = await storage.getUser(req.user!.id);
      if (user) {
        await storage.updateUser(user.id, {
          daily_progress: user.daily_progress + 1,
          last_studied: new Date()
        });
        
        // Update today's stats
        await storage.updateTodayStats(user.id, {
          cards_reviewed: 1,
          xp_earned: quality >= 3 ? 10 : 5, // More XP for correct answers
          time_spent: 10 // Assuming 10 seconds per card for now
        });
      }
      
      res.json(updatedProgress);
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress" });
    }
  });
  
  // Quiz routes
  app.post("/api/quizzes/submit", async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { deckId, quizType, score, totalQuestions } = req.body;
    
    if (!deckId || !quizType || typeof score !== "number" || typeof totalQuestions !== "number") {
      return res.status(400).json({ message: "Invalid quiz data" });
    }
    
    try {
      const quizAttempt = await storage.createQuizAttempt({
        user_id: req.user!.id,
        deck_id: deckId,
        quizType,
        score,
        totalQuestions
      });
      
      // Update user XP
      const user = await storage.getUser(req.user!.id);
      if (user) {
        const xpEarned = Math.round((score / totalQuestions) * 50); // Up to 50 XP based on score percentage
        
        await storage.updateUser(user.id, {
          xp: user.xp + xpEarned,
          last_studied: new Date()
        });
        
        // Update accuracy stats
        const accuracy: Record<string, number> = {};
        accuracy[quizType] = Math.round((score / totalQuestions) * 100);
        
        // Update today's stats
        await storage.updateTodayStats(user.id, {
          xp_earned: xpEarned,
          accuracy
        });
      }
      
      res.status(201).json(quizAttempt);
    } catch (error) {
      res.status(500).json({ message: "Failed to save quiz attempt" });
    }
  });
  
  app.get("/api/quizzes/history", async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const attempts = await storage.getQuizAttemptsByUserId(req.user!.id);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz history" });
    }
  });
  
  // User stats routes
  app.get("/api/stats", async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const stats = await storage.getUserStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });
  
  // Streak management route
  app.post("/api/streak/check", async (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const now = new Date();
      const lastStudied = user.last_studied;
      
      if (!lastStudied) {
        // First time studying, set streak to 1
        await storage.updateUser(user.id, { streak: 1, last_studied: now });
        return res.json({ streak: 1, streakUpdated: true });
      }
      
      // Check if last studied was yesterday or today
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastStudiedDate = new Date(lastStudied);
      lastStudiedDate.setHours(0, 0, 0, 0);
      
      if (lastStudiedDate.getTime() === today.getTime()) {
        // Already studied today, no streak update needed
        return res.json({ streak: user.streak, streakUpdated: false });
      } else if (lastStudiedDate.getTime() === yesterday.getTime()) {
        // Studied yesterday, increment streak
        const newStreak = user.streak + 1;
        await storage.updateUser(user.id, { streak: newStreak, last_studied: now });
        return res.json({ streak: newStreak, streakUpdated: true });
      } else {
        // Streak broken, reset to 1
        await storage.updateUser(user.id, { streak: 1, last_studied: now });
        return res.json({ streak: 1, streakUpdated: true, streakBroken: true });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update streak" });
    }
  });
  
  // Admin routes - simplified to avoid storage interface issues
  app.get("/api/admin/users", async (req, res) => {
    if (!isAuthenticated(req) || !req.user!.is_admin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      // Query users from Supabase directly
      const { data: users, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      res.json(users || []);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.put("/api/admin/users/:id", async (req, res) => {
    if (!isAuthenticated(req) || !req.user!.is_admin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const userId = req.params.id;
    
    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(req.body)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  app.get("/api/admin/decks", async (req, res) => {
    if (!isAuthenticated(req) || !req.user!.is_admin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      const { data: decks, error } = await supabase
        .from('decks')
        .select('*');
      
      if (error) throw error;
      res.json(decks || []);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch decks" });
    }
  });
  
  app.put("/api/admin/decks/:id", async (req, res) => {
    if (!isAuthenticated(req) || !req.user!.is_admin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const deckId = parseInt(req.params.id);
    if (isNaN(deckId)) {
      return res.status(400).json({ message: "Invalid deck ID" });
    }
    
    try {
      const { data: updatedDeck, error } = await supabase
        .from('decks')
        .update(req.body)
        .eq('id', deckId)
        .select()
        .single();
      
      if (error) throw error;
      res.json(updatedDeck);
    } catch (error) {
      res.status(500).json({ message: "Failed to update deck" });
    }
  });
  
  return httpServer;
}
