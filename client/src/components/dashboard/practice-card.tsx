import React from "react";
import { Link } from "wouter";
import { 
  MultipleChoiceIcon, 
  TypingQuizIcon, 
  ListeningQuizIcon 
} from "@/components/icons";
import { ArrowRight } from "lucide-react";

interface PracticeCardProps {
  type: "multiple-choice" | "typing" | "listening";
  title: string;
  description: string;
}

export function PracticeCard({ type, title, description }: PracticeCardProps) {
  const getIcon = () => {
    switch (type) {
      case "multiple-choice":
        return <MultipleChoiceIcon />;
      case "typing":
        return <TypingQuizIcon />;
      case "listening":
        return <ListeningQuizIcon />;
      default:
        return <MultipleChoiceIcon />;
    }
  };
  
  const getTextColor = () => {
    switch (type) {
      case "multiple-choice":
        return "text-primary";
      case "typing":
        return "text-secondary-400";
      case "listening":
        return "text-accent";
      default:
        return "text-primary";
    }
  };
  
  return (
    <Link href={`/quiz/${type}`}>
      <a className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group block">
        <div className="p-5">
          <div className="flex items-center mb-3">
            {getIcon()}
            <h3 className="font-poppins font-medium ml-3">{title}</h3>
          </div>
          <p className="text-neutral-500 text-sm mb-4">{description}</p>
          <div className="flex justify-end">
            <span className={`${getTextColor()} group-hover:translate-x-1 transition-transform`}>
              <ArrowRight size={18} />
            </span>
          </div>
        </div>
      </a>
    </Link>
  );
}
