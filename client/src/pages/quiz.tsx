import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MultipleChoiceQuiz } from "@/components/quizzes/multiple-choice-quiz";
import { TypingQuiz } from "@/components/quizzes/typing-quiz";
import { ListeningQuiz } from "@/components/quizzes/listening-quiz";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MultipleChoiceIcon, 
  TypingQuizIcon, 
  ListeningQuizIcon 
} from "@/components/icons";
import { Deck } from "@shared/schema";
import { Loader2, ArrowLeft, BookOpen, Play } from "lucide-react";

type QuizType = "multiple-choice" | "typing" | "listening";

// Function to generate quiz questions based on flashcards
const generateQuizQuestions = (
  flashcards: any[], 
  type: QuizType, 
  maxQuestions: number = 10
) => {
  // Limit the number of questions
  const limitedCards = flashcards.length > maxQuestions 
    ? flashcards.slice(0, maxQuestions) 
    : flashcards;
  
  // If not enough cards, just return what we have
  if (limitedCards.length < 4 && type === "multiple-choice") {
    return [];
  }
  
  switch (type) {
    case "multiple-choice":
      return limitedCards.map(card => {
        // Get 3 random incorrect options from other cards
        const otherCards = flashcards.filter(c => c.id !== card.id);
        const shuffled = [...otherCards].sort(() => 0.5 - Math.random());
        const incorrectOptions = shuffled.slice(0, 3).map(c => ({
          text: c.back,
          isCorrect: false
        }));
        
        // Add correct option
        const options = [
          { text: card.back, isCorrect: true },
          ...incorrectOptions
        ];
        
        // Shuffle options
        const shuffledOptions = [...options].sort(() => 0.5 - Math.random());
        
        return {
          id: card.id,
          question: `What is the translation for "${card.front}"?`,
          options: shuffledOptions
        };
      });
      
    case "typing":
      return limitedCards.map(card => ({
        id: card.id,
        question: `Translate to ${card.partOfSpeech ? `${card.partOfSpeech}: ` : ""}${card.front}`,
        correctAnswer: card.back,
        hint: card.exampleSentence
      }));
      
    case "listening":
      return limitedCards
        .filter(card => card.audioUrl) // Only include cards with audio
        .map(card => ({
          id: card.id,
          audioUrl: card.audioUrl,
          correctAnswer: card.front,
          maxPlays: 3
        }));
      
    default:
      return [];
  }
};

