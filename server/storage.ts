import { 
  InsertUser, User, 
  InsertDeck, Deck,
  InsertFlashcard, Flashcard,
  InsertUserFlashcardProgress, UserFlashcardProgress,
  InsertQuizAttempt, QuizAttempt,
  InsertProgressStat, ProgressStat
} from "@shared/schema";
import { supabase } from "./supabase";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { PostgrestError } from "@supabase/supabase-js";

// Define Json type since we're using Supabase
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Define the SessionStore type
type SessionStore = session.Store;

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Deck methods
  createDeck(deck: InsertDeck): Promise<Deck>;
  getDeck(id: number): Promise<Deck | undefined>;
  getDecksByUserId(userId: number): Promise<Deck[]>;
  getPublicDecks(): Promise<Deck[]>;
  updateDeck(id: number, data: Partial<Deck>): Promise<Deck | undefined>;
  deleteDeck(id: number): Promise<boolean>;
  
  // Flashcard methods
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  getFlashcard(id: number): Promise<Flashcard | undefined>;
  getFlashcardsByDeckId(deckId: number): Promise<Flashcard[]>;
  updateFlashcard(id: number, data: Partial<Flashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: number): Promise<boolean>;
  
  // Progress methods
  createUserFlashcardProgress(progress: InsertUserFlashcardProgress): Promise<UserFlashcardProgress>;
  getUserFlashcardProgress(userId: number, flashcardId: number): Promise<UserFlashcardProgress | undefined>;
  getDueFlashcards(userId: number): Promise<{ flashcard: Flashcard, progress: UserFlashcardProgress }[]>;
  updateUserFlashcardProgress(id: number, data: Partial<UserFlashcardProgress>): Promise<UserFlashcardProgress | undefined>;
  
  // Quiz methods
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttemptsByUserId(userId: number): Promise<QuizAttempt[]>;
  
  // Stats methods
  createProgressStat(stat: InsertProgressStat): Promise<ProgressStat>;
  getUserStats(userId: number): Promise<ProgressStat[]>;
  updateTodayStats(userId: number, data: Partial<InsertProgressStat>): Promise<ProgressStat | undefined>;
  
  // Session store
  sessionStore: SessionStore;
}

// Create a PostgreSQL session store
const PostgresSessionStore = connectPg(session);

// Helper function to handle Supabase responses
const handleSupabaseResponse = <T>(response: { data: T | null, error: PostgrestError | null }): T => {
  if (response.error) {
    throw new Error(`Supabase error: ${response.error.message}`);
  }
  if (!response.data) {
    throw new Error('No data returned from Supabase');
  }
  return response.data;
};

// Implement the database storage with Supabase
export class SupabaseStorage implements IStorage {
  sessionStore: SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true 
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    return data as User;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
      
