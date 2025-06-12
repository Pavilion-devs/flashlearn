import { 
  InsertUser, User, 
  InsertDeck, Deck,
  InsertFlashcard, Flashcard,
  InsertUserFlashcardProgress, UserFlashcardProgress,
  InsertQuizAttempt, QuizAttempt,
  InsertProgressStat, ProgressStat
} from "@shared/types";
import { supabase } from "./supabase";
import session from "express-session";
import MemoryStore from "memorystore";

// Define Json type since we're using Supabase
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Define the SessionStore type
type SessionStore = session.Store;

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  
  // Deck methods
  createDeck(deck: InsertDeck): Promise<Deck>;
  getDeck(id: number): Promise<Deck | undefined>;
  getDecksByUserId(userId: string): Promise<Deck[]>;
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
  getUserFlashcardProgress(userId: string, flashcardId: number): Promise<UserFlashcardProgress | undefined>;
  getDueFlashcards(userId: string): Promise<{ flashcard: Flashcard, progress: UserFlashcardProgress }[]>;
  updateUserFlashcardProgress(id: number, data: Partial<UserFlashcardProgress>): Promise<UserFlashcardProgress | undefined>;
  
  // Quiz methods
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttemptsByUserId(userId: string): Promise<QuizAttempt[]>;
  
  // Stats methods
  createProgressStat(stat: InsertProgressStat): Promise<ProgressStat>;
  getUserStats(userId: string): Promise<ProgressStat[]>;
  updateTodayStats(userId: string, data: Partial<InsertProgressStat>): Promise<ProgressStat | undefined>;
  
  // Session store
  sessionStore: SessionStore;
}

// Create a memory session store
const MemorySessionStore = MemoryStore(session);

// Implement real Supabase storage
export class SupabaseStorage implements IStorage {
  sessionStore: SessionStore;
  
  constructor() {
    this.sessionStore = new MemorySessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }
  
  // User methods
  async getUser(id: string): Promise<User | undefined> {
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
        daily_goal: 20,
        daily_progress: 0,
        is_admin: false,
        last_studied: null,
      })
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Failed to create user: ${error?.message || 'Unknown error'}`);
    }
    
    return data as User;
  }
  
  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
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
        card_count: 0,
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
  
  async getDecksByUserId(userId: string): Promise<Deck[]> {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', userId);
      
    if (error || !data) return [];
    return data as Deck[];
  }
  
  async getPublicDecks(): Promise<Deck[]> {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('is_public', true);
      
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
    const { data, error } = await supabase
      .from('flashcards')
      .insert(flashcard)
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Failed to create flashcard: ${error?.message || 'Unknown error'}`);
    }
    
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
      .eq('deck_id', deckId);
      
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
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id);
      
    return !error;
  }
  
  // Progress methods
  async createUserFlashcardProgress(progress: InsertUserFlashcardProgress): Promise<UserFlashcardProgress> {
    const { data, error } = await supabase
      .from('user_flashcard_progress')
      .insert({
        ...progress,
        repetitions: 0,
        last_reviewed: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Failed to create progress: ${error?.message || 'Unknown error'}`);
    }
    
    return data as UserFlashcardProgress;
  }
  
  async getUserFlashcardProgress(userId: string, flashcardId: number): Promise<UserFlashcardProgress | undefined> {
    const { data, error } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('flashcard_id', flashcardId)
      .single();
      
    if (error || !data) return undefined;
    return data as UserFlashcardProgress;
  }
  
  async getDueFlashcards(userId: string): Promise<{ flashcard: Flashcard, progress: UserFlashcardProgress }[]> {
    const { data, error } = await supabase
      .from('user_flashcard_progress')
      .select(`
        *,
        flashcards (*)
      `)
      .eq('user_id', userId)
      .lte('next_review', new Date().toISOString());
      
    if (error || !data) return [];
    
    return data.map((item: any) => ({
      flashcard: item.flashcards,
      progress: {
        id: item.id,
        user_id: item.user_id,
        flashcard_id: item.flashcard_id,
        e_factor: item.e_factor,
        interval_days: item.interval_days,
        repetitions: item.repetitions,
        next_review: item.next_review,
        last_reviewed: item.last_reviewed,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }
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
      .insert(attempt)
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Failed to create quiz attempt: ${error?.message || 'Unknown error'}`);
    }
    
    return data as QuizAttempt;
  }
  
  async getQuizAttemptsByUserId(userId: string): Promise<QuizAttempt[]> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId);
      
    if (error || !data) return [];
    return data as QuizAttempt[];
  }
  
  // Stats methods
  async createProgressStat(stat: InsertProgressStat): Promise<ProgressStat> {
    const { data, error } = await supabase
      .from('progress_stats')
      .insert(stat)
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Failed to create progress stat: ${error?.message || 'Unknown error'}`);
    }
    
    return data as ProgressStat;
  }
  
  async getUserStats(userId: string): Promise<ProgressStat[]> {
    const { data, error } = await supabase
      .from('progress_stats')
      .select('*')
      .eq('user_id', userId);
      
    if (error || !data) return [];
    return data as ProgressStat[];
  }
  
  async updateTodayStats(userId: string, data: Partial<InsertProgressStat>): Promise<ProgressStat | undefined> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: updatedStat, error } = await supabase
      .from('progress_stats')
      .upsert({
        user_id: userId,
        date: today,
        ...data,
      })
      .select()
      .single();
      
    if (error || !updatedStat) return undefined;
    return updatedStat as ProgressStat;
  }
}

// Create the storage instance
export const storage = new SupabaseStorage();