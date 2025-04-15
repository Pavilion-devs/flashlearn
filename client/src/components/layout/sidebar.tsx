import React from "react";
import { Link, useLocation } from "wouter";
import { Logo, Avatar } from "@/components/icons";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BookOpen, 
  WalletCards, 
  Brain,
  LineChart, 
  UserCog, 
  Settings, 
  HelpCircle, 
  LogOut,
  ShieldCheck
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

const NavItem = ({ href, icon, label, isActive }: NavItemProps) => (
  <li>
    <Link href={href}>
      <a className={cn(
        "flex items-center py-2 px-3 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors",
        isActive && "bg-primary-50 text-primary-600 font-medium"
      )}>
        <span className="mr-3 text-lg">{icon}</span>
        <span>{label}</span>
      </a>
    </Link>
  </li>
);

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <aside className="hidden md:block w-64 bg-white border-r border-neutral-100 p-4 overflow-y-auto">
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <Logo className="text-2xl" />
        </div>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <div className="mr-3 h-10 w-10 rounded-full overflow-hidden bg-neutral-200">
              <Avatar alt={user?.name || user?.username || "User"} className="h-10 w-10" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-800">{user?.name || user?.username}</h3>
              <div className="flex items-center text-sm">
                <span className="text-neutral-500 mr-1">{user?.streak}</span>
                <span className="text-secondary-400"><i className="ri-fire-fill"></i></span>
                <span className="mx-2 text-neutral-200">|</span>
                <span className="text-neutral-500">{user?.xp} XP</span>
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-neutral-600">Daily Goal</span>
              <span className="text-xs text-neutral-500 font-medium">
                {user?.dailyProgress}/{user?.dailyGoal}
              </span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-success rounded-full progress-bar animate-progress"
                style={{ 
                  '--progress-width': `${user?.dailyGoal ? (user?.dailyProgress / user?.dailyGoal) * 100 : 0}%` 
                } as React.CSSProperties}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <nav>
        <div className="mb-2 text-xs font-medium uppercase text-neutral-500">Menu</div>
        <ul className="space-y-1">
          <NavItem 
            href="/" 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            isActive={location === "/"}
          />
          <NavItem 
            href="/decks" 
            icon={<BookOpen size={18} />} 
            label="My Decks" 
            isActive={location === "/decks"}
          />
          <NavItem 
            href="/create-flashcard" 
            icon={<WalletCards size={18} />} 
            label="Flashcards" 
            isActive={location === "/create-flashcard"}
          />
          <NavItem 
            href="/quiz" 
            icon={<Brain size={18} />} 
            label="Quizzes" 
            isActive={location === "/quiz"}
          />
          <NavItem 
            href="/progress" 
            icon={<LineChart size={18} />} 
            label="Progress" 
            isActive={location === "/progress"}
          />
        </ul>

        <Separator className="my-4" />

        <div className="mb-2 text-xs font-medium uppercase text-neutral-500">Settings</div>
        <ul className="space-y-1">
          <NavItem 
            href="/profile" 
            icon={<UserCog size={18} />} 
            label="Profile" 
            isActive={location === "/profile"}
          />
          {user?.isAdmin && (
            <NavItem 
              href="/admin" 
              icon={<ShieldCheck size={18} />} 
              label="Admin" 
              isActive={location === "/admin"}
            />
          )}
          <NavItem 
            href="/settings" 
            icon={<Settings size={18} />} 
            label="Settings" 
            isActive={location === "/settings"}
          />
          <NavItem 
            href="/help" 
            icon={<HelpCircle size={18} />} 
            label="Help" 
            isActive={location === "/help"}
          />
          <li>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center py-2 px-3 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <LogOut size={18} className="mr-3" />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
