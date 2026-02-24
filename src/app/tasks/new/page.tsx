"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { TaskForm } from "@/components/tasks/TaskForm";
import { createClient } from "@/lib/supabase/client";
import { Column } from "@/types/board";

// Simplified Columns (Since we just need ID for status selection)
const INITIAL_COLUMNS: Column[] = [
  { id: "col-todo", title: "予定", tasks: [], color: "#3b82f6" },
  { id: "col-inprogress", title: "作業中", tasks: [], color: "#f97316" },
  { id: "col-review", title: "確認待ち", tasks: [], color: "#8b5cf6" },
  { id: "col-done", title: "完了", tasks: [], color: "#10b981" },
];

function NewTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "col-todo";
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save task
      const { error } = await supabase
        .from("task_tasks")
        .insert({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          due_date: taskData.dueDate || null,
          assignee_id: taskData.assigneeId || null,
          tags: taskData.tags,
          field_id: taskData.fieldId || null,
          created_by: user.id,
          recurrence_type: taskData.recurrence?.type || null,
          recurrence_interval: taskData.recurrence?.interval || null,
          recurrence_end_date: taskData.recurrence?.endDate || null,
        });

      if (error) throw error;
      
      router.push("/");
      router.refresh(); // Refresh board data
    } catch (err) {
      console.error("Error creating task:", err);
      alert("タスクの作成に失敗しました");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white md:bg-gray-50/50 pb-safe-bottom">
      {/* Mobile Page Header (Soft & Clean) */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100/50 px-4 py-3 md:py-4 flex items-center justify-between gap-3 safe-p-top shadow-sm md:shadow-none transition-all">
        <button 
          onClick={() => router.back()}
          className="p-2.5 -ml-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 absolute left-1/2 -translate-x-1/2">
            新しいタスク
        </h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="premium-container max-w-2xl mx-auto h-[calc(100vh-60px)] md:h-auto md:min-h-0 md:bg-white md:shadow-2xl md:shadow-gray-200/50 md:mt-8 md:rounded-[2.5rem] md:overflow-hidden md:border md:border-gray-100">
        <TaskForm 
          isPageMode={true}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          columns={INITIAL_COLUMNS}
          initialStatus={initialStatus}
        />
      </div>
    </div>
  );
}

export default function NewTaskPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">読み込み中...</div>}>
      <NewTaskContent />
    </Suspense>
  );
}