    if (error || !data) return undefined;
    return data as User;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...insertUser,
        streak: 0,
        xp: 0,
        dailyGoal: 10,
        dailyProgress: 0,
        isAdmin: false,
        lastStudied: null,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Failed to create user: ${error?.message || 'Unknown error'}`);
    }
    
    return data as User;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (error || !updatedUser) return undefined;
    return updatedUser as User;
  }
  
  // Deck methods
  async createDeck(deck: InsertDeck): Promise<Deck> {
    const { data, error } = await supabase
      .from('decks')
      .insert({
        ...deck,
        cardCount: 0,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Failed to create deck: ${error?.message || 'Unknown error'}`);
    }
    
    return data as Deck;
  }
  
  async getDeck(id: number): Promise<Deck | undefined> {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    return data as Deck;
  }
  
  async getDecksByUserId(userId: number): Promise<Deck[]> {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('userId', userId);
      
    if (error || !data) return [];
    return data as Deck[];
  }
  
  async getPublicDecks(): Promise<Deck[]> {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('isPublic', true);
      
    if (error || !data) return [];
    return data as Deck[];
  }
  
  async updateDeck(id: number, data: Partial<Deck>): Promise<Deck | undefined> {
    const { data: updatedDeck, error } = await supabase
      .from('decks')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (error || !updatedDeck) return undefined;
    return updatedDeck as Deck;
  }
  
  async deleteDeck(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', id);
      
    return !error;
  }
  
  // Flashcard methods
  async createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard> {
    // First insert the flashcard
    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        ...flashcard,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Failed to create flashcard: ${error?.message || 'Unknown error'}`);
    }
    
    // Then update the deck card count
    await supabase.rpc('increment_deck_card_count', { deck_id: flashcard.deckId });
    
    return data as Flashcard;
  }
  
  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    return data as Flashcard;
  }
  
  async getFlashcardsByDeckId(deckId: number): Promise<Flashcard[]> {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deckId', deckId);
      
    if (error || !data) return [];
    return data as Flashcard[];
  }
  
  async updateFlashcard(id: number, data: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const { data: updatedFlashcard, error } = await supabase
      .from('flashcards')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (error || !updatedFlashcard) return undefined;
    return updatedFlashcard as Flashcard;
  }
  
  async deleteFlashcard(id: number): Promise<boolean> {
    // First get the flashcard to know its deck
    const { data: flashcard, error: getError } = await supabase
      .from('flashcards')
      .select('deckId')
      .eq('id', id)
      .single();
      
    if (getError || !flashcard) return false;
    
    // Delete the flashcard
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id);
      
    if (error) return false;
    
    // Update the deck card count
    await supabase.rpc('decrement_deck_card_count', { deck_id: flashcard.deckId });
    
    return true;
  }
  
  // Progress methods
  async createUserFlashcardProgress(progress: InsertUserFlashcardProgress): Promise<UserFlashcardProgress> {
    const { data, error } = await supabase
      .from('user_flashcard_progress')
      .insert({
        ...progress,
        repetitions: 0,
        lastReviewed: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Failed to create progress: ${error?.message || 'Unknown error'}`);
    }
    
    return data as UserFlashcardProgress;
  }
  
  async getUserFlashcardProgress(userId: number, flashcardId: number): Promise<UserFlashcardProgress | undefined> {
    const { data, error } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('userId', userId)
      .eq('flashcardId', flashcardId)
      .single();
      
    if (error || !data) return undefined;
    return data as UserFlashcardProgress;
  }
  
  async getDueFlashcards(userId: number): Promise<{ flashcard: Flashcard, progress: UserFlashcardProgress }[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('user_flashcard_progress')
      .select(`
        *,
        flashcard:flashcards(*)
      `)
      .eq('userId', userId)
      .lte('nextReview', now);
      
    if (error || !data) return [];
    
    return data.map(item => ({
      progress: {
        id: item.id,
        userId: item.userId,
        flashcardId: item.flashcardId,
        eFactor: item.eFactor,
        interval: item.interval,
        repetitions: item.repetitions,
        nextReview: item.nextReview ? new Date(item.nextReview) : null,
        lastReviewed: item.lastReviewed ? new Date(item.lastReviewed) : null
      } as UserFlashcardProgress,
      flashcard: item.flashcard as Flashcard
    }));
  }
  
  async updateUserFlashcardProgress(id: number, data: Partial<UserFlashcardProgress>): Promise<UserFlashcardProgress | undefined> {
    const { data: updatedProgress, error } = await supabase
      .from('user_flashcard_progress')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (error || !updatedProgress) return undefined;
    return updatedProgress as UserFlashcardProgress;
  }
  
  // Quiz methods
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        ...attempt,
        date: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Failed to create quiz attempt: ${error?.message || 'Unknown error'}`);
    }
    
    return data as QuizAttempt;
  }
  
  async getQuizAttemptsByUserId(userId: number): Promise<QuizAttempt[]> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false });
      
    if (error || !data) return [];
    return data as QuizAttempt[];
  }
  
  // Stats methods
  async createProgressStat(stat: InsertProgressStat): Promise<ProgressStat> {
    const { data, error } = await supabase
      .from('progress_stats')
      .insert({
        ...stat,
        date: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Failed to create progress stat: ${error?.message || 'Unknown error'}`);
    }
    
    return data as ProgressStat;
  }
  
  async getUserStats(userId: number): Promise<ProgressStat[]> {
    const { data, error } = await supabase
      .from('progress_stats')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false });
      
    if (error || !data) return [];
    return data as ProgressStat[];
  }
  
  async updateTodayStats(userId: number, data: Partial<InsertProgressStat>): Promise<ProgressStat | undefined> {
    // Format today's date for comparison (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Try to find today's stat
    const { data: existingStats, error: findError } = await supabase
      .from('progress_stats')
      .select('*')
      .eq('userId', userId)
      .filter('date', 'gte', `${today}T00:00:00`)
      .filter('date', 'lte', `${today}T23:59:59`);
    
    if (findError) return undefined;
    
    const todayStat = existingStats && existingStats.length > 0 ? existingStats[0] : null;
    
    if (todayStat) {
      // Update existing stat
      const updates = {
        cardsReviewed: (todayStat.cardsReviewed || 0) + (data.cardsReviewed || 0),
        xpEarned: (todayStat.xpEarned || 0) + (data.xpEarned || 0),
        timeSpent: (todayStat.timeSpent || 0) + (data.timeSpent || 0),
        accuracy: data.accuracy || todayStat.accuracy
      };
      
      const { data: updatedStat, error: updateError } = await supabase
        .from('progress_stats')
        .update(updates)
        .eq('id', todayStat.id)
        .select()
        .single();
        
      if (updateError || !updatedStat) return undefined;
      return updatedStat as ProgressStat;
    } else {
      // Create new stat
      return this.createProgressStat({
        userId,
        ...data
      });
    }
  }
}

// Create and export a storage instance
export const storage = new SupabaseStorage();