"use client";
import { cn } from "@/lib/utils";

import { useState, useEffect, useCallback } from "react";
import { LayoutGrid, Calendar as CalendarIcon, Search, Bell, LogOut } from "lucide-react";
import { Board, CalendarView, TaskModal } from "@/components/board";
import type { Board as BoardType, Task, Column } from "@/types/board";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const fetchTasks = useCallback(async () => {
    try {
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
    // Optimistic update is handled by Board component's setBoard
    // We just need to persist the change
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) {
        console.error("Error updating task status:", error);
        // Revert or show error (for simplistic approach, just log)
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
          })
          .eq("id", editingTask.id);

        if (error) throw error;

        // Update local state
        const updatedTask = { ...editingTask, ...taskData, tags: editingTask.tags || [] };
        
        setBoard((prev) => ({
          ...prev,
          columns: prev.columns.map((col) => {
            // Remove from old column if status changed (or just filter out to be safe)
            // Then add to new column (or update in place if same)
            
            // Simplified approach: Remove from all columns, then add to target column
            const cleanTasks = col.tasks.filter(t => t.id !== editingTask.id);
            
            if (col.id === taskData.status) {
                // Determine insertion (append for now, or maintain order if we cared more)
                return { ...col, tasks: [...cleanTasks, updatedTask] };
            }
            return { ...col, tasks: cleanTasks };
          }),
        }));

      } else {
        // Create new task
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            status: taskData.status,
            due_date: taskData.dueDate || null, // Handle empty date
            assignee_id: taskData.assigneeId || null,
            tags: [], 
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const newTask: Task = {
            id: data.id,
            title: data.title,
            description: data.description,
            priority: data.priority,
            dueDate: data.due_date,
            tags: data.tags || [],
          };

          setBoard((prev) => ({
            ...prev,
            columns: prev.columns.map((col) => {
              if (col.id === taskData.status) {
                return {
                  ...col,
                  tasks: [...col.tasks, newTask],
                };
              }
              return col;
            }),
          }));
        }
      }
    } catch (err) {
      console.error("Error saving task:", err);
      alert("タスクの保存に失敗しました。");
    }
  };

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
        <div className="flex bg-(--color-bg-primary) rounded-xl p-1 border border-gray-200">
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
          <div className="hidden md:flex items-center gap-2 bg-(--color-bg-secondary) rounded-lg px-3 py-1.5 w-64 mr-2 border border-transparent focus-within:border-(--color-accent-primary) transition-colors">
            <Search className="w-4 h-4 text-(--color-text-muted)" />
            <input
              type="text"
              placeholder="検索"
              className="bg-transparent border-none outline-none text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) w-full"
            />
          </div>
          <button
            className="relative p-2 rounded-xl text-(--color-text-muted) hover:text-(--color-text-secondary) hover:bg-(--color-bg-secondary) transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-(--color-accent-danger) rounded-full border-2 border-white" />
          </button>
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
      <main className="flex-1 overflow-hidden relative">
        {currentView === "board" ? (
          <Board
            board={board}
            setBoard={setBoard}
            onAddTask={openAddTaskModal}
            onTaskMove={handleTaskMoved}
            onTaskClick={handleTaskClick}
          />
        ) : (
          <CalendarView board={board} />
        )}
        
        {/* Empty State / Seed Button Helper */}
        {/* Only show if loading is done, columns are empty (except structure), and we want to offer help */}
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
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-(--color-accent-primary) text-white shadow-lg hover:shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center md:hidden z-50 active:scale-95 touch-target safe-bottom"
        aria-label="タスクを追加"
      >
        <span className="text-3xl font-light leading-none mb-1">+</span>
      </button>

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
