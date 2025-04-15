import React, { useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Deck } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { StreakCard } from "@/components/dashboard/streak-card";
import { AccuracyCard } from "@/components/dashboard/accuracy-card";
import { DeckCard } from "@/components/dashboard/deck-card";
import { PracticeCard } from "@/components/dashboard/practice-card";
import { Button } from "@/components/ui/button";
import { Play, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch decks
  const { 
    data: decks, 
    isLoading: decksLoading 
  } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch decks");
      return await res.json();
    },
  });
  
  // Fetch user stats
  const { 
    data: stats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return await res.json();
    },
  });
  
  // Check streak mutation
  const checkStreak = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/streak/check", {});
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.streakUpdated) {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
    },
  });
  
  // Check streak on page load
  useEffect(() => {
    if (user) {
      checkStreak.mutate();
    }
  }, [user]);
  
  // Prepare accuracy data
  const accuracyItems = [
    { type: "Multiple Choice", percentage: 90 },
    { type: "Typing Quizzes", percentage: 85 },
    { type: "Listening", percentage: 70 }
  ];
  
  if (stats && stats.length > 0 && stats[0].accuracy) {
    // Update with actual data if available
    const accuracy = stats[0].accuracy;
    if (accuracy["multiple-choice"]) {
      accuracyItems[0].percentage = accuracy["multiple-choice"];
    }
    if (accuracy["typing"]) {
      accuracyItems[1].percentage = accuracy["typing"];
    }
    if (accuracy["listening"]) {
      accuracyItems[2].percentage = accuracy["listening"];
    }
  }
  
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50 pb-16 md:pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-poppins font-semibold mb-1">
                  Welcome back, {user?.name || user?.username}!
                </h1>
                <p className="text-neutral-500">Continue your learning journey</p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                <Link href="/study-deck/due">
                  <Button className="inline-flex items-center">
                    <Play size={16} className="mr-2" />
                    Start Learning
                  </Button>
                </Link>
                <Link href="/create-flashcard">
                  <Button variant="outline" className="inline-flex items-center">
                    <Plus size={16} className="mr-2" />
                    Create Deck
                  </Button>
                </Link>
              </div>
            </div>

            {/* Progress Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Today's Progress */}
              {statsLoading ? (
                <Skeleton className="h-48 w-full rounded-xl" />
              ) : (
                <ProgressCard 
                  flashcards={`${user?.dailyProgress || 0}/${user?.dailyGoal || 20}`}
                  xp={stats && stats.length > 0 ? `${stats[0].xpEarned || 0}/200` : "0/200"}
                  quizScore="85%"
                  percentDone={user?.dailyGoal ? Math.round((user.dailyProgress / user.dailyGoal) * 100) : 0}
                />
              )}
              
              {/* Streak Status */}
              <StreakCard streak={user?.streak || 0} bestStreak={12} />
              
              {/* Accuracy Metrics */}
              <AccuracyCard items={accuracyItems} />
            </div>
            
            {/* Decks Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-poppins font-semibold">My Decks</h2>
                <Link href="/decks" className="text-primary text-sm hover:underline">
                  View All
                </Link>
              </div>
              
              {decksLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-xl" />
                  ))}
                </div>
              ) : decks && decks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {decks.slice(0, 3).map((deck) => (
                    <DeckCard 
                      key={deck.id}
                      id={deck.id}
                      name={deck.name}
                      description={deck.description || ""}
                      cardCount={deck.cardCount || 0}
                      color={deck.color || "primary"}
                      lastStudied={deck.lastStudied ? "Last studied yesterday" : "Not studied yet"}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center">
                  <p className="text-neutral-500 mb-4">You don't have any decks yet. Create your first deck to start learning!</p>
                  <Button onClick={() => navigate("/create-flashcard")} asChild>
                    <Link href="/create-flashcard" className="inline-flex items-center">
                      <Plus size={16} className="mr-2" />
                      Create Your First Deck
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            
            {/* Practice Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-poppins font-semibold">Start Practicing</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <PracticeCard 
                  type="multiple-choice"
                  title="Multiple Choice"
                  description="Test your knowledge with multiple choice questions."
                />
                
                <PracticeCard 
                  type="typing"
                  title="Typing Quiz"
                  description="Practice by typing the correct answers to reinforce memory."
                />
                
                <PracticeCard 
                  type="listening"
                  title="Listening Quiz"
                  description="Improve your listening skills by typing what you hear."
                />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
