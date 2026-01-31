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
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

export function Column({ column, onAddTask, onTaskClick, onStatusChange }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      className={cn(
        "flex flex-col w-full md:w-80 shrink-0",
        "bg-transparent transition-colors", // Transparent bg
        isOver && "bg-blue-50/50 rounded-xl"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-3 mb-2">
        <h3 className="font-bold text-lg text-gray-700 flex items-center gap-3">
          {/* Circular Indicator */}
          <div 
             className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
             style={{ backgroundColor: column.color }}
          />
          {column.title}
          
          {/* Subtle Counter */}
          <span className="text-xs font-medium text-gray-400 bg-white/50 px-2 py-0.5 rounded-full ml-1">
            {column.tasks.length}
          </span>
        </h3>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 text-gray-400 hover:text-blue-600 transition-colors"
          aria-label="タスクを追加"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Tasks Container - Remove heavy borders, let cards float */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-3 overflow-y-auto px-1 min-h-[150px] pb-24 md:pb-4"
      >
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} currentColumnId={column.id} onClick={() => onTaskClick?.(task)} onStatusChange={onStatusChange} />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <div 
            onClick={() => onAddTask(column.id)}
            className="flex flex-col items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-200/60 rounded-2xl cursor-pointer hover:bg-white/40 hover:border-blue-200 transition-all group"
          >
             <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                 <Plus className="w-5 h-5" />
             </div>
             <span className="text-sm font-medium">タスクを追加</span>
          </div>
        )}
      </div>
    </div>
  );
}
