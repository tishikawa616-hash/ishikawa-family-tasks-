"use client";

import { useState, useRef, PointerEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { GripVertical, Calendar, Tag, Check, Play, Clock, User } from "lucide-react";
import type { Task } from "@/types/board";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  currentColumnId?: string;
  isDragging?: boolean;
  onClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

const priorityConfig = {
  high: { color: "bg-red-500", text: "text-red-600", bg: "bg-red-50" },
  medium: { color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" },
  low: { color: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" },
};

const STATUS_ORDER = ["col-todo", "col-inprogress", "col-review", "col-done"];

const STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  "col-todo": { label: "予定", icon: <Clock className="w-5 h-5" />, color: "#3b82f6" },
  "col-inprogress": { label: "作業中", icon: <Play className="w-5 h-5" />, color: "#f97316" },
  "col-review": { label: "確認待ち", icon: <Clock className="w-5 h-5" />, color: "#8b5cf6" },
  "col-done": { label: "完了", icon: <Check className="w-5 h-5" />, color: "#10b981" },
};

export function TaskCard({ task, currentColumnId, isDragging, onClick, onStatusChange }: TaskCardProps) {
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
  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const swipeThreshold = 80;
  const cardRef = useRef<HTMLDivElement>(null);

  const actualStatus = currentColumnId || task.status || "col-todo";
  const currentIndex = STATUS_ORDER.indexOf(actualStatus);
  const nextStatus = currentIndex < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIndex + 1] : null;
  const prevStatus = currentIndex > 0 ? STATUS_ORDER[currentIndex - 1] : null;

  const bgColor = useTransform(x, [-150, 0, 150], [
    prevStatus ? STATUS_LABELS[prevStatus]?.color || "#f8fafc" : "#f8fafc",
    "#ffffff",
    nextStatus ? STATUS_LABELS[nextStatus]?.color || "#f8fafc" : "#f8fafc",
  ]);

  const bgOpacity = useTransform(x, [-150, -50, 0, 50, 150], [1, 0.5, 0, 0.5, 1]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    setSwiping(false);
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    // Require more horizontal movement to start swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 15) {
      setSwiping(true);
      x.set(deltaX);
      e.preventDefault();
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    cardRef.current?.releasePointerCapture(e.pointerId);
    const currentX = x.get();
    if (currentX > swipeThreshold && nextStatus) {
      onStatusChange?.(task.id, nextStatus);
    } else if (currentX < -swipeThreshold && prevStatus) {
      onStatusChange?.(task.id, prevStatus);
    }
    animate(x, 0, { duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }); // Spring-like return
    pointerStartRef.current = null;
    setSwiping(false);
  };

  const handlePointerCancel = () => {
    animate(x, 0, { duration: 0.2 });
    pointerStartRef.current = null;
    setSwiping(false);
  };

  const leftSideHint = nextStatus ? STATUS_LABELS[nextStatus] : null;
  const rightSideHint = prevStatus ? STATUS_LABELS[prevStatus] : null;
  const priority = priorityConfig[task.priority || "low"];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group mb-3 select-none",
        dragging && "z-50"
      )}
      {...attributes}
    >
      {/* Background Layer (Swipe Hint) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-between px-6 rounded-2xl"
        style={{ backgroundColor: bgColor, opacity: bgOpacity }}
      >
        <div className="flex items-center gap-2 text-white font-bold">
          {leftSideHint && <>{leftSideHint.icon}<span className="text-sm">{leftSideHint.label}</span></>}
        </div>
        <div className="flex items-center gap-2 text-white font-bold">
          {rightSideHint && <><span className="text-sm">{rightSideHint.label}</span>{rightSideHint.icon}</>}
        </div>
      </motion.div>

      {/* Card Content - Neo Light Design */}
      <motion.div
        ref={cardRef}
        style={{ x, touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={() => !swiping && onClick?.(task)}
        className={cn(
          "bg-white/90 backdrop-blur-sm p-4 cursor-pointer",
          "rounded-2xl border border-gray-100",
          "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]", // Soft shadow
          "transition-all duration-300",
          dragging ? "shadow-xl scale-105 rotate-1 border-blue-200" : "hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5"
        )}
      >
        <div className="flex gap-3">
          {/* Left Indicator Strip (Priority) */}
          <div className={cn("w-1 rounded-full self-stretch shrink-0", priority.color)} />

          <div className="flex-1 min-w-0 flex flex-col gap-2">
            
            {/* Header: Title & Menu */}
            <div className="flex items-start justify-between gap-2">
               <h4 className="text-[17px] font-bold text-gray-800 leading-snug tracking-tight">
                {task.title}
               </h4>
               <div 
                 data-drag-handle 
                 className="cursor-grab active:cursor-grabbing p-1 -mr-2 -mt-1 text-gray-300 hover:text-gray-400 touch-none" 
                 {...listeners}
               >
                 <GripVertical className="w-5 h-5" />
               </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-[14px] text-gray-500 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Footer: Meta Info */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {task.dueDate && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-500">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {new Date(task.dueDate).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                </div>
              )}
              
              {task.tags?.slice(0, 2).map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}

              {task.assignee?.displayName && (
                <div className="ml-auto pl-2">
                  <div className="w-7 h-7 rounded-full bg-linear-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-2 border-white shadow-sm" title={`担当者: ${task.assignee.displayName}`}>
                    {task.assignee.avatarUrl ? (
                        <img src={task.assignee.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : ( 
                        <span className="text-[10px] font-bold text-indigo-600">
                            {task.assignee.displayName.slice(0, 2)}
                        </span>
                    )}
                  </div>
                </div>
              )}
              
              {!task.assignee && (
                 <div className="ml-auto pl-2">
                    <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 text-gray-300">
                        <User className="w-3.5 h-3.5" />
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
