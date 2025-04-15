import React from "react";

// Audio wave icon component for listening quizzes
export function AudioWave({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-end h-8 gap-1 audio-wave ${className}`}>
      <span className="h-3 w-2"></span>
      <span className="h-5 w-2"></span>
      <span className="h-8 w-2"></span>
      <span className="h-4 w-2"></span>
      <span className="h-6 w-2"></span>
    </div>
  );
}

// Streak icon (fire) with animation
export function StreakIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`text-secondary-400 animate-bounce-small ${className}`}>
      <i className="ri-fire-fill text-4xl"></i>
    </div>
  );
}

// Custom avatar component with fallback
interface AvatarProps {
  src?: string;
  alt: string;
  className?: string;
}

export function Avatar({ src, alt, className = "" }: AvatarProps) {
  const [error, setError] = React.useState(false);
  
  // Generate initials from the alt text
  const getInitials = () => {
    return alt
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (!src || error) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-primary-100 text-primary-600 font-medium ${className}`}>
        {getInitials()}
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`rounded-full ${className}`}
      onError={() => setError(true)}
    />
  );
}

// Custom logo component
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`text-primary font-poppins font-bold ${className}`}>
      Flash<span className="text-accent">Learn</span>
    </span>
  );
}

// Quiz type icons
export function MultipleChoiceIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary ${className}`}>
      <i className="ri-checkbox-multiple-line text-xl"></i>
    </div>
  );
}

export function TypingQuizIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`w-10 h-10 rounded-full bg-secondary-50 flex items-center justify-center text-secondary-400 ${className}`}>
      <i className="ri-chat-1-line text-xl"></i>
    </div>
  );
}

export function ListeningQuizIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center text-accent ${className}`}>
      <i className="ri-volume-up-line text-xl"></i>
    </div>
  );
}
