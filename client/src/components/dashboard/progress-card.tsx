import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProgressCardProps {
  flashcards: string;
  xp: string;
  quizScore: string;
  percentDone: number;
}

export function ProgressCard({ flashcards, xp, quizScore, percentDone }: ProgressCardProps) {
  return (
    <Card className="bg-white">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-medium text-lg">Today's Progress</h3>
          <Badge variant="outline" className="bg-primary-50 text-primary-600 hover:bg-primary-50">
            {percentDone}% Done
          </Badge>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-500">Flashcards Reviewed</span>
            <span className="font-medium">{flashcards}</span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${parseInt(flashcards.split('/')[0]) / parseInt(flashcards.split('/')[1]) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-500">XP Earned</span>
            <span className="font-medium">{xp}</span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full" 
              style={{ width: `${parseInt(xp.split('/')[0]) / parseInt(xp.split('/')[1]) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-500">Quiz Score</span>
            <span className="font-medium">{quizScore}</span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-success rounded-full" 
              style={{ width: quizScore }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
