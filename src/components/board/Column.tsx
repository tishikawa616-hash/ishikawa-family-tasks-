"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { Column as ColumnType, Task } from "@/types/board";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

interface ColumnProps {
  column: ColumnType;
  onAddTask: (columnId?: string) => void;
  onTaskClick?: (task: Task) => void;
}

export function Column({ column, onAddTask, onTaskClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      className={cn(
        "flex flex-col w-full md:w-72 shrink-0",
        "rounded-xl",
        "border border-(--color-border)",
        "backdrop-blur-sm transition-colors",
        isOver && "ring-2 ring-(--color-accent-primary) ring-opacity-50"
      )}
      style={{
        borderColor: `${column.color}40`, // Subtle border match
        backgroundColor: `rgba(255, 255, 255, 0.4)` // Lighter glass background for whole column
      }}
    >
      {/* Column Header */}
      <div 
        className="flex items-center justify-between p-3 border-b"
        style={{ 
          backgroundColor: `${column.color}15`, // Header gets the color tint
          borderColor: `${column.color}20`
        }}
      >
        <h3 className="font-bold text-lg text-(--color-text-primary) flex items-center gap-2">
          {/* Accent Line/Indicator */}
          <div 
             className="w-1.5 h-6 rounded-full"
             style={{ backgroundColor: column.color }}
          />
          {column.title}
          
          {/* Styled count badge */}
          <span 
            className="text-sm font-bold px-2.5 py-0.5 rounded-full border"
            style={{ 
                backgroundColor: `${column.color}20`,
                color: column.color, // Text matches color
                borderColor: `${column.color}30`
            }}
          >
            {column.tasks.length}
          </span>
        </h3>
        <button
          className="p-2 touch-target rounded-full hover:bg-white/50 text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors"
          aria-label="タスクを追加"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Tasks Container */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[120px] md:min-h-[200px] md:max-h-[calc(100vh-200px)]"
      >
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-base text-(--color-text-muted) border-2 border-dashed border-(--color-border) rounded-xl">
            ドロップしてタスクを追加
          </div>
        )}
      </div>

      {/* Add Task Button */}
        <button
          onClick={() => onAddTask(column.id)}
          className="w-full py-3 mt-2 flex items-center justify-center gap-2 text-base font-bold text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-bg-glass) rounded-xl border-2 border-dashed border-(--color-border) transition-all active:scale-95"
        ><Plus className="w-5 h-5" />
        タスクを追加
      </button>
    </div>
  );
}
