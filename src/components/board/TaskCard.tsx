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
        "bg-white p-4 cursor-grab active:cursor-grabbing hover:bg-gray-50",
        "rounded-[20px] shadow-sm border border-gray-100", // Pop card shape
        "transition-all duration-200 active:scale-[0.98]", // Bouncy interaction
        "border-l-[6px]", // Thicker priority accent
        priorityColors[task.priority || "low"],
        dragging && "opacity-50 scale-105 shadow-xl rotate-2",
        "group relative overflow-hidden"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-3">
        <GripVertical
          className="w-5 h-5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-bold text-gray-800 leading-tight mb-1.5">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-auto">
            {task.dueDate && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(task.dueDate).toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {task.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-600"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {task.assignee?.displayName && (
              <div className="ml-auto flex items-center gap-1" title={`担当者: ${task.assignee.displayName}`}>
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold ring-2 ring-white shadow-sm">
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
