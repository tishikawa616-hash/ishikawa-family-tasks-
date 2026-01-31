"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronDown, Shovel, RefreshCw, FileText, Trash2 } from "lucide-react";
import { Profile, Task, Column } from "@/types/board";
import { Field } from "@/types/field";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { TaskComments } from "@/components/board/TaskComments";
import { WorkLogModal } from "@/components/board/WorkLogModal";

export interface TaskFormProps {
  onSubmit: (task: {
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
  }) => void;
  onCancel: () => void;
  onDelete?: () => void;
  columns: Column[];
  initialStatus?: string;
  initialData?: Task;
  isPageMode?: boolean; // Prop to styling for full page vs modal
}

export function TaskForm({
  onSubmit,
  onCancel,
  onDelete,
  columns,
  initialStatus,
  initialData,
  isPageMode = false,
}: TaskFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [isWorkLogOpen, setIsWorkLogOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: profilesData } = await supabase.from("profiles").select("*");
      if (profilesData) {
        setProfiles(
          profilesData.map((p) => ({
            id: p.id,
            email: p.email,
            displayName: p.display_name,
            avatarUrl: p.avatar_url,
          }))
        );
      }

      const { data: fieldsData } = await supabase.from("fields").select("*").order("name");
      if (fieldsData) {
        setFields(fieldsData.map(f => ({
            id: f.id,
            name: f.name,
            color: f.color
        })));
      }
    };
    fetchData();
  }, [supabase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);

    onSubmit({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as "high" | "medium" | "low",
      status: formData.get("status") as string,
      dueDate: formData.get("dueDate") as string,
      assigneeId: formData.get("assigneeId") as string,
      fieldId: formData.get("fieldId") as string,
      tags: [],
      recurrence: formData.get("recurrenceType") ? {
          type: formData.get("recurrenceType") as "daily" | "weekly" | "monthly",
          interval: Number(formData.get("recurrenceInterval")) || 1,
          endDate: formData.get("recurrenceEndDate") as string || undefined
      } : undefined
    });
  };

  return (
    <>
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
      <div className={cn("flex-1 overflow-y-auto space-y-5", isPageMode ? "pb-32 px-4 pt-4" : "px-5 py-4")}>
        
        {/* Title Input - Minimalist */}
        <div className={cn("glass-card p-1", isPageMode && "bg-white")}>
          <input
            type="text"
            name="title"
            required
            autoFocus={!isPageMode} // Don't autofocus on page load on mobile to prevent keyboard pop
            defaultValue={initialData?.title}
            placeholder="タスク名を入力..."
            className="w-full text-xl font-bold text-gray-900 placeholder:text-gray-300 bg-transparent border-none px-4 py-4 focus:ring-0"
          />
        </div>

        {/* Priority Selector - Segmented Control */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block px-1">優先度</label>
          <div className="bg-gray-100/80 p-1 rounded-xl flex gap-1">
            {[
              { value: "high", label: "高", color: "text-red-600", activeBg: "bg-white shadow-sm ring-1 ring-black/5" },
              { value: "medium", label: "中", color: "text-amber-600", activeBg: "bg-white shadow-sm ring-1 ring-black/5" },
              { value: "low", label: "低", color: "text-emerald-600", activeBg: "bg-white shadow-sm ring-1 ring-black/5" },
            ].map((p) => (
              <label key={p.value} className="flex-1 cursor-pointer relative">
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  defaultChecked={initialData?.priority === p.value || (!initialData && p.value === "medium")}
                  className="peer sr-only"
                />
                <span className={cn(
                  "flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all",
                  "text-gray-400 peer-checked:text-gray-900",
                  "peer-checked:bg-white peer-checked:shadow-sm peer-checked:ring-1 peer-checked:ring-black/5"
                )}>
                  <span className={cn("mr-1.5 w-2 h-2 rounded-full", p.color)}></span>
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block px-1">状態</label>
                 <div className="relative">
                    <select
                        name="status"
                        className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        defaultValue={initialData?.status || initialStatus || columns[0]?.id}
                    >
                        {columns.map(col => (
                            <option key={col.id} value={col.id}>{col.title}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                 </div>
            </div>

             {/* Due Date */}
            <div>
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block px-1">期限</label>
                 <div className="relative">
                    <input
                        type="date"
                        name="dueDate"
                        className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        defaultValue={initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : ""}
                    />
                 </div>
            </div>
        </div>

        {/* Fields & Assignee */}
        <div className="space-y-4">
             {fields.length > 0 && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block px-1 flex items-center gap-1">
                        <Shovel className="w-3 h-3" /> 圃場
                    </label>
                    <div className="relative">
                        <select
                            name="fieldId"
                            defaultValue={initialData?.fieldId || ""}
                            className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        >
                            <option value="">指定なし</option>
                            {fields.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            )}

            {profiles.length > 0 && (
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block px-1">担当者</label>
                    <div className="relative">
                        <select
                            name="assigneeId"
                            defaultValue={initialData?.assigneeId || ""}
                            className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        >
                            <option value="">指定なし</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.displayName}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            )}
        </div>

        {/* Recurrence - Expandable Style */}
        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
             <label className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 block flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> 繰り返し設定
             </label>
             <div className="flex gap-3">
                 <div className="relative flex-1">
                    <select
                        name="recurrenceType"
                        defaultValue={initialData?.recurrenceType || ""}
                        className="w-full appearance-none bg-white border-none rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                        <option value="">なし</option>
                        <option value="daily">毎日</option>
                        <option value="weekly">毎週</option>
                        <option value="monthly">毎月</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                 </div>
                 <div className="relative w-24">
                     <input 
                        type="number" 
                        name="recurrenceInterval"
                        min="1"
                        placeholder="1"
                        defaultValue={initialData?.recurrenceInterval || 1}
                        className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-center"
                     />
                     <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">回毎</span>
                 </div>
             </div>
        </div>

        {/* Description */}
        <div>
           <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block px-1">メモ</label>
           <textarea
            name="description"
            rows={4}
            defaultValue={initialData?.description}
            placeholder="詳細を入力してください..."
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
        </div>

        {/* Existing Task Actions */}
        {initialData && (
            <div className="space-y-3 pt-2">
                <button
                    type="button"
                    onClick={() => setIsWorkLogOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-50 text-emerald-600 font-bold rounded-xl border border-emerald-100 hover:bg-emerald-100/80 transition-all active:scale-[0.98]"
                >
                    <FileText className="w-5 h-5" />
                    作業記録
                </button>
                
                <TaskComments taskId={initialData.id} />
                
                {onDelete && (
                    <button
                        type="button"
                        onClick={() => {
                        if (confirm("削除しますか？")) {
                            onDelete();
                        }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 text-red-500 font-semibold bg-gray-50 hover:bg-red-50 rounded-xl transition-all active:scale-[0.98]"
                    >
                        <Trash2 className="w-4 h-4 opacity-70" />
                        削除
                    </button>
                )}
            </div>
        )}

        {/* Spacer for Floating Footer isPageMode=false only */}
        {!isPageMode && <div className="h-24" />}
      </div>

      {/* Floating Footer - Conditional Fixed Position */}
      <div className={cn(
        "p-4 pt-2 bg-linear-to-t from-white via-white to-transparent dark:from-gray-900 pb-safe-bottom z-10",
        isPageMode ? "sticky bottom-0 bg-white border-t border-gray-100" : "absolute bottom-0 left-0 right-0"
      )}>
        <div className={cn(
          "flex gap-3 rounded-2xl p-1",
          !isPageMode && "shadow-2xl shadow-gray-200/50 bg-white ring-1 ring-gray-100"
        )}>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 text-sm font-bold text-gray-500 bg-transparent hover:bg-gray-50 rounded-xl transition-all"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="flex-2 py-3.5 text-sm font-bold text-white bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-[0.98] transition-all"
          >
            {initialData ? "保存" : "作成"}
          </button>
        </div>
      </div>
    </form>

    {initialData && (
        <WorkLogModal 
            isOpen={isWorkLogOpen} 
            onClose={() => setIsWorkLogOpen(false)} 
            taskId={initialData.id}
            taskTitle={initialData.title}
        />
    )}
    </>
  );
}
