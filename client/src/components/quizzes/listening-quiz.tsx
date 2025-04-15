import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioWave } from "@/components/icons";

interface Question {
  id: number;
  audioUrl: string;
  correctAnswer: string;
  maxPlays?: number;
}

interface ListeningQuizProps {
  deckId: number;
  questions: Question[];
  onComplete: () => void;
}

export function ListeningQuiz({ deckId, questions, onComplete }: ListeningQuizProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [playsLeft, setPlaysLeft] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentQuestion = questions[currentQuestionIndex];
  
  // Initialize playsLeft if not set
  React.useEffect(() => {
    if (playsLeft === null && currentQuestion.maxPlays) {
      setPlaysLeft(currentQuestion.maxPlays);
    } else if (playsLeft === null) {
      setPlaysLeft(3); // Default if maxPlays not provided
    }
  }, [currentQuestion, playsLeft]);
  
  // Submit quiz result mutation
  const submitResult = useMutation({
    mutationFn: async (data: { deckId: number, quizType: string, score: number, totalQuestions: number }) => {
      const res = await apiRequest("POST", "/api/quizzes/submit", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz completed",
        description: `Your score: ${score}/${questions.length}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Failed to submit quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const playAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(currentQuestion.audioUrl);
      
      audioRef.current.onplay = () => {
        setIsPlaying(true);
      };
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        if (playsLeft !== null && playsLeft > 0) {
          setPlaysLeft(prev => (prev !== null ? prev - 1 : null));
        }
      };
    }
    
    if (playsLeft === null || playsLeft > 0) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };
  
  // Reset audio when moving to a new question
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentQuestionIndex]);
  
  const checkAnswer = () => {
    if (!userAnswer.trim()) return;
    
    // Normalize answers to lowercase and trim for comparison
    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    const normalizedCorrectAnswer = currentQuestion.correctAnswer.toLowerCase().trim();
    
    const correct = normalizedUserAnswer === normalizedCorrectAnswer;
    setIsCorrect(correct);
    setIsAnswered(true);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer("");
      setIsAnswered(false);
      setIsCorrect(false);
      setPlaysLeft(null); // Reset plays for next question
    } else {
      // Quiz completed, submit result
      submitResult.mutate({
        deckId,
        quizType: "listening",
        score,
        totalQuestions: questions.length
      });
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setUserAnswer("");
      setIsAnswered(false);
      setIsCorrect(false);
      setPlaysLeft(null); // Reset plays for previous question
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isAnswered) {
      checkAnswer();
    } else if (e.key === 'Enter' && isAnswered) {
      handleNext();
    }
  };
  
  if (!currentQuestion) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-poppins font-semibold">Listening Quiz</h1>
          <p className="text-neutral-500">Listen and type what you hear</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-neutral-600">
            {currentQuestionIndex + 1}/{questions.length}
          </span>
          <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-poppins font-semibold mb-3">
            Listen and type what you hear
          </h2>
          
          <div className="flex justify-center mb-6">
            <Button
              className="w-16 h-16 rounded-full bg-primary text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={playAudio}
              disabled={playsLeft !== null && playsLeft <= 0}
            >
              <Volume2 size={24} />
            </Button>
          </div>
          
          {isPlaying && (
            <div className="flex justify-center mb-6">
              <AudioWave className="text-primary-300" />
            </div>
          )}
          
          <div className="flex justify-center text-neutral-500 text-sm mb-6">
            <button 
              className={cn(
                "flex items-center hover:text-primary transition-colors",
                (playsLeft !== null && playsLeft <= 0) && "text-neutral-300 hover:text-neutral-300 cursor-not-allowed"
              )}
              onClick={playsLeft !== null && playsLeft > 0 ? playAudio : undefined}
              disabled={playsLeft !== null && playsLeft <= 0}
            >
              <i className="ri-repeat-line mr-1"></i>
              Play again {playsLeft !== null ? `(${playsLeft} remaining)` : ""}
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <Input
            type="text"
            className="w-full p-4 text-lg"
            placeholder="Type what you hear..."
            value={userAnswer}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isAnswered || submitResult.isPending}
            autoFocus
          />
        </div>
        
        {isAnswered && (
          <div className={cn(
            "p-4 border rounded-lg flex items-start animate-fade-in",
            isCorrect ? "bg-success bg-opacity-10 border-success border-opacity-20 text-success" : 
                       "bg-error bg-opacity-10 border-error border-opacity-20 text-error"
          )}>
            {isCorrect ? (
              <CheckCircle className="h-5 w-5 mr-2 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 mr-2 mt-0.5" />
            )}
            <div>
              <p className="font-medium">
                {isCorrect ? "Correct!" : "Not quite right"}
              </p>
              <p className="text-sm opacity-80">
                {isCorrect 
                  ? `You correctly heard: ${currentQuestion.correctAnswer}`
                  : `The correct answer is: ${currentQuestion.correctAnswer}`
                }
              </p>
            </div>
          </div>
        )}
        
        {!isAnswered && (
          <div className="flex justify-end">
            <Button 
              onClick={checkAnswer} 
              disabled={!userAnswer.trim() || submitResult.isPending}
              className="bg-neutral-800 hover:bg-neutral-900 text-white"
            >
              Check Answer
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          className="border-neutral-200 text-neutral-700 hover:bg-neutral-50"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || submitResult.isPending}
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Previous
        </Button>
        {isAnswered && (
          <Button
            variant="default" 
            className="bg-primary text-white"
            onClick={handleNext}
            disabled={submitResult.isPending}
          >
            {submitResult.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {currentQuestionIndex < questions.length - 1 ? (
              <>
                Next
                <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            ) : (
              "Complete Quiz"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
