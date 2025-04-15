import React from "react";
import { Link } from "wouter";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeckCardProps {
  id: number;
  name: string;
  description: string;
  cardCount: number;
  color: string;
  lastStudied: string;
  status?: string;
}

export function DeckCard({ 
  id, 
  name, 
  description, 
  cardCount, 
  color = "primary", 
  lastStudied,
  status
}: DeckCardProps) {
  const colorMap = {
    primary: "bg-primary",
    secondary: "bg-secondary-400",
    accent: "bg-accent"
  };
  
  const textColorMap = {
    primary: "text-primary",
    secondary: "text-secondary-400",
    accent: "text-accent"
  };
  
  const hoverColorMap = {
    primary: "hover:text-primary-600",
    secondary: "hover:text-secondary-500",
    accent: "hover:text-accent-600"
  };
  
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-3 ${colorMap[color as keyof typeof colorMap] || colorMap.primary}`}></div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-poppins font-semibold">{name}</h3>
          <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full">
            {cardCount} cards
          </span>
        </div>
        <p className="text-neutral-500 text-sm mb-4 line-clamp-2">{description}</p>
        <div className="flex justify-between items-center">
          <div className="text-xs text-neutral-500">
            <span>{lastStudied}</span>
          </div>
          <Link href={`/study-deck/${id}`}>
            <a className={cn(
              textColorMap[color as keyof typeof textColorMap] || textColorMap.primary,
              hoverColorMap[color as keyof typeof hoverColorMap] || hoverColorMap.primary,
              "transition-colors"
            )}>
              <PlayCircle size={20} />
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
