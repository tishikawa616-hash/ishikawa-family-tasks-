"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { TaskForm } from "@/components/tasks/TaskForm";
import { createClient } from "@/lib/supabase/client";
import { Column, Task } from "@/types/board";

const INITIAL_COLUMNS: Column[] = [
  { id: "col-todo", title: "予定", tasks: [], color: "#3b82f6" },
  { id: "col-inprogress", title: "作業中", tasks: [], color: "#f97316" },
  { id: "col-review", title: "確認待ち", tasks: [], color: "#8b5cf6" },
  { id: "col-done", title: "完了", tasks: [], color: "#10b981" },
];

export default function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const { id } = use(params);
  
  const router = useRouter();
  const supabase = createClient();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      const { data, error } = await supabase
        .from("task_tasks")
        .select(`
          *,
          recurrence_type,
          recurrence_interval,
          recurrence_end_date,
          assignee:assignee_id (
            id,
            email,
            display_name,
            avatar_url
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching task:", error);
        router.push("/");
        return;
      }

      // Map snake_case to camelCase
      const mappedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.due_date,
        assigneeId: data.assignee_id,
        assignee: data.assignee,
        fieldId: data.field_id,
        tags: data.tags || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        recurrenceType: data.recurrence_type,
        recurrenceInterval: data.recurrence_interval,
        recurrenceEndDate: data.recurrence_end_date,
      };

      setTask(mappedTask);
      setIsLoading(false);
    };

    fetchTask();
  }, [id, supabase, router]);

  const handleSubmit = async (taskData: {
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    status: string;
    dueDate: string;
    assigneeId: string;
    tags: string[];
    fieldId?: string;
    recurrence?: {
      type: "daily" | "weekly" | "monthly";
      interval: number;
      endDate?: string;
    };
  }) => {
    try {
      const { error } = await supabase
        .from("task_tasks")
        .update({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          due_date: taskData.dueDate || null,
          assignee_id: taskData.assigneeId || null,
          tags: taskData.tags,
          field_id: taskData.fieldId || null,
          recurrence_type: taskData.recurrence?.type || null,
          recurrence_interval: taskData.recurrence?.interval || null,
          recurrence_end_date: taskData.recurrence?.endDate || null,
        })
        .eq("id", id);

      if (error) throw error;
      
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Error updating task:", err);
      console.error("Error updating task:", err);
      // alert("タスクの更新に失敗しました");
      alert(`タスクの更新に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("task_tasks").delete().eq("id", id);
    if (!error) {
      router.push("/");
      router.refresh();
    }
  };

  if (isLoading) return <div className="min-h-screen bg-white flex items-center justify-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-white pb-safe-bottom">
      {/* Mobile Page Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3 safe-p-top shadow-sm">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">タスク編集</h1>
      </div>

      <div className="premium-container">
        <TaskForm 
          isPageMode={true}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          onCancel={() => router.back()}
          columns={INITIAL_COLUMNS}
          initialData={task!}
          initialStatus={task!.status}
        />
      </div>
    </div>
  );
}
