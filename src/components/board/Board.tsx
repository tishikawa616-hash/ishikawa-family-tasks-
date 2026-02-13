"use client";

import { useState, useSyncExternalStore } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { Board as BoardType, Task, Column as ColumnType } from "@/types/board";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface BoardProps {
  board: BoardType;
  setBoard: React.Dispatch<React.SetStateAction<BoardType>>;
  onAddTask: (columnId?: string) => void;
  onTaskMove: (taskId: string, newStatus: string) => void;
  onTaskClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onLoadMore?: () => void;
}

// Client-side only check using useSyncExternalStore
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function Board({ board, setBoard, onAddTask, onTaskMove, onTaskClick, onStatusChange, onLoadMore }: BoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Use useSyncExternalStore for SSR-safe client detection (no hydration mismatch)
  const isMounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  // Sensors for different input methods (mouse, touch, keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumnByTaskId = (taskId: string): ColumnType | undefined => {
    return board.columns.find((col) =>
      col.tasks.some((task) => task.id === taskId)
    );
  };

  const findTaskById = (taskId: string): Task | undefined => {
    for (const col of board.columns) {
      const task = col.tasks.find((t) => t.id === taskId);
      if (task) return task;
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTaskById(active.id as string);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnByTaskId(activeId);
    const overColumn =
      findColumnByTaskId(overId) ||
      board.columns.find((col) => col.id === overId);

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
      return;
    }

    setBoard((prev) => {
      const activeTask = activeColumn.tasks.find((t) => t.id === activeId);
      if (!activeTask) return prev;

      return {
        ...prev,
        columns: prev.columns.map((col) => {
          if (col.id === activeColumn.id) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== activeId),
            };
          }
          if (col.id === overColumn.id) {
            const overTaskIndex = col.tasks.findIndex((t) => t.id === overId);
            const insertIndex =
              overTaskIndex >= 0 ? overTaskIndex : col.tasks.length;
            const newTasks = [...col.tasks];
            newTasks.splice(insertIndex, 0, activeTask);
            return {
              ...col,
              tasks: newTasks,
            };
          }
          return col;
        }),
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeColumn = findColumnByTaskId(activeId);
    const overColumn = findColumnByTaskId(overId);

    if (!activeColumn || !overColumn) return;

    if (activeColumn.id === overColumn.id) {
      // Reorder within the same column
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => {
          if (col.id !== activeColumn.id) return col;

          const oldIndex = col.tasks.findIndex((t) => t.id === activeId);
          const newIndex = col.tasks.findIndex((t) => t.id === overId);

          return {
            ...col,
            tasks: arrayMove(col.tasks, oldIndex, newIndex),
          };
        }),
      }));
    }

    if (activeColumn && activeColumn.id) {
       onTaskMove(activeId, activeColumn.id);
    }
  };

  // State for mobile tabs
  const [activeTabId, setActiveTabId] = useState("col-todo");

  if (!isMounted) {
    return (
      <div className="flex gap-4 p-4 md:p-6 overflow-x-auto md:overflow-x-auto overflow-y-auto min-h-[calc(100vh-80px)] mobile-column-stack">
        {board.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            onAddTask={onAddTask}
            onTaskClick={onTaskClick}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    );
  }

  const activeColumn = board.columns.find((col) => col.id === activeTabId);

  return (
    <DndContext
      id="kanban-board-dnd-context"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full w-full">
         {/* Mobile Tab Bar */}
         <div className="flex md:hidden shrink-0 items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-md overflow-x-auto no-scrollbar snap-x">
            {board.columns.map((col) => {
               const isActive = activeTabId === col.id;
               // Default colors if not specified
               const activeColor = col.color || "#3b82f6";
               
               return (
               <button
                 key={col.id}
                 onClick={() => setActiveTabId(col.id)}
                 className={cn(
                   "relative flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 font-bold text-sm whitespace-nowrap snap-center shrink-0",
                   isActive ? "text-white shadow-lg shadow-blue-500/20 scale-105" : "text-gray-500 hover:bg-gray-50"
                 )}
                 style={{
                    backgroundColor: isActive ? activeColor : "transparent",
                 }}
               >
                 <span>{col.title}</span>
                 <span className={cn(
                    "flex items-center justify-center w-5 h-5 text-[10px] rounded-full",
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                 )}>
                    {col.tasks.length}
                 </span>
                 {isActive && (
                    <motion.div 
                        layoutId="activeTabGlow" 
                        className="absolute inset-0 rounded-full bg-white/20" 
                        transition={{ duration: 0.2 }}
                    />
                 )}
               </button>
            )})}
         </div>

         {/* Board Content */}
         <div className="flex-1 overflow-hidden relative min-h-0">
            {/* Desktop View: All Columns */}
            <div className="hidden md:flex gap-4 p-4 md:p-6 overflow-x-auto h-full">
               {board.columns.map((column) => (
                 <Column
                   key={column.id}
                   column={column}
                   onAddTask={onAddTask}
                   onTaskClick={onTaskClick}
                   onStatusChange={onStatusChange}
                   onLoadMore={column.id === "col-done" ? onLoadMore : undefined}
                 />
               ))}
            </div>

             {/* Mobile View: Single Tabbed Column */}
             <div className="md:hidden p-4 h-full overflow-y-auto no-scrollbar">
               <AnimatePresence mode="wait" custom={board.columns.findIndex(c => c.id === activeTabId)}>
                 {activeColumn && (
                   <motion.div
                     key={activeColumn.id}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     transition={{ duration: 0.2 }}
                     className="h-full touch-pan-y" // Allow vertical scrolling
                   >
                     <Column
                       column={activeColumn}
                       onAddTask={onAddTask}
                       onTaskClick={onTaskClick}
                       onStatusChange={onStatusChange}
                       onLoadMore={activeColumn.id === "col-done" ? onLoadMore : undefined}
                     />
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          </div>
       </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
