"use client";

import { LayoutGrid, Calendar, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  currentView: "board" | "calendar";
  onChangeView: (view: "board" | "calendar") => void;
}

export function BottomNav({ currentView, onChangeView }: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-40 pb-safe-bottom">
      <div className="grid grid-cols-4 h-full">
        {/* Board Tab */}
        <button
          onClick={() => onChangeView("board")}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 transition-all relative active:scale-95",
            currentView === "board"
              ? "text-blue-600 font-bold"
              : "text-gray-400 hover:text-gray-600 font-medium"
          )}
        >
          <div className={cn("p-1.5 rounded-xl transition-colors", currentView === "board" ? "bg-blue-50" : "")}>
             <LayoutGrid className={cn("w-7 h-7", currentView === "board" && "fill-blue-100")} />
          </div>
          <span className="text-xs tracking-tight">ボード</span>
        </button>

        {/* Calendar Tab */}
        <button
          onClick={() => onChangeView("calendar")}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 transition-all relative active:scale-95",
            currentView === "calendar"
              ? "text-blue-600 font-bold"
              : "text-gray-400 hover:text-gray-600 font-medium"
          )}
        >
          <div className={cn("p-1.5 rounded-xl transition-colors", currentView === "calendar" ? "bg-blue-50" : "")}>
             <Calendar className={cn("w-7 h-7", currentView === "calendar" && "fill-blue-100")} />
          </div>
          <span className="text-xs tracking-tight">カレンダー</span>
        </button>

        {/* Notifications Tab (Mock) */}
        <button
          onClick={() => {}}
          className="flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 font-medium transition-all active:scale-95 relative"
        >
          <div className="relative p-1.5">
            <Bell className="w-7 h-7" />
            <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          </div>
          <span className="text-xs tracking-tight">通知</span>
        </button>

        {/* Profile Tab (Mock for now) */}
        <button
          onClick={() => {}}
          className="flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 font-medium transition-all active:scale-95"
        >
          <div className="p-1.5">
             <User className="w-7 h-7" />
          </div>
          <span className="text-xs tracking-tight">マイページ</span>
        </button>
      </div>
    </div>
  );
}
