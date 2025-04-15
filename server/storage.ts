import { 
  users, type User, type InsertUser,
  decks, type Deck, type InsertDeck,
  flashcards, type Flashcard, type InsertFlashcard,
  userFlashcardProgress, type UserFlashcardProgress, type InsertUserFlashcardProgress,
  quizAttempts, type QuizAttempt, type InsertQuizAttempt,
  progressStats, type ProgressStat, type InsertProgressStat
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private decks: Map<number, Deck>;
  private flashcards: Map<number, Flashcard>;
  private userFlashcardProgress: Map<string, UserFlashcardProgress>;
  private quizAttempts: Map<number, QuizAttempt>;
  private progressStats: Map<number, ProgressStat>;
  
  sessionStore: session.SessionStore;
  
  private userCurrentId: number;
  private deckCurrentId: number;
  private flashcardCurrentId: number;
  private progressCurrentId: number;
  private quizAttemptCurrentId: number;
  private statCurrentId: number;

  constructor() {
    this.users = new Map();
    this.decks = new Map();
    this.flashcards = new Map();
    this.userFlashcardProgress = new Map();
    this.quizAttempts = new Map();
    this.progressStats = new Map();
    
    this.userCurrentId = 1;
    this.deckCurrentId = 1;
    this.flashcardCurrentId = 1;
    this.progressCurrentId = 1;
    this.quizAttemptCurrentId = 1;
    this.statCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      streak: 0, 
      xp: 0, 
      dailyGoal: 20, 
      dailyProgress: 0, 
      isAdmin: false,
      lastStudied: null,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Deck methods
  async createDeck(deck: InsertDeck): Promise<Deck> {
    const id = this.deckCurrentId++;
    const now = new Date();
    const newDeck: Deck = { 
      ...deck, 
      id, 
      cardCount: 0, 
      createdAt: now
    };
    this.decks.set(id, newDeck);
    return newDeck;
  }
  
  async getDeck(id: number): Promise<Deck | undefined> {
    return this.decks.get(id);
  }
  
  async getDecksByUserId(userId: number): Promise<Deck[]> {
    return Array.from(this.decks.values()).filter(deck => deck.userId === userId);
  }
  
  async getPublicDecks(): Promise<Deck[]> {
    return Array.from(this.decks.values()).filter(deck => deck.isPublic);
  }
  
  async updateDeck(id: number, data: Partial<Deck>): Promise<Deck | undefined> {
    const deck = this.decks.get(id);
    if (!deck) return undefined;
    
    const updatedDeck = { ...deck, ...data };
    this.decks.set(id, updatedDeck);
    return updatedDeck;
  }
  
  async deleteDeck(id: number): Promise<boolean> {
    // Delete associated flashcards first
    const deckFlashcards = await this.getFlashcardsByDeckId(id);
    for (const flashcard of deckFlashcards) {
      await this.deleteFlashcard(flashcard.id);
    }
    
    return this.decks.delete(id);
  }
  
  // Flashcard methods
  async createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard> {
    const id = this.flashcardCurrentId++;
    const now = new Date();
    const newFlashcard: Flashcard = { ...flashcard, id, createdAt: now };
    this.flashcards.set(id, newFlashcard);
    
    // Update card count in deck
    const deck = this.decks.get(flashcard.deckId);
    if (deck) {
      this.decks.set(deck.id, { ...deck, cardCount: deck.cardCount + 1 });
    }
    
    return newFlashcard;
  }
  
  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    return this.flashcards.get(id);
  }
  
  async getFlashcardsByDeckId(deckId: number): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(
      flashcard => flashcard.deckId === deckId
    );
  }
  
  async updateFlashcard(id: number, data: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const flashcard = this.flashcards.get(id);
    if (!flashcard) return undefined;
    
    const updatedFlashcard = { ...flashcard, ...data };
    this.flashcards.set(id, updatedFlashcard);
    return updatedFlashcard;
  }
  
  async deleteFlashcard(id: number): Promise<boolean> {
    const flashcard = this.flashcards.get(id);
    if (!flashcard) return false;
    
    // Update card count in deck
    const deck = this.decks.get(flashcard.deckId);
    if (deck) {
      this.decks.set(deck.id, { ...deck, cardCount: Math.max(0, deck.cardCount - 1) });
    }
    
    // Also delete any progress associated with this flashcard
    for (const [key, progress] of this.userFlashcardProgress.entries()) {
      if (progress.flashcardId === id) {
        this.userFlashcardProgress.delete(key);
      }
    }
    
    return this.flashcards.delete(id);
  }
  
  // Progress methods
  async createUserFlashcardProgress(progress: InsertUserFlashcardProgress): Promise<UserFlashcardProgress> {
    const id = this.progressCurrentId++;
    const key = `${progress.userId}-${progress.flashcardId}`;
    const newProgress: UserFlashcardProgress = { ...progress, id, repetitions: 0 };
    this.userFlashcardProgress.set(key, newProgress);
    return newProgress;
  }
  
  async getUserFlashcardProgress(userId: number, flashcardId: number): Promise<UserFlashcardProgress | undefined> {
    const key = `${userId}-${flashcardId}`;
    return this.userFlashcardProgress.get(key);
  }
  
  async getDueFlashcards(userId: number): Promise<{ flashcard: Flashcard, progress: UserFlashcardProgress }[]> {
    const now = new Date();
    const results: { flashcard: Flashcard, progress: UserFlashcardProgress }[] = [];
    
    // Get all progress entries for this user
    const userProgress = Array.from(this.userFlashcardProgress.values())
      .filter(progress => progress.userId === userId);
    
    // Filter those that are due for review
    for (const progress of userProgress) {
      if (!progress.nextReview || progress.nextReview <= now) {
        const flashcard = this.flashcards.get(progress.flashcardId);
        if (flashcard) {
          results.push({ flashcard, progress });
        }
      }
    }
    
    return results;
  }
  
  async updateUserFlashcardProgress(id: number, data: Partial<UserFlashcardProgress>): Promise<UserFlashcardProgress | undefined> {
    // Find the progress entry by id
    let foundProgress: UserFlashcardProgress | undefined;
    let foundKey: string | undefined;
    
    for (const [key, progress] of this.userFlashcardProgress.entries()) {
      if (progress.id === id) {
        foundProgress = progress;
        foundKey = key;
        break;
      }
    }
    
    if (!foundProgress || !foundKey) return undefined;
    
    const updatedProgress = { ...foundProgress, ...data };
    this.userFlashcardProgress.set(foundKey, updatedProgress);
    return updatedProgress;
  }
  
  // Quiz methods
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = this.quizAttemptCurrentId++;
    const now = new Date();
    const newAttempt: QuizAttempt = { ...attempt, id, date: now };
    this.quizAttempts.set(id, newAttempt);
    return newAttempt;
  }
  
  async getQuizAttemptsByUserId(userId: number): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values())
      .filter(attempt => attempt.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date desc
  }
  
  // Stats methods
  async createProgressStat(stat: InsertProgressStat): Promise<ProgressStat> {
    const id = this.statCurrentId++;
    const now = new Date();
    const newStat: ProgressStat = { ...stat, id, date: now };
    this.progressStats.set(id, newStat);
    return newStat;
  }
  
  async getUserStats(userId: number): Promise<ProgressStat[]> {
    return Array.from(this.progressStats.values())
      .filter(stat => stat.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date desc
  }
  
  async updateTodayStats(userId: number, data: Partial<InsertProgressStat>): Promise<ProgressStat | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's stat entry for the user
    let todayStat: ProgressStat | undefined;
    
    for (const stat of this.progressStats.values()) {
      if (stat.userId === userId) {
        const statDate = new Date(stat.date);
        statDate.setHours(0, 0, 0, 0);
        
        if (statDate.getTime() === today.getTime()) {
          todayStat = stat;
          break;
        }
      }
    }
    
    // If no entry exists for today, create one
    if (!todayStat) {
      return this.createProgressStat({
        userId,
        cardsReviewed: data.cardsReviewed || 0,
        xpEarned: data.xpEarned || 0,
        timeSpent: data.timeSpent || 0,
        accuracy: data.accuracy || {}
      });
    }
    
    // Update the existing entry
    const updatedStat: ProgressStat = {
      ...todayStat,
      cardsReviewed: (todayStat.cardsReviewed || 0) + (data.cardsReviewed || 0),
      xpEarned: (todayStat.xpEarned || 0) + (data.xpEarned || 0),
      timeSpent: (todayStat.timeSpent || 0) + (data.timeSpent || 0),
      accuracy: { ...todayStat.accuracy, ...data.accuracy }
    };
    
    this.progressStats.set(todayStat.id, updatedStat);
    return updatedStat;
  }
}

export const storage = new MemStorage();
