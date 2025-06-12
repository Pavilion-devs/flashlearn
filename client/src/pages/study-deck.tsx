import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Flashcard as FlashcardType } from "@shared/types";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Flashcard } from "@/components/flashcards/flashcard";
import { useToast } from "@/hooks/use-toast";
import { calculateNextReview } from "@/lib/spacedRepetition";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StreakIcon } from "@/components/icons";

export default function StudyDeck() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });
  
  // Check if we're studying due cards or a specific deck
  const studyingDueCards = params.id === "due";
  
  // Fetch flashcards for a specific deck
  const {
    data: deckCards,
    isLoading: deckCardsLoading,
    isError: deckCardsError,
  } = useQuery<FlashcardType[]>({
    queryKey: [`/api/decks/${params.id}/flashcards`],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch flashcards");
      return await res.json();
    },
    enabled: !studyingDueCards && !!params.id,
  });
  
  // Fetch due flashcards across all decks
  const {
    data: dueCards,
    isLoading: dueCardsLoading,
    isError: dueCardsError,
  } = useQuery({
    queryKey: ["/api/study/due"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch due flashcards");
      return await res.json();
    },
    enabled: studyingDueCards,
  });
  
  // Get deck info if studying a specific deck
  const {
    data: deck,
    isLoading: deckLoading,
  } = useQuery({
    queryKey: [`/api/decks/${params.id}`],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch deck");
      return await res.json();
    },
    enabled: !studyingDueCards && !!params.id,
  });
  
  // Update card progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { flashcardId: number; quality: number }) => {
      const res = await apiRequest("POST", "/api/study/progress", data);
      return await res.json();
    },
    onSuccess: () => {
      // Update user stats
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      if (studyingDueCards) {
        queryClient.invalidateQueries({ queryKey: ["/api/study/due"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to update progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Get the active cards based on what we're studying
  const activeCards = studyingDueCards
    ? dueCards?.map((item: any) => item.flashcard)
    : deckCards;
  
  // Loading states
  const isLoading = studyingDueCards ? dueCardsLoading : deckCardsLoading || deckLoading;
  const isError = studyingDueCards ? dueCardsError : deckCardsError;
  
  // Get current card
  const currentCard = activeCards && activeCards.length > 0 
    ? activeCards[currentCardIndex]
    : null;
  
  // Handle card result (again or got it)
  const handleCardResult = (result: "again" | "got-it") => {
    if (!currentCard) return;
    
    // Add card to studied set
    setStudiedCards(prev => new Set(prev.add(currentCard.id)));
    
    // Calculate quality for spaced repetition
    // 0-2 for "again", 3-5 for "got it" (higher = better recall)
    const quality = result === "again" ? 1 : 4;
    
    // Update session score
    if (result === "got-it") {
      setSessionScore(prev => ({ 
        ...prev, 
        correct: prev.correct + 1,
        total: prev.total + 1
      }));
    } else {
      setSessionScore(prev => ({ 
        ...prev, 
        total: prev.total + 1
      }));
    }
    
    // Update progress in the database
    updateProgressMutation.mutate({
      flashcardId: currentCard.id,
      quality,
    });
    
    // If we're at the last card, show completion screen
    if (currentCardIndex === activeCards.length - 1) {
      setSessionCompleted(true);
    } else {
      // Move to next card
      setCurrentCardIndex(prev => prev + 1);
    }
  };
  
  // Handle navigation
  const handleNext = () => {
    if (currentCardIndex < activeCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };
  
  const handleFinishSession = () => {
    navigate("/");
    toast({
      title: "Study session completed",
      description: `You reviewed ${studiedCards.size} flashcards with ${Math.round((sessionScore.correct / sessionScore.total) * 100)}% accuracy.`,
    });
  };
  
  const getTitle = () => {
    if (studyingDueCards) return "Due Cards Review";
    return deck?.name || "Flashcard Review";
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <MobileHeader />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50 pb-16 md:pb-6 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </main>
        </div>
        <MobileNav />
      </div>
    );
  }
  
  if (isError || (!activeCards || activeCards.length === 0)) {
    return (
      <div className="flex flex-col h-screen">
        <MobileHeader />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50 pb-16 md:pb-6">
            <div className="max-w-2xl mx-auto">
              <Button
                variant="outline"
                className="mb-6"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Decks
              </Button>
              
              <Card>
                <CardContent className="p-8 text-center">
                  <h2 className="text-xl font-semibold mb-4">
                    {isError ? "Error loading flashcards" : "No flashcards to review"}
                  </h2>
                  <p className="text-neutral-500 mb-6">
                    {isError 
                      ? "There was a problem loading the flashcards. Please try again later."
                      : studyingDueCards
                        ? "You don't have any cards due for review. Great job staying on top of your studies!"
                        : "This deck doesn't have any flashcards yet. Add some cards to get started."
                    }
                  </p>
                  <div className="flex justify-center">
                    <Button onClick={() => navigate("/decks")}>
                      Go to My Decks
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    );
  }
  
  if (sessionCompleted) {
    return (
      <div className="flex flex-col h-screen">
        <MobileHeader />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50 pb-16 md:pb-6">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mb-4 flex justify-center">
                    <StreakIcon className="h-16 w-16" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">
                    Session Complete!
                  </h2>
                  <p className="text-neutral-500 mb-6">
                    You've reviewed all flashcards in this session.
                  </p>
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="flex items-center">
                      <span className="text-lg font-medium mr-2">Cards Reviewed:</span>
                      <span className="text-lg">{studiedCards.size}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-medium mr-2">Accuracy:</span>
                      <span className="text-lg">
                        {sessionScore.total > 0 
                          ? `${Math.round((sessionScore.correct / sessionScore.total) * 100)}%` 
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <Button onClick={handleFinishSession} size="lg">
                    Return to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50 pb-16 md:pb-6">
          {currentCard && (
            <Flashcard
              front={currentCard.front}
              back={currentCard.back}
              definition={currentCard.exampleSentence}
              audioUrl={currentCard.audioUrl || undefined}
              onResult={handleCardResult}
              onNext={handleNext}
              onPrevious={handlePrevious}
              current={currentCardIndex + 1}
              total={activeCards.length}
            />
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
