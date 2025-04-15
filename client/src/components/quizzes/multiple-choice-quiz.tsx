import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: number;
  question: string;
  options: Option[];
}

interface MultipleChoiceQuizProps {
  deckId: number;
  questions: Question[];
  onComplete: () => void;
}

export function MultipleChoiceQuiz({ deckId, questions, onComplete }: MultipleChoiceQuizProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  
  const currentQuestion = questions[currentQuestionIndex];
  
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
  
  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);
    
    // Update score if correct
    if (currentQuestion.options[index].isCorrect) {
      setScore(prev => prev + 1);
    }
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Quiz completed, submit result
      submitResult.mutate({
        deckId,
        quizType: "multiple-choice",
        score,
        totalQuestions: questions.length
      });
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedOption(null);
      setIsAnswered(false);
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
          <h1 className="text-2xl font-poppins font-semibold">Multiple Choice Quiz</h1>
          <p className="text-neutral-500">Test your knowledge</p>
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
          <h2 className="text-xl sm:text-2xl font-poppins font-semibold mb-2">
            {currentQuestion.question}
          </h2>
        </div>
        
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <div 
              key={index}
              className={cn(
                "border rounded-lg p-4 cursor-pointer transition-colors",
                selectedOption === index && option.isCorrect && "border-primary-200 bg-primary-50",
                selectedOption === index && !option.isCorrect && "border-destructive bg-destructive/10",
                selectedOption !== index && isAnswered && option.isCorrect && "border-primary-200 bg-primary-50",
                selectedOption === null && "hover:bg-neutral-50 border-neutral-200"
              )}
              onClick={() => handleOptionSelect(index)}
            >
              <div className="flex items-center">
                <div className={cn(
                  "h-5 w-5 rounded-full flex-shrink-0 mr-3 flex items-center justify-center",
                  selectedOption === index && option.isCorrect && "bg-primary border-2 border-primary text-white",
                  selectedOption === index && !option.isCorrect && "bg-destructive border-2 border-destructive text-white",
                  selectedOption !== index && isAnswered && option.isCorrect && "bg-primary border-2 border-primary text-white",
                  selectedOption === null && "border-2 border-neutral-300"
                )}>
                  {((selectedOption === index && option.isCorrect) || 
                    (selectedOption !== index && isAnswered && option.isCorrect)) && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {selectedOption === index && !option.isCorrect && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <span className={cn(
                  selectedOption === index && "font-medium",
                  selectedOption !== index && isAnswered && option.isCorrect && "font-medium"
                )}>
                  {option.text}
                </span>
              </div>
            </div>
          ))}
        </div>
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
        <Button
          variant={isAnswered ? "default" : "outline"}
          className={cn(
            isAnswered ? "bg-primary text-white" : "border-neutral-200 text-neutral-400 cursor-not-allowed"
          )}
          onClick={handleNext}
          disabled={!isAnswered || submitResult.isPending}
        >
          {submitResult.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {currentQuestionIndex < questions.length - 1 ? (
            <>
              Continue
              <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          ) : (
            "Complete Quiz"
          )}
        </Button>
      </div>
    </div>
  );
}