export default function Quiz() {
  const params = useParams<{ type?: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<QuizType>(
    (params.type as QuizType) || "multiple-choice"
  );
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  
  // Fetch user's decks
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
  
  // Fetch flashcards when deck is selected
  const {
    data: flashcards,
    isLoading: flashcardsLoading,
    refetch: refetchFlashcards
  } = useQuery({
    queryKey: [`/api/decks/${selectedDeckId}/flashcards`],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch flashcards");
      return await res.json();
    },
    enabled: !!selectedDeckId,
  });
  
  // Update URL when quiz type changes
  useEffect(() => {
    if (params.type !== activeTab) {
      navigate(`/quiz/${activeTab}`, { replace: true });
    }
  }, [activeTab, params.type, navigate]);
  
  // Generate questions when starting quiz
  const handleStartQuiz = () => {
    if (!selectedDeckId || !flashcards) return;
    
    const generatedQuestions = generateQuizQuestions(flashcards, activeTab);
    
    if (generatedQuestions.length === 0) {
      alert("Not enough cards to create a quiz. For multiple-choice, you need at least 4 flashcards.");
      return;
    }
    
    setQuestions(generatedQuestions);
    setQuizStarted(true);
  };
  
  // Handle quiz completion
  const handleQuizComplete = () => {
    setQuizStarted(false);
    setQuestions([]);
  };
  
  // Get selected deck
  const selectedDeck = selectedDeckId 
    ? decks?.find(deck => deck.id === selectedDeckId) 
    : null;
  
  const renderQuiz = () => {
    if (!quizStarted || questions.length === 0) return null;
    
    switch (activeTab) {
      case "multiple-choice":
        return (
          <MultipleChoiceQuiz 
            deckId={selectedDeckId!} 
            questions={questions} 
            onComplete={handleQuizComplete} 
          />
        );
        
      case "typing":
        return (
          <TypingQuiz 
            deckId={selectedDeckId!} 
            questions={questions} 
            onComplete={handleQuizComplete} 
          />
        );
        
      case "listening":
        // Only show listening quiz if there are cards with audio
        if (questions.length === 0) {
          return (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-2">No Audio Flashcards</h2>
                <p className="text-neutral-500 mb-4">
                  This deck doesn't have any flashcards with audio. 
                  Add audio to your flashcards to practice listening.
                </p>
                <Button onClick={() => setQuizStarted(false)}>
                  Go Back
                </Button>
              </CardContent>
            </Card>
          );
        }
        
        return (
          <ListeningQuiz 
            deckId={selectedDeckId!} 
            questions={questions} 
            onComplete={handleQuizComplete} 
          />
        );
        
      default:
        return null;
    }
  };
  
  // If quiz has started, render the active quiz component
  if (quizStarted && questions.length > 0) {
    return (
      <div className="flex flex-col h-screen">
        <MobileHeader />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50 pb-16 md:pb-6">
            {renderQuiz()}
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
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-poppins font-semibold mb-1">
                Quiz Practice
              </h1>
              <p className="text-neutral-500">Test your knowledge with different quiz types</p>
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Quiz Type</CardTitle>
                <CardDescription>
                  Choose how you want to practice your flashcards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as QuizType)}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="multiple-choice">Multiple Choice</TabsTrigger>
                    <TabsTrigger value="typing">Typing</TabsTrigger>
                    <TabsTrigger value="listening">Listening</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="multiple-choice">
                    <div className="flex items-start space-x-4">
                      <MultipleChoiceIcon className="flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-medium mb-2">Multiple Choice Quiz</h3>
                        <p className="text-neutral-500 mb-4">
                          Test your knowledge by selecting the correct answer from multiple options.
                          This quiz type is great for beginners or when you're still learning new material.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="typing">
                    <div className="flex items-start space-x-4">
                      <TypingQuizIcon className="flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-medium mb-2">Typing Quiz</h3>
                        <p className="text-neutral-500 mb-4">
                          Type the correct answer to practice active recall.
                          This quiz type is more challenging and helps build stronger memory connections.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="listening">
                    <div className="flex items-start space-x-4">
                      <ListeningQuizIcon className="flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-medium mb-2">Listening Quiz</h3>
                        <p className="text-neutral-500 mb-4">
                          Listen to audio and type what you hear to improve your listening comprehension.
                          This quiz type is perfect for language learning and pronunciation practice.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quiz Setup</CardTitle>
                <CardDescription>
                  Select the deck you want to practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Deck
                  </label>
                  {decksLoading ? (
                    <div className="flex items-center h-10">
                      <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                      <span className="text-neutral-500">Loading decks...</span>
                    </div>
                  ) : decks && decks.length > 0 ? (
                    <Select 
                      value={selectedDeckId?.toString() || ""} 
                      onValueChange={(value) => setSelectedDeckId(Number(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a deck" />
                      </SelectTrigger>
                      <SelectContent>
                        {decks.map((deck) => (
                          <SelectItem key={deck.id} value={deck.id.toString()}>
                            {deck.name} ({deck.cardCount} cards)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                      <p className="text-neutral-500">
                        You don't have any decks yet. Create a deck first to start practicing.
                      </p>
                      <Button variant="outline" className="mt-2" onClick={() => navigate("/create-flashcard")}>
                        <BookOpen size={16} className="mr-2" />
                        Create Deck
                      </Button>
                    </div>
                  )}
                </div>
                
                {selectedDeck && (
                  <div className="bg-muted/10 p-4 rounded-md border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{selectedDeck.name}</h3>
                      <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full">
                        {selectedDeck.cardCount || 0} cards
                      </span>
                    </div>
                    {selectedDeck.description && (
                      <p className="text-sm text-neutral-500 mb-2">{selectedDeck.description}</p>
                    )}
                    {flashcardsLoading ? (
                      <div className="flex items-center h-8">
                        <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                        <span className="text-neutral-500 text-sm">Loading flashcards...</span>
                      </div>
                    ) : flashcards && flashcards.length > 0 ? (
                      <p className="text-sm text-neutral-500">
                        {activeTab === "listening" && 
                          flashcards.filter((card: any) => card.audioUrl).length === 0 ? (
                          <span className="text-secondary-400">
                            This deck doesn't have any cards with audio for the listening quiz.
                          </span>
                        ) : (
                          <span>Ready to start your {activeTab} quiz.</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-secondary-400">
                        This deck doesn't have any flashcards yet.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => navigate("/decks")}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Decks
                </Button>
                <Button
                  onClick={handleStartQuiz}
                  disabled={
                    !selectedDeckId || 
                    flashcardsLoading || 
                    !flashcards || 
                    flashcards.length === 0 ||
                    (activeTab === "listening" && 
                     flashcards.filter((card: any) => card.audioUrl).length === 0)
                  }
                >
                  <Play size={16} className="mr-2" />
                  Start Quiz
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
