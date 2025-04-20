export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          username: string
          password: string
          name: string | null
          streak: number | null
          xp: number | null
          dailyGoal: number | null
          dailyProgress: number | null
          isAdmin: boolean | null
          lastStudied: Date | null
          createdAt: Date | null
        }
        Insert: {
          id?: number
          username: string
          password: string
          name?: string | null
          streak?: number | null
          xp?: number | null
          dailyGoal?: number | null
          dailyProgress?: number | null
          isAdmin?: boolean | null
          lastStudied?: Date | null
          createdAt?: Date | null
        }
        Update: {
          id?: number
          username?: string
          password?: string
          name?: string | null
          streak?: number | null
          xp?: number | null
          dailyGoal?: number | null
          dailyProgress?: number | null
          isAdmin?: boolean | null
          lastStudied?: Date | null
          createdAt?: Date | null
        }
      }
      decks: {
        Row: {
          id: number
          name: string
          description: string | null
          color: string | null
          cardCount: number | null
          isPublic: boolean | null
          userId: number
          createdAt: Date | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          color?: string | null
          cardCount?: number | null
          isPublic?: boolean | null
          userId: number
          createdAt?: Date | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          color?: string | null
          cardCount?: number | null
          isPublic?: boolean | null
          userId?: number
          createdAt?: Date | null
        }
      }
      flashcards: {
        Row: {
          id: number
          deckId: number
          front: string
          back: string
          partOfSpeech: string | null
          exampleSentence: string | null
          audioUrl: string | null
          createdAt: Date | null
        }
        Insert: {
          id?: number
          deckId: number
          front: string
          back: string
          partOfSpeech?: string | null
          exampleSentence?: string | null
          audioUrl?: string | null
          createdAt?: Date | null
        }
        Update: {
          id?: number
          deckId?: number
          front?: string
          back?: string
          partOfSpeech?: string | null
          exampleSentence?: string | null
          audioUrl?: string | null
          createdAt?: Date | null
        }
      }
      user_flashcard_progress: {
        Row: {
          id: number
          userId: number
          flashcardId: number
          eFactor: number | null
          interval: number | null
          repetitions: number | null
          nextReview: Date | null
          lastReviewed: Date | null
        }
        Insert: {
          id?: number
          userId: number
          flashcardId: number
          eFactor?: number | null
          interval?: number | null
          repetitions?: number | null
          nextReview?: Date | null
          lastReviewed?: Date | null
        }
        Update: {
          id?: number
          userId?: number
          flashcardId?: number
          eFactor?: number | null
          interval?: number | null
          repetitions?: number | null
          nextReview?: Date | null
          lastReviewed?: Date | null
        }
      }
      quiz_attempts: {
        Row: {
          id: number
          userId: number
          quizType: string
          score: number
          totalQuestions: number
          date: Date | null
        }
        Insert: {
          id?: number
          userId: number
          quizType: string
          score: number
          totalQuestions: number
          date?: Date | null
        }
        Update: {
          id?: number
          userId?: number
          quizType?: string
          score?: number
          totalQuestions?: number
          date?: Date | null
        }
      }
      progress_stats: {
        Row: {
          id: number
          userId: number
          cardsReviewed: number | null
          xpEarned: number | null
          timeSpent: number | null
          accuracy: Json
          date: Date | null
        }
        Insert: {
          id?: number
          userId: number
          cardsReviewed?: number | null
          xpEarned?: number | null
          timeSpent?: number | null
          accuracy?: Json
          date?: Date | null
        }
        Update: {
          id?: number
          userId?: number
          cardsReviewed?: number | null
          xpEarned?: number | null
          timeSpent?: number | null
          accuracy?: Json
          date?: Date | null
        }
      }
    }
  }
}