"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Board } from "@/types/board";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  board: Board;
}

export function CalendarView({ board }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get all tasks from all columns
  const allTasks = board.columns.flatMap((col) => col.tasks);

  const getTasksForDay = (date: Date) => {
    return allTasks.filter((task) => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), date);
    });
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  // Calculate empty cells for grid alignment
  const startDayOfWeek = monthStart.getDay();
  const emptyDaysStart = Array(startDayOfWeek).fill(null);

  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)] overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
          {format(currentDate, "yyyy年 M月", { locale: ja })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-secondary)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]"
          >
            今日
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-secondary)]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Header (Days of Week) */}
      <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={cn(
              "py-2 text-center text-xs font-semibold text-[var(--color-text-secondary)]",
              index === 0 && "text-[var(--color-accent-danger)]", // Sunday red
              index === 6 && "text-[var(--color-accent-primary)]" // Saturday blue
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid Body */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-auto bg-[var(--color-border)] gap-px">
        {/* Empty cells for previous month */}
        {emptyDaysStart.map((_, i) => (
          <div key={`empty-${i}`} className="bg-[var(--color-bg-secondary)]/30" />
        ))}

        {/* Days of the month */}
        {daysInMonth.map((day) => {
          const tasks = getTasksForDay(day);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] p-2 bg-[var(--color-bg-primary)] flex flex-col gap-1 transition-colors hover:bg-[var(--color-bg-hover)]",
                isTodayDate && "bg-blue-50/50"
              )}
            >
              <div className="flex items-center justify-center w-7 h-7 mb-1">
                <span
                  className={cn(
                    "text-sm font-medium rounded-full w-full h-full flex items-center justify-center",
                    isTodayDate
                      ? "bg-[var(--color-accent-primary)] text-white"
                      : "text-[var(--color-text-secondary)]"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Tasks List for Day */}
              <div className="flex flex-col gap-1 overflow-y-auto max-h-[120px]">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "text-[10px] px-1.5 py-1 rounded border truncate cursor-pointer transition-transform hover:scale-[1.02]",
                      priorityColors[task.priority || "low"]
                    )}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
