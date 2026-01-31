"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronDown, RefreshCw, FileText, Trash2, Calendar, User, MapPin, Briefcase } from "lucide-react";
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
  isPageMode?: boolean; 
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
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(!!initialData?.recurrenceType);
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
      recurrence: recurrenceEnabled ? {
          type: formData.get("recurrenceType") as "daily" | "weekly" | "monthly",
          interval: Number(formData.get("recurrenceInterval")) || 1,
          endDate: formData.get("recurrenceEndDate") as string || undefined
      } : undefined
    });
  };

  return (
    <>
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
      <div className={cn("flex-1 overflow-y-auto", isPageMode ? "pb-32" : "pb-24")}>
        
        {/* Section 1: Hero Input (Title & Description) */}
        <div className={cn(
            "pt-6 pb-6 px-5 space-y-4 animate-enter-up",
            isPageMode ? "bg-white" : "bg-white/50"
        )}>
            {/* Title */}
            <input
                type="text"
                name="title"
                required
                autoFocus={!isPageMode}
                defaultValue={initialData?.title}
                placeholder="新しいタスク..."
                className="w-full text-2xl font-bold text-gray-900 placeholder:text-gray-300 bg-transparent border-none p-0 focus:ring-0 tracking-tight"
            />
            
            {/* Description */}
            <div className="relative">
                <FileText className="absolute top-3 left-0 w-5 h-5 text-gray-400" />
                <textarea
                    name="description"
                    rows={2}
                    defaultValue={initialData?.description}
                    placeholder="詳細やメモを追加（任意）"
                    className="w-full bg-transparent border-none pl-8 pr-0 py-2.5 text-base text-gray-600 placeholder:text-gray-400 focus:ring-0 resize-none min-h-12"
                />
            </div>
        </div>

        <div className="px-4 space-y-4 animate-enter-up" style={{ animationDelay: '50ms' }}>
            
            {/* Section 2: Priority Cards */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { value: "high", label: "高", emoji: "🔥", color: "text-red-600", bg: "bg-red-50 border-red-100 peer-checked:bg-red-100 peer-checked:border-red-200 peer-checked:ring-1 peer-checked:ring-red-300" },
                    { value: "medium", label: "中", emoji: "☘️", color: "text-amber-600", bg: "bg-amber-50 border-amber-100 peer-checked:bg-amber-100 peer-checked:border-amber-200 peer-checked:ring-1 peer-checked:ring-amber-300" },
                    { value: "low", label: "低", emoji: "🌊", color: "text-blue-600", bg: "bg-blue-50 border-blue-100 peer-checked:bg-blue-100 peer-checked:border-blue-200 peer-checked:ring-1 peer-checked:ring-blue-300" },
                ].map((p) => (
                    <label key={p.value} className="cursor-pointer group">
                        <input
                            type="radio"
                            name="priority"
                            value={p.value}
                            defaultChecked={initialData?.priority === p.value || (!initialData && p.value === "medium")}
                            className="peer sr-only"
                        />
                        <div className={cn(
                            "flex flex-col items-center justify-center py-3 rounded-2xl border transition-all active:scale-95",
                            "bg-white border-gray-100 hover:border-gray-200 shadow-sm",
                            p.bg
                        )}>
                            <span className="text-xl mb-1 filter drop-shadow-sm">{p.emoji}</span>
                            <span className={cn("text-xs font-bold", p.color)}>{p.label}</span>
                        </div>
                    </label>
                ))}
            </div>

            {/* Section 3: Schedule Card */}
            <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-1 overflow-hidden">
                {/* Due Date */}
                <div className="relative border-b border-gray-100/80 p-1">
                    <div className="flex items-center gap-3 px-3 py-2 bg-transparent rounded-xl hover:bg-gray-50/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <label className="text-xs font-bold text-gray-500 block mb-0.5">期限</label>
                            <input
                                type="date"
                                name="dueDate"
                                className="w-full bg-transparent border-none p-0 text-sm font-semibold text-gray-900 focus:ring-0"
                                defaultValue={initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : ""}
                            />
                        </div>
                    </div>
                </div>

                {/* Recurrence Toggle */}
                <div className="relative p-1">
                     <div className="px-3 py-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                    recurrenceEnabled ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-400"
                                )}>
                                    <RefreshCw className="w-4 h-4" />
                                </div>
                                <label className="text-sm font-bold text-gray-700">繰り返し</label>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={recurrenceEnabled}
                                onClick={() => setRecurrenceEnabled(!recurrenceEnabled)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                                    recurrenceEnabled ? "bg-indigo-500" : "bg-gray-200"
                                )}
                            >
                                <span className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm",
                                    recurrenceEnabled ? "translate-x-6" : "translate-x-1"
                                )} />
                            </button>
                        </div>
                        
                        {recurrenceEnabled && (
                            <div className="flex gap-2 pl-11 animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="relative flex-1">
                                    <select
                                        name="recurrenceType"
                                        defaultValue={initialData?.recurrenceType || "weekly"}
                                        className="w-full appearance-none bg-gray-50 border-none rounded-lg py-2 pl-3 pr-8 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/20"
                                    >
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
                                        className="w-full bg-gray-50 border-none rounded-lg py-2 px-3 text-xs font-bold text-gray-700 text-center focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">回毎</span>
                                </div>
                            </div>
                        )}
                     </div>
                </div>
            </div>

            {/* Section 4: Details Card */}
            <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-1 overflow-hidden divide-y divide-gray-100/80">
                
                {/* Status */}
                <div className="flex items-center gap-3 px-3 py-3 bg-transparent hover:bg-gray-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-500 flex items-center justify-center shrink-0">
                         <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 relative">
                         <label className="text-xs font-bold text-gray-500 block mb-0.5">ステータス</label>
                         <select
                            name="status"
                            className="w-full appearance-none bg-transparent border-none p-0 text-sm font-semibold text-gray-900 focus:ring-0 cursor-pointer"
                            defaultValue={initialData?.status || initialStatus || columns[0]?.id}
                        >
                            {columns.map(col => (
                                <option key={col.id} value={col.id}>{col.title}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-0 bottom-0.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Field (If available) */}
                {fields.length > 0 && (
                     <div className="flex items-center gap-3 px-3 py-3 bg-transparent hover:bg-gray-50/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 relative">
                            <label className="text-xs font-bold text-gray-500 block mb-0.5">圃場</label>
                            <select
                                name="fieldId"
                                defaultValue={initialData?.fieldId || ""}
                                className="w-full appearance-none bg-transparent border-none p-0 text-sm font-semibold text-gray-900 focus:ring-0 cursor-pointer"
                            >
                                <option value="">指定なし</option>
                                {fields.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-0 bottom-0.5 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                )}

                {/* Assignee (If available) */}
                {profiles.length > 0 && (
                     <div className="flex items-center gap-3 px-3 py-3 bg-transparent hover:bg-gray-50/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-fuchsia-50 text-fuchsia-500 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 relative">
                            <label className="text-xs font-bold text-gray-500 block mb-0.5">担当者</label>
                            <select
                                name="assigneeId"
                                defaultValue={initialData?.assigneeId || ""}
                                className="w-full appearance-none bg-transparent border-none p-0 text-sm font-semibold text-gray-900 focus:ring-0 cursor-pointer"
                            >
                                <option value="">指定なし</option>
                                {profiles.map(p => (
                                    <option key={p.id} value={p.id}>{p.displayName}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-0 bottom-0.5 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                )}
            </div>
            
            {/* Existing Task Actions - Styled generically */}
            {initialData && (
                <div className="pt-2 animate-enter-up" style={{ animationDelay: '100ms' }}>
                    <div className="bg-white/50 rounded-2xl p-2 space-y-2 border border-gray-100/50">
                        <button
                            type="button"
                            onClick={() => setIsWorkLogOpen(true)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50/80 text-emerald-700 font-bold rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                <span>作業記録</span>
                            </div>
                            <ChevronDown className="w-4 h-4 -rotate-90 opacity-50" />
                        </button>
                        
                        <div className="px-2">
                             <TaskComments taskId={initialData.id} />
                        </div>

                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                if (confirm("削除しますか？")) {
                                    onDelete();
                                }
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 text-red-500 font-semibold hover:bg-red-50 rounded-xl transition-all active:scale-[0.98]"
                            >
                                <Trash2 className="w-4 h-4 opacity-70" />
                                削除
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Floating Footer */}
      <div className={cn(
        "p-4 pt-2 bg-linear-to-t from-white via-white to-transparent dark:from-gray-900 pb-safe-bottom z-10",
        isPageMode ? "sticky bottom-0 bg-white border-t border-gray-100/50" : "absolute bottom-0 left-0 right-0"
      )}>
        <div className={cn(
          "flex gap-3 rounded-2xl p-1",
          /* Add a soft glow or shadow if wanted, but clean is better */
        )}>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="flex-2 py-3.5 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl shadow-lg shadow-gray-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
