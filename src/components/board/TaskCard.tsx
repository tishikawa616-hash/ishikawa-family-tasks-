"use client";

import { useState, useRef, PointerEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { GripVertical, Calendar, Tag, Check, Play, Clock } from "lucide-react";
import type { Task } from "@/types/board";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

const priorityColors = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-emerald-500",
};

// Status progression order
const STATUS_ORDER = ["col-todo", "col-inprogress", "col-review", "col-done"];

const STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  "col-todo": { label: "予定", icon: <Clock className="w-5 h-5" />, color: "#0ea5e9" },
  "col-inprogress": { label: "作業中", icon: <Play className="w-5 h-5" />, color: "#f97316" },
  "col-review": { label: "確認待ち", icon: <Clock className="w-5 h-5" />, color: "#8b5cf6" },
  "col-done": { label: "完了", icon: <Check className="w-5 h-5" />, color: "#10b981" },
};

export function TaskCard({ task, isDragging, onClick, onStatusChange }: TaskCardProps) {
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

  // Swipe state using Pointer Events (works for both mouse and touch)
  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const swipeThreshold = 80;
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate next/prev status
  const currentIndex = STATUS_ORDER.indexOf(task.status || "col-todo");
  const nextStatus = currentIndex < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIndex + 1] : null;
  const prevStatus = currentIndex > 0 ? STATUS_ORDER[currentIndex - 1] : null;

  // Background color based on swipe direction
  const bgColor = useTransform(x, [-150, 0, 150], [
    prevStatus ? STATUS_LABELS[prevStatus]?.color || "#eee" : "#eee",
    "#ffffff",
    nextStatus ? STATUS_LABELS[nextStatus]?.color || "#eee" : "#eee",
  ]);

  const bgOpacity = useTransform(x, [-150, -50, 0, 50, 150], [1, 0.5, 0, 0.5, 1]);

  // Pointer Events handlers (work for both mouse and touch)
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Ignore if clicking on the drag handle
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
      return;
    }
    
    pointerStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    setSwiping(false);
    
    // Capture pointer for tracking outside element
    cardRef.current?.setPointerCapture(e.pointerId);
    console.log("[SWIPE DEBUG] Pointer down at:", e.clientX);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    
    // Only trigger swipe if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setSwiping(true);
      x.set(deltaX);
      e.preventDefault();
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    
    // Release pointer capture
    cardRef.current?.releasePointerCapture(e.pointerId);
    
    const currentX = x.get();
    console.log("[SWIPE DEBUG] Pointer up, currentX:", currentX, "threshold:", swipeThreshold);
    
    if (currentX > swipeThreshold && nextStatus) {
      console.log("[SWIPE DEBUG] Triggering status change to:", nextStatus);
      onStatusChange?.(task.id, nextStatus);
    } else if (currentX < -swipeThreshold && prevStatus) {
      console.log("[SWIPE DEBUG] Triggering status change to:", prevStatus);
      onStatusChange?.(task.id, prevStatus);
    } else {
      console.log("[SWIPE DEBUG] Threshold not met");
    }
    
    // Animate back to original position
    animate(x, 0, { duration: 0.2 });
    pointerStartRef.current = null;
    setSwiping(false);
  };

  const handlePointerCancel = () => {
    animate(x, 0, { duration: 0.2 });
    pointerStartRef.current = null;
    setSwiping(false);
  };

  // Swipe hint icons
  const leftHintIcon = prevStatus ? STATUS_LABELS[prevStatus] : null;
  const rightHintIcon = nextStatus ? STATUS_LABELS[nextStatus] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative overflow-hidden rounded-[20px]",
        dragging && "opacity-50 scale-105 shadow-xl rotate-2"
      )}
      {...attributes}
    >
      {/* Background Layer (Swipe Hint) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-between px-6 rounded-[20px]"
        style={{ backgroundColor: bgColor, opacity: bgOpacity }}
      >
        {/* Left Hint (Prev Status) */}
        <div className="flex items-center gap-2 text-white font-bold">
          {leftHintIcon && (
            <>
              {leftHintIcon.icon}
              <span className="text-sm">{leftHintIcon.label}</span>
            </>
          )}
        </div>
        {/* Right Hint (Next Status) */}
        <div className="flex items-center gap-2 text-white font-bold">
          {rightHintIcon && (
            <>
              <span className="text-sm">{rightHintIcon.label}</span>
              {rightHintIcon.icon}
            </>
          )}
        </div>
      </motion.div>

      {/* Card Content (Swipeable via Pointer Events) */}
      <motion.div
        ref={cardRef}
        style={{ x, touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={() => !swiping && onClick?.(task)}
        className={cn(
          "bg-white p-4 cursor-pointer hover:bg-gray-50",
          "rounded-[20px] shadow-sm border border-gray-100",
          "transition-shadow duration-200 active:scale-[0.98]",
          "border-l-[6px]",
          priorityColors[task.priority || "low"],
          "group relative select-none"
        )}
      >
        {/* Version Indicator - PURPLE means pointer events version */}
        <div className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full opacity-70 pointer-events-none z-10" />
        <div className="flex items-start gap-3">
          {/* Drag Handle - Only this part triggers Sortable Drag */}
          <div data-drag-handle className="cursor-grab active:cursor-grabbing touch-none px-1" {...listeners}>
            <GripVertical
              className="w-5 h-5 text-gray-300 opacity-100 mt-1"
            />
          </div>
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
      </motion.div>
    </div>
  );
}
