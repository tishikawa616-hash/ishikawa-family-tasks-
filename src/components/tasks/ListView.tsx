"use client";

import { useState } from "react";
import { Task, Column } from "@/types/board";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ListViewProps {
  columns: Column[];
  onAddTask: (status?: string) => void;
  onTaskClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onLoadMoreDone?: () => void;
}

export function ListView({ columns, onAddTask, onTaskClick, onStatusChange, onLoadMoreDone }: ListViewProps) {
  const [activeTab, setActiveTab] = useState<"todo" | "done">("todo");

  // Filter tasks into Todo (everything not done) and Done
  const todoTasks = columns.flatMap(col => col.id !== "col-done" ? col.tasks : []);
  const doneTasks = columns.find(col => col.id === "col-done")?.tasks || [];

  return (
    <div className="flex flex-col h-full w-full bg-gray-50/50">
      {/* Tab Switcher */}
      <div className="flex shrink-0 items-center justify-center p-4 bg-white border-b border-gray-100 shadow-sm z-10">
        <div className="flex bg-gray-100/80 p-1.5 rounded-2xl max-w-sm w-full relative">
          <button
            onClick={() => setActiveTab("todo")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-base font-bold transition-all duration-300 z-10",
              activeTab === "todo" ? "text-blue-600 shadow-md bg-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            )}
          >
            やること
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full ml-1 font-semibold",
              activeTab === "todo" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"
            )}>
              {todoTasks.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab("done")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-base font-bold transition-all duration-300 z-10",
              activeTab === "done" ? "text-emerald-600 shadow-md bg-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            )}
          >
            終わったこと
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full ml-1 font-semibold",
              activeTab === "done" ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-500"
            )}>
              {doneTasks.length}
            </span>
          </button>
        </div>
      </div>

      {/* Task List Content */}
      <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-4 py-6 md:py-8 min-h-0 space-y-4">
        {activeTab === "todo" ? (
          <>
            {todoTasks.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle2 className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-medium text-lg text-gray-500">やることクリア！</p>
                  <p className="text-sm mt-1">新しいタスクを追加しましょう</p>
               </div>
            ) : (
                todoTasks.map(task => (
                    <SimplifiedTaskCard 
                        key={task.id} 
                        task={task} 
                        onClick={() => onTaskClick?.(task)}
                        onToggleDone={() => onStatusChange?.(task.id, "col-done")}
                        isDone={false}
                    />
                ))
            )}
            
            <button 
                onClick={() => onAddTask("col-todo")}
                className="w-full mt-4 py-4 md:py-5 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:text-blue-500 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex items-center justify-center gap-2 font-bold text-lg cursor-pointer"
            >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500">
                    <span className="text-xl leading-none">+</span>
                </div>
                新しいタスクを追加
            </button>
          </>
        ) : (
          <>
             {doneTasks.map(task => (
                 <SimplifiedTaskCard 
                     key={task.id} 
                     task={task} 
                     onClick={() => onTaskClick?.(task)}
                     onToggleDone={() => onStatusChange?.(task.id, "col-todo")}
                     isDone={true}
                 />
             ))}
             {doneTasks.length > 0 && onLoadMoreDone && (
                  <button 
                      onClick={onLoadMoreDone}
                      className="w-full mt-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold transition-colors"
                  >
                      もっと読み込む...
                  </button>
             )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Simplified Task Card (Checklist Style)
// ---------------------------------------------------------
interface SimplifiedTaskCardProps {
    task: Task;
    onClick: () => void;
    onToggleDone: () => void;
    isDone: boolean;
}

function SimplifiedTaskCard({ task, onClick, onToggleDone, isDone }: SimplifiedTaskCardProps) {
    return (
        <div 
           className={cn(
               "flex items-center gap-4 p-4 md:p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all group cursor-pointer",
               isDone && "bg-gray-50/50 border-transparent shadow-none"
           )}
        >
            {/* Checkbox Target Area (Large) */}
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
                className={cn(
                    "shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    isDone 
                        ? "bg-emerald-100 text-emerald-500 hover:bg-emerald-200/80" 
                        : "bg-gray-100 text-gray-300 hover:bg-blue-50 hover:text-blue-400 border-2 border-transparent hover:border-blue-200"
                )}
            >
                {isDone ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
            </button>

            {/* Content Area */}
            <div className="flex-1 min-w-0" onClick={onClick}>
                <h4 className={cn(
                    "text-lg md:text-xl font-bold text-gray-800 truncate mb-1",
                    isDone && "text-gray-400 line-through"
                )}>
                    {task.title}
                </h4>
                
                <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                    {/* Date / Time Context */}
                    {task.dueDate && (
                        <span className={cn(
                            "px-2.5 py-1 rounded-lg bg-gray-100",
                            !isDone && isTaskOverdue(task.dueDate) && "bg-red-50 text-red-600",
                            !isDone && isTaskToday(task.dueDate) && "bg-orange-50 text-orange-600"
                        )}>
                            {formatShortDate(task.dueDate)}
                        </span>
                    )}
                    
                    {/* Assignee Avatar (Single for simplicity, or count) */}
                    {task.assignees && task.assignees.length > 0 && (
                        <div className="flex items-center gap-1.5 ml-auto">
                            <Image 
                                src={task.assignees[0].avatarUrl || 'https://ui-avatars.com/api/?name=User&background=random'} 
                                alt="Assignee" 
                                width={28}
                                height={28}
                                className={cn("rounded-full object-cover", isDone && "opacity-50 grayscale")}
                            />
                            {task.assignees.length > 1 && (
                                <span className="text-xs font-bold text-gray-400">+{task.assignees.length - 1}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helpers
function isTaskOverdue(isoString: string) {
    const dueDate = new Date(isoString);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
}

function isTaskToday(isoString: string) {
    const dueDate = new Date(isoString);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
}

function formatShortDate(isoString: string) {
    const d = new Date(isoString);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}
