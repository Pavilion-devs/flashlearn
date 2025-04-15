import React from "react";
import { Avatar, Logo } from "@/components/icons";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function MobileHeader() {
  const { user } = useAuth();
  
  return (
    <header className="md:hidden bg-white shadow-sm py-3 px-4 flex items-center justify-between">
      <Sheet>
        <SheetTrigger asChild>
          <button className="text-neutral-800">
            <Menu size={20} />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
      
      <div className="flex items-center">
        <Logo className="text-xl" />
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative">
          <button className="p-1 rounded-full">
            <Bell size={20} className="text-neutral-500" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-secondary-400"></span>
          </button>
        </div>
        <button className="rounded-full overflow-hidden h-8 w-8 bg-neutral-200">
          <Avatar alt={user?.name || user?.username || "User"} className="h-8 w-8" />
        </button>
      </div>
    </header>
  );
}
