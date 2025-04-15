import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusCircle, 
  LineChart, 
  User
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

const NavItem = ({ href, icon, label, isActive }: NavItemProps) => (
  <Link href={href}>
    <a className={cn(
      "flex flex-col items-center p-2",
      isActive ? "text-primary" : "text-neutral-400 hover:text-neutral-600"
    )}>
      <span className="text-xl">{icon}</span>
      <span className="text-xs mt-1">{label}</span>
    </a>
  </Link>
);

export function MobileNav() {
  const [location] = useLocation();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-2 flex justify-around items-center md:hidden z-10">
      <NavItem 
        href="/" 
        icon={<LayoutDashboard size={20} />} 
        label="Home" 
        isActive={location === "/"}
      />
      <NavItem 
        href="/decks" 
        icon={<BookOpen size={20} />} 
        label="Decks" 
        isActive={location === "/decks"}
      />
      <NavItem 
        href="/create-flashcard" 
        icon={<PlusCircle size={24} />} 
        label="Create" 
        isActive={location === "/create-flashcard"}
      />
      <NavItem 
        href="/progress" 
        icon={<LineChart size={20} />} 
        label="Stats" 
        isActive={location === "/progress"}
      />
      <NavItem 
        href="/profile" 
        icon={<User size={20} />} 
        label="Profile" 
        isActive={location === "/profile"}
      />
    </div>
  );
}
