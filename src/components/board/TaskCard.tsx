"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar, Tag } from "lucide-react";
import type { Task } from "@/types/board";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: (task: Task) => void;
}

const priorityColors = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-emerald-500",
};

export function TaskCard({ task, isDragging, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick?.(task)}
      className={cn(
        "glass-card p-3 cursor-grab active:cursor-grabbing",
        "border-l-4",
        priorityColors[task.priority || "low"],
        dragging && "opacity-50 scale-105 shadow-lg rotate-2",
        "group"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          className="w-4 h-4 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-[var(--color-text-primary)] leading-tight">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {task.dueDate && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {task.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-full bg-[var(--color-bg-glass)] text-[var(--color-text-secondary)]"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {task.assignee?.displayName && (
              <div className="ml-auto flex items-center gap-1" title={`担当者: ${task.assignee.displayName}`}>
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold ring-1 ring-white">
                  {task.assignee.avatarUrl ? (
                     <img src={task.assignee.avatarUrl} alt={task.assignee.displayName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    task.assignee.displayName.slice(0, 2)
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
