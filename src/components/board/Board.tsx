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

  return (
    <DndContext
      id="kanban-board-dnd-context"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
