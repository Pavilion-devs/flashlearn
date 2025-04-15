import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  front: string;
  back: string;
  definition?: string;
  audioUrl?: string;
  onResult?: (result: "again" | "got-it") => void;
  onNext?: () => void;
  onPrevious?: () => void;
  current: number;
  total: number;
}

export function Flashcard({ 
  front, 
  back, 
  definition, 
  audioUrl,
  onResult,
  onNext,
  onPrevious,
  current,
  total
}: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  
  const handleFlip = () => {
    setFlipped(!flipped);
  };
  
  const handleAudio = () => {
    if (audioUrl) {
      if (!audio) {
        const newAudio = new Audio(audioUrl);
        setAudio(newAudio);
        newAudio.play();
      } else {
        audio.currentTime = 0;
        audio.play();
      }
    }
  };
  
  const handleAgain = () => {
    if (onResult) onResult("again");
    setFlipped(false);
  };
  
  const handleGotIt = () => {
    if (onResult) onResult("got-it");
    setFlipped(false);
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-poppins font-semibold">Flashcard Review</h1>
          <p className="text-neutral-500">Card {current} of {total}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-neutral-600">{current}/{total}</span>
          <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${(current / total) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="perspective" onClick={handleFlip}>
        <div className={cn("relative h-80 sm:h-96 w-full cursor-pointer flashcard transition-transform", flipped && "card-flipped")}>
          {/* Front Side */}
          <div className="flashcard-front absolute inset-0 bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-wide text-neutral-400 absolute top-4 left-4">Front</span>
            <h2 className="text-3xl sm:text-4xl font-poppins font-semibold text-center mb-4">{front}</h2>
            <div className="text-neutral-500 text-sm absolute bottom-4 left-0 right-0 text-center">
              <span>Tap to see answer</span>
            </div>
          </div>
          
          {/* Back Side */}
          <div className="flashcard-back absolute inset-0 bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-between">
            <div className="absolute top-4 left-4 flex space-x-2">
              <span className="text-xs uppercase tracking-wide text-neutral-400">Back</span>
            </div>
            
            <div className="flex flex-col items-center justify-center flex-grow text-center">
              <h3 className="text-2xl sm:text-3xl font-poppins font-semibold mb-2">{back}</h3>
              {definition && <p className="text-neutral-500 mb-4">{definition}</p>}
              {audioUrl && (
                <div className="flex items-center justify-center mt-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAudio();
                    }}
                  >
                    <Volume2 size={18} />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="w-full flex justify-between pt-4">
              <Button 
                variant="outline" 
                className="border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAgain();
                }}
              >
                <X size={16} className="mr-1" /> Again
              </Button>
              <Button 
                className="bg-success text-white hover:bg-green-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGotIt();
                }}
              >
                <Check size={16} className="mr-1" /> Got it
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button 
          variant="outline"
          className="border-neutral-200 text-neutral-700 hover:bg-neutral-50"
          onClick={onPrevious}
          disabled={current === 1}
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Previous
        </Button>
        <Button 
          variant="outline"
          className="border-neutral-200 text-neutral-700 hover:bg-neutral-50"
          onClick={onNext}
          disabled={current === total}
        >
          Next
          <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
