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
}

// Client-side only check using useSyncExternalStore
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function Board({ board, setBoard, onAddTask, onTaskMove, onTaskClick }: BoardProps) {
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
         <div className="flex md:hidden shrink-0 border-b border-gray-200 bg-white/50 backdrop-blur-sm overflow-x-auto no-scrollbar">
            {board.columns.map((col) => (
               <button
                 key={col.id}
                 onClick={() => setActiveTabId(col.id)}
                 className={cn(
                   "flex-1 min-w-[30%] px-2 py-3 text-sm font-medium whitespace-nowrap transition-colors relative flex items-center justify-center gap-2",
                   activeTabId === col.id ? "text-blue-600" : "text-gray-500"
                 )}
               >
                 {col.title}
                 <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100",
                    activeTabId === col.id ? "bg-blue-100 text-blue-700" : "text-gray-500"
                 )}>
                    {col.tasks.length}
                 </span>
                 {activeTabId === col.id && (
                    <motion.div 
                        layoutId="activeTab" 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" 
                    />
                 )}
               </button>
            ))}
         </div>

         {/* Board Content */}
         <div className="flex-1 overflow-hidden relative">
            {/* Desktop View: All Columns */}
            <div className="hidden md:flex gap-4 p-4 md:p-6 overflow-x-auto h-full items-start">
               {board.columns.map((column) => (
                 <Column
                   key={column.id}
                   column={column}
                   onAddTask={onAddTask}
                   onTaskClick={onTaskClick}
                 />
               ))}
            </div>

            {/* Mobile View: Single Tabbed Column */}
            <div className="md:hidden p-4 h-full overflow-y-auto">
               <AnimatePresence mode="wait">
                 {activeColumn && (
                   <motion.div
                     key={activeColumn.id}
                     initial={{ opacity: 0, x: 10 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -10 }}
                     transition={{ duration: 0.2 }}
                     className="h-full"
                   >
                     <Column
                       column={activeColumn}
                       onAddTask={onAddTask}
                       onTaskClick={onTaskClick}
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
