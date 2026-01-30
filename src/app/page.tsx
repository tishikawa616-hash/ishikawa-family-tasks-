"use client";
import { cn } from "@/lib/utils";

import { useState, useEffect, useCallback, useMemo } from "react";
import { LayoutGrid, Calendar as CalendarIcon, Search, LogOut, Filter } from "lucide-react";
import { Board, CalendarView, TaskModal } from "@/components/board";
import { BottomNav } from "@/components/layout/BottomNav";
import type { Board as BoardType, Task, Column } from "@/types/board";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { Field } from "@/types/field";

const INITIAL_COLUMNS: Column[] = [
  { id: "col-todo", title: "予定", tasks: [], color: "#0ea5e9" }, // Sky-500
  { id: "col-inprogress", title: "作業中", tasks: [], color: "#f97316" }, // Orange-500
  { id: "col-review", title: "確認待ち", tasks: [], color: "#8b5cf6" }, // Violet-500
  { id: "col-done", title: "完了", tasks: [], color: "#10b981" }, // Emerald-500
];

export default function Home() {
  const [currentView, setCurrentView] = useState<"board" | "calendar">("board");
  const [board, setBoard] = useState<BoardType>({ id: "board-1", title: "石川家タスクボード", columns: INITIAL_COLUMNS });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Field Filter State
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | "all">("all");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Fetch Fields
  useEffect(() => {
    const fetchFields = async () => {
      const { data } = await supabase.from("fields").select("*").order("name");
      if (data) {
        setFields(data.map(f => ({
            id: f.id,
            name: f.name,
            color: f.color,
            location: f.location,
            description: f.description
        })));
      }
    };
    fetchFields();
  }, [supabase]);

  const fetchTasks = useCallback(async () => {
    try {
      // Need to select field_id as well
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:assignee_id (
            id,
            email,
            display_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching tasks:", error);
        return;
      }

      if (tasks) {
        const newColumns = INITIAL_COLUMNS.map((col) => ({
          ...col,
          tasks: tasks
            .filter((t) => t.status === col.id)
            .map((t) => {
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               const assigneeData = t.assignee as any;
               return {
                  id: t.id,
                  title: t.title,
                  description: t.description,
                  priority: t.priority,
                  dueDate: t.due_date,
                  tags: t.tags || [],
                  assigneeId: t.assignee_id,
                  // Map field_id to fieldId
                  fieldId: t.field_id,
                  assignee: assigneeData ? {
                    id: assigneeData.id,
                    displayName: assigneeData.display_name || assigneeData.email,
                    avatarUrl: assigneeData.avatar_url,
                  } : undefined,
               };
            }),
        }));
        setBoard((prev) => ({ ...prev, columns: newColumns }));
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
        setIsLoading(false);
    }
  }, [supabase]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('tasks_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Realtime update:', payload);
          fetchTasks(); // Refresh data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchTasks]);

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSeedData = async () => {
    if (!confirm("モックデータをデータベースにインポートしますか？")) return;
    setIsLoading(true);
    try {
        const { seedMockData } = await import("@/lib/seed");
        const success = await seedMockData(supabase);
        if (success) {
            alert("データのインポートが完了しました");
            fetchTasks();
        } else {
            alert("インポートに失敗しました");
        }
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleTaskMoved = async (taskId: string, newStatus: string) => {
    console.log("[MOVE DEBUG] handleTaskMoved called with:", taskId, newStatus);
    
    // Optimistic update - move task to target column immediately
    setBoard((prev) => {
      console.log("[MOVE DEBUG] setBoard callback running");
      const sourceColumn = prev.columns.find((col) =>
        col.tasks.some((t) => t.id === taskId)
      );
      const targetColumn = prev.columns.find((col) => col.id === newStatus);
      
      console.log("[MOVE DEBUG] sourceColumn:", sourceColumn?.id, "targetColumn:", targetColumn?.id);
      
      if (!sourceColumn || !targetColumn || sourceColumn.id === targetColumn.id) {
        console.log("[MOVE DEBUG] Early return - no valid source/target");
        return prev;
      }
      
      const task = sourceColumn.tasks.find((t) => t.id === taskId);
      if (!task) return prev;
      
      console.log("[MOVE DEBUG] Moving task:", task.title, "from", sourceColumn.id, "to", targetColumn.id);
      
      return {
        ...prev,
        columns: prev.columns.map((col) => {
          if (col.id === sourceColumn.id) {
            return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
          }
          if (col.id === targetColumn.id) {
            return { ...col, tasks: [...col.tasks, { ...task, status: newStatus }] };
          }
          return col;
        }),
      };
    });
    
    // Persist to database
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) {
        console.error("Error updating task status:", error);
      }
    } catch (err) {
      console.error("Unexpected error updating task:", err);
    }
  };

  const openAddTaskModal = (columnId?: string) => {
    setEditingTask(null);
    setActiveColumnId(columnId);
    setIsModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!editingTask) return;
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", editingTask.id);
      if (error) throw error;

      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== editingTask.id),
        })),
      }));
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("タスクの削除に失敗しました。");
    }
  };

  const handleSaveTask = async (taskData: {
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    status: string;
    dueDate: string;
    assigneeId: string;
    tags: string[];
    fieldId?: string;
  }) => {
    try {
      if (editingTask) {
        // Update existing task
        const { error } = await supabase
          .from("tasks")
          .update({
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            status: taskData.status,
            due_date: taskData.dueDate || null,
            assignee_id: taskData.assigneeId || null,
            tags: taskData.tags,
            field_id: taskData.fieldId || null,
          })
          .eq("id", editingTask.id);

        if (error) throw error;

        // Update local state - re-fetch is safer for consistency but let's do simple update
        fetchTasks(); 

      } else {
        // Create new task
        const { error } = await supabase
          .from("tasks")
          .insert({
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            status: taskData.status,
            due_date: taskData.dueDate || null, // Handle empty date
            assignee_id: taskData.assigneeId || null,
            tags: taskData.tags, 
            field_id: taskData.fieldId || null,
          });

        if (error) throw error;
        
        fetchTasks();
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving task:", err);
      alert("タスクの保存に失敗しました。");
    }
  };

  // Filter Board Columns based on Selected Field
  const filteredBoard = useMemo(() => {
      if (selectedFieldId === "all") return board;

      return {
          ...board,
          columns: board.columns.map(col => ({
              ...col,
              tasks: col.tasks.filter(t => t.fieldId === selectedFieldId)
          }))
      };
  }, [board, selectedFieldId]);

  return (
    <div className="min-h-screen flex flex-col bg-(--color-bg-primary) text-(--color-text-primary)">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between bg-(--color-bg-glass)">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-(--color-accent-primary) p-1.5 rounded-lg">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-(--color-text-primary) hidden sm:block active:scale-95 transition-transform cursor-default">
              石川家タスクボード
            </h1>
          </div>
        </div>

        {/* View Switcher - Center */}
        <div className="hidden md:flex bg-(--color-bg-primary) rounded-xl p-1 border border-gray-200">
          <button
            onClick={() => setCurrentView("board")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              currentView === "board"
                ? "bg-white text-(--color-accent-primary) shadow-sm"
                : "text-(--color-text-primary) hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            ボード
          </button>
          <button
            onClick={() => setCurrentView("calendar")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              currentView === "calendar"
                ? "bg-white text-(--color-accent-primary) shadow-sm"
                : "text-(--color-text-primary) hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            カレンダー
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Field Filter Dropdown */}
          <div className="relative group">
             <div className="flex items-center gap-2 bg-(--color-bg-secondary) rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-200 transition-colors">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                    value={selectedFieldId}
                    onChange={(e) => setSelectedFieldId(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-(--color-text-primary) cursor-pointer appearance-none pr-4"
                >
                    <option value="all">すべての圃場</option>
                    {fields.map(field => (
                        <option key={field.id} value={field.id}>{field.name}</option>
                    ))}
                </select>
             </div>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-(--color-bg-secondary) rounded-lg px-3 py-1.5 w-64 mr-2 border border-transparent focus-within:border-(--color-accent-primary) transition-colors">
            <Search className="w-4 h-4 text-(--color-text-muted)" />
            <input
              type="text"
              placeholder="検索"
              className="bg-transparent border-none outline-none text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) w-full"
            />
          </div>
          
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
            title="ログアウト"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-(--color-accent-primary) to-(--color-accent-secondary) flex items-center justify-center text-white text-xs font-bold ring-2 ring-white cursor-pointer">
            IS
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative pb-20 md:pb-0 flex flex-col">
        {/* Weather Widget Section */}
        {currentView === "board" && (
            <div className="px-4 pt-4 md:px-6 shrink-0">
                <WeatherWidget />
            </div>
        )}

        {currentView === "board" ? (
          <Board
            board={filteredBoard}
            setBoard={setBoard}
            onAddTask={openAddTaskModal}
            onTaskMove={handleTaskMoved}
            onTaskClick={handleTaskClick}
            onStatusChange={handleTaskMoved}
          />
        ) : (
          <CalendarView board={filteredBoard} />
        )}
        
        {/* Empty State / Seed Button Helper */}
        {!isLoading && board.columns.every(col => col.tasks.length === 0) && (
             <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-40">
                <button 
                    onClick={handleSeedData}
                    className="bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-full shadow-lg hover:bg-white hover:text-blue-600 transition-all text-sm font-medium flex items-center gap-2"
                >
                    <span>🌱 サンプルデータを投入</span>
                </button>
             </div>
        )}
      </main>

      {/* Mobile FAB */}
      <button
        onClick={() => openAddTaskModal()}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-(--color-accent-primary) text-white shadow-lg hover:shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center md:hidden z-50 active:scale-95 touch-target"
        aria-label="タスクを追加"
      >
        <span className="text-3xl font-light leading-none mb-1">+</span>
      </button>

      {/* Bottom Navigation */}
      <BottomNav currentView={currentView} onChangeView={setCurrentView} />

      {/* Add/Edit Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveTask}
        onDelete={handleDeleteTask}
        columns={board.columns}
        initialStatus={activeColumnId}
        initialData={editingTask || undefined}
      />
    </div>
  );
}
