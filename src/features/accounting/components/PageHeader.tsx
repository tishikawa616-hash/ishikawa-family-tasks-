"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function PageHeader({ title, showBack = false, rightAction }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass z-40 flex items-center justify-between px-4 transition-all duration-200">
      <div className="flex items-center gap-2">
        {showBack && (
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/5 transition-colors"
            aria-label="戻る"
          >
            <ChevronLeft size={28} className="text-(--foreground)" />
          </button>
        )}
        <h1 className="text-xl font-bold text-(--foreground)">{title}</h1>
      </div>
      
      {rightAction && (
        <div>{rightAction}</div>
      )}
    </header>
  );
}
