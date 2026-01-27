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
        backgroundColor: column.color 
          ? `${column.color}15` // 15 = approx 8% opacity in hex
          : "rgba(241, 245, 249, 0.5)" // Default fallback
      }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-(--color-border)">
        <h3 className="font-bold text-(--color-text-primary) flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full ring-2 ring-(--color-accent-primary)"
            style={{ backgroundColor: column.color }}
          />
          {column.title}
          <span className="text-xs font-normal text-(--color-text-muted) bg-(--color-bg-secondary) px-2 py-0.5 rounded-full border border-(--color-border)">
            {column.tasks.length}
          </span>
        </h3>
        <button
          className="p-2 touch-target rounded-md hover:bg-(--color-bg-glass) text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors"
          aria-label="タスクを追加"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="w-5 h-5" />
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
          <div className="flex items-center justify-center h-20 text-sm text-(--color-text-muted) border-2 border-dashed border-(--color-border) rounded-lg">
            ドロップしてタスクを追加
          </div>
        )}
      </div>

      {/* Add Task Button */}
        <button
          onClick={() => onAddTask(column.id)}
          className="w-full py-2.5 mt-2 flex items-center justify-center gap-2 text-sm font-medium text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-bg-glass) rounded-xl border border-dashed border-(--color-border) transition-all active:scale-95"
        ><Plus className="w-4 h-4" />
        タスクを追加
      </button>
    </div>
  );
}
