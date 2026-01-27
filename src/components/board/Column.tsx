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
        "flex flex-col w-72 flex-shrink-0",
        "rounded-xl",
        "border border-[var(--color-border)]",
        "backdrop-blur-sm transition-colors",
        isOver && "ring-2 ring-[var(--color-accent-primary)] ring-opacity-50"
      )}
      style={{
        backgroundColor: column.color 
          ? `${column.color}15` // 15 = approx 8% opacity in hex
          : "rgba(241, 245, 249, 0.5)" // Default fallback
      }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color || "#64748b" }}
          />
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
            {column.title}
          </h3>
          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-glass)] px-2 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        <button
          className="p-1 rounded-md hover:bg-[var(--color-bg-glass)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="タスクを追加"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks Container */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-200px)]"
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
          <div className="flex items-center justify-center h-24 text-sm text-[var(--color-text-muted)] border-2 border-dashed border-[var(--color-border)] rounded-lg">
            ドロップしてタスクを追加
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <button 
        onClick={() => onAddTask(column.id)}
        className="flex items-center gap-2 p-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-glass)] transition-colors rounded-b-xl border-t border-[var(--color-border)]"
      >
        <Plus className="w-4 h-4" />
        タスクを追加
      </button>
    </div>
  );
}
