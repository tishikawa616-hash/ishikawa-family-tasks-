"use client";

import { LayoutGrid, Calendar, MapPin, PieChart, ClipboardList, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface BottomNavProps {
  currentView?: "board" | "calendar";
  onChangeView?: (view: "board" | "calendar") => void;
}

export function BottomNav({ currentView: propCurrentView, onChangeView }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname === "/login") return null;

  const currentView = propCurrentView || (searchParams.get("view") === "calendar" ? "calendar" : "board");

  const isHome = pathname === "/";
  const isBoard = isHome && currentView === "board";
  const isCalendar = isHome && currentView === "calendar";
  const isFields = pathname.startsWith("/fields");
  const isReports = pathname.startsWith("/reports");
  const isLogs = pathname.startsWith("/logs");

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-40 pb-safe-bottom">
      <div className="grid grid-cols-5 h-full">
        {/* Board Tab */}
        <button
          onClick={() => {
            if (isHome && onChangeView) {
                onChangeView("board");
            } else {
                router.push("/?view=board");
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 transition-all relative active:scale-95",
            isBoard
              ? "text-blue-600 font-bold"
              : "text-gray-400 hover:text-gray-600 font-medium"
          )}
        >
          <div className={cn("p-1.5 rounded-xl transition-colors", isBoard ? "bg-blue-50" : "")}>
             <LayoutGrid className={cn("w-6 h-6", isBoard && "fill-blue-100")} />
          </div>
          <span className="text-[10px] tracking-tight">ボード</span>
        </button>

        {/* Calendar Tab */}
        <button
          onClick={() => {
            if (isHome && onChangeView) {
                onChangeView("calendar");
            } else {
                router.push("/?view=calendar");
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 transition-all relative active:scale-95",
            isCalendar
              ? "text-blue-600 font-bold"
              : "text-gray-400 hover:text-gray-600 font-medium"
          )}
        >
          <div className={cn("p-1.5 rounded-xl transition-colors", isCalendar ? "bg-blue-50" : "")}>
             <Calendar className={cn("w-6 h-6", isCalendar && "fill-blue-100")} />
          </div>
          <span className="text-[10px] tracking-tight">予定</span>
        </button>

        {/* Fields Tab */}
        <button
          onClick={() => router.push("/fields")}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 transition-all relative active:scale-95",
            isFields
              ? "text-emerald-600 font-bold"
              : "text-gray-400 hover:text-gray-600 font-medium"
          )}
        >
          <div className={cn("p-1.5 rounded-xl transition-colors", isFields ? "bg-emerald-50" : "")}>
             <MapPin className={cn("w-6 h-6", isFields && "fill-emerald-100")} />
          </div>
          <span className="text-[10px] tracking-tight">圃場</span>
        </button>

        {/* Reports Tab */}
        <button
          onClick={() => router.push("/reports")}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 transition-all relative active:scale-95",
            isReports
              ? "text-purple-600 font-bold"
              : "text-gray-400 hover:text-gray-600 font-medium"
          )}
        >
          <div className={cn("p-1.5 rounded-xl transition-colors", isReports ? "bg-purple-50" : "")}>
            <PieChart className={cn("w-6 h-6", isReports && "fill-purple-100")} />
          </div>
          <span className="text-[10px] tracking-tight">分析</span>
        </button>

        {/* Accounting Tab */}
        <button
          onClick={() => router.push("/accounting")}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 transition-all relative active:scale-95",
            pathname.startsWith("/accounting")
              ? "text-orange-600 font-bold"
              : "text-gray-400 hover:text-gray-600 font-medium"
          )}
        >
          <div className={cn("p-1.5 rounded-xl transition-colors", pathname.startsWith("/accounting") ? "bg-orange-50" : "")}>
            <Wallet className={cn("w-6 h-6", pathname.startsWith("/accounting") && "fill-orange-100")} />
          </div>
          <span className="text-[10px] tracking-tight">家計簿</span>
        </button>
      </div>
    </div>
  );
}
