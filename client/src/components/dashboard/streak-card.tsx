import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StreakIcon } from "@/components/icons";

interface StreakCardProps {
  streak: number;
  bestStreak: number;
}

export function StreakCard({ streak, bestStreak }: StreakCardProps) {
  return (
    <Card className="bg-white">
      <CardContent className="p-5">
        <h3 className="font-medium text-lg mb-4">Current Streak</h3>
        <div className="flex justify-center items-center h-24">
          <div className="flex items-center">
            <span className="text-5xl font-poppins font-bold text-secondary-400 mr-3">
              {streak}
            </span>
            <StreakIcon />
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-neutral-500 text-sm">
            Keep going! Your best streak was {bestStreak} days
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
