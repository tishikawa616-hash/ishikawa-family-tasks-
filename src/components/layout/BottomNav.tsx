"use client";

import { LayoutGrid, Calendar, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  currentView: "board" | "calendar";
  onChangeView: (view: "board" | "calendar") => void;
}

export function BottomNav({ currentView, onChangeView }: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-t border-gray-200 z-40 pb-safe-bottom">
      <div className="grid grid-cols-4 h-full">
        {/* Board Tab */}
        <button
          onClick={() => onChangeView("board")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-colors relative",
            currentView === "board"
              ? "text-blue-600"
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[10px] font-medium">ボード</span>
          {currentView === "board" && (
            <span className="absolute top-0 w-8 h-1 bg-blue-600 rounded-b-full" />
          )}
        </button>

        {/* Calendar Tab */}
        <button
          onClick={() => onChangeView("calendar")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-colors relative",
            currentView === "calendar"
              ? "text-blue-600"
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-medium">カレンダー</span>
          {currentView === "calendar" && (
            <span className="absolute top-0 w-8 h-1 bg-blue-600 rounded-b-full" />
          )}
        </button>

        {/* Notifications Tab (Mock) */}
        <button
          onClick={() => {}}
          className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600 relative"
        >
          <div className="relative">
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </div>
          <span className="text-[10px] font-medium">通知</span>
        </button>

        {/* Profile Tab (Mock for now) */}
        <button
          onClick={() => {}}
          className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600"
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">マイページ</span>
        </button>
      </div>
    </div>
  );
}
