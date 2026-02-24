"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronDown, RefreshCw, FileText, Trash2, MapPin, Check } from "lucide-react";
import { Profile, Task, Column } from "@/types/board";
import { Field } from "@/types/field";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { WorkLogModal } from "@/components/board/WorkLogModal";

export interface TaskFormProps {
  onSubmit: (task: {
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    status: string;
    dueDate: string;
    assigneeId: string;
    assigneeIds?: string[];
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
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const formRef = useRef<HTMLFormElement>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [isWorkLogOpen, setIsWorkLogOpen] = useState(false);
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(!!initialData?.recurrenceType);
  
  // Multiple Assignees State
  // Initial data might use assigneeIds (new) or assigneeId (old/single)
  // We need to support both for transition
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);

  useEffect(() => {
     if (initialData) {
         if (initialData.assigneeIds && initialData.assigneeIds.length > 0) {
             setSelectedAssignees(initialData.assigneeIds);
         }
     }
  }, [initialData]);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // ... (fetch profiles and fields logic is fine, but we can enable realtime profile updates here if needed)
      const { data: profilesData } = await supabase.from("task_profiles").select("*");
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
      
      const { data: fieldsData } = await supabase.from("task_fields").select("*").order("name");
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

  const toggleAssignee = (id: string) => {
      if (selectedAssignees.includes(id)) {
          setSelectedAssignees(selectedAssignees.filter(a => a !== id));
      } else {
          setSelectedAssignees([...selectedAssignees, id]);
      }
  };

  const handleEditProfileName = async (profile: Profile) => {
      const newName = prompt("新しい名前を入力してください:", profile.displayName);
      if (newName && newName !== profile.displayName) {
          try {
              const { error } = await supabase
                .from("task_profiles")
                .update({ display_name: newName })
                .eq("id", profile.id);

              if (error) throw error;
              
              // Update local state
              setProfiles(profiles.map(p => p.id === profile.id ? { ...p, displayName: newName } : p));
          } catch (err) {
              console.error("Error updating profile name:", err);
              alert("名前の更新に失敗しました");
          }
      }
  };

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
      assigneeId: selectedAssignees[0] || "", // Deprecated compatibility
      assigneeIds: selectedAssignees, // NEW
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
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col flex-1 h-full max-h-full overflow-hidden relative">
      <div className={cn("flex-1 overflow-y-auto w-full max-w-2xl mx-auto", isPageMode ? "pb-32 px-4 md:px-8" : "pb-24 px-6")}>
        
        {/* Section 1: Hero Input (What to do?) */}
        <div className="pt-8 pb-6 space-y-4 animate-enter-up">
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">
                何をしますか？
            </label>
            <textarea
                name="title"
                required
                autoFocus={!isPageMode}
                defaultValue={initialData?.title}
                placeholder="例：牛乳を買う、ゴミ出し..."
                className="w-full text-3xl md:text-4xl font-black text-gray-900 placeholder:text-gray-200 bg-transparent border-none p-0 focus:ring-0 tracking-tight resize-none overflow-hidden placeholder:font-bold"
                rows={2}
                onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                }}
            />
        </div>

        <div className="space-y-8 pb-8 animate-enter-up" style={{ animationDelay: '50ms' }}>
            
            {/* Quick Date Selection */}
            <div className="space-y-3">
                 <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">
                    いつ？ (期限)
                </label>
                <div className="flex flex-wrap gap-2">
                    <QuickDateButton 
                        label="今日" 
                        dateValue={getIsoDateString(0)} 
                        currentSelection={initialData?.dueDate ? initialData.dueDate.split('T')[0] : ""}
                    />
                    <QuickDateButton 
                        label="明日" 
                        dateValue={getIsoDateString(1)} 
                        currentSelection={initialData?.dueDate ? initialData.dueDate.split('T')[0] : ""}
                    />
                    <QuickDateButton 
                        label="週末" 
                        dateValue={getIsoDateString(getDaysUntilWeekend())} 
                        currentSelection={initialData?.dueDate ? initialData.dueDate.split('T')[0] : ""}
                    />
                    <div className="relative flex-1 min-w-[140px]">
                        <input
                            type="date"
                            name="dueDate"
                            className="w-full bg-gray-50 border-2 border-transparent hover:border-blue-100 focus:border-blue-500 rounded-2xl py-3 px-4 text-sm font-bold text-gray-700 transition-all cursor-pointer h-[52px]"
                            defaultValue={initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : ""}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Assignees Selection */}
            {profiles.length > 0 && (
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">
                        誰が？ (担当)
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {profiles.map(p => {
                            const isSelected = selectedAssignees.includes(p.id);
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => toggleAssignee(p.id)}
                                    className={cn(
                                        "relative flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all",
                                        isSelected ? "bg-blue-50/50 scale-105" : "hover:bg-gray-50 grayscale hover:grayscale-0 opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <div className={cn(
                                        "w-14 h-14 rounded-full p-1 transition-all",
                                        isSelected ? "bg-linear-to-tr from-blue-400 to-indigo-500 shadow-md shadow-blue-500/20" : "bg-transparent"
                                    )}>
                                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border-2 border-white">
                                           <Image 
                                                src={p.avatarUrl || 'https://ui-avatars.com/api/?name=User&background=random'} 
                                                alt={p.displayName || 'Assignee avatar'} 
                                                width={56}
                                                height={56}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold truncate max-w-[60px]",
                                        isSelected ? "text-blue-700" : "text-gray-500"
                                    )}>
                                        {p.displayName}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <input type="hidden" name="assigneeIds" value={JSON.stringify(selectedAssignees)} />
                </div>
            )}

            {/* Advanced Options Toggle */}
            <details className="group border-t-2 border-dashed border-gray-100 pt-6 mt-6">
                <summary className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-blue-500 transition-colors list-none font-bold text-sm tracking-wide pl-1">
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                    詳細設定 (メモ・繰り返し・重要度など)
                </summary>
                
                <div className="pt-6 pb-2 space-y-6 animate-in slide-in-from-top-2 fade-in duration-300">
                    
                    {/* Memo */}
                    <div className="relative">
                        <FileText className="absolute top-4 left-4 w-5 h-5 text-gray-300" />
                        <textarea
                            name="description"
                            rows={3}
                            defaultValue={initialData?.description}
                            placeholder="詳しいメモを追加..."
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-base text-gray-700 placeholder:text-gray-400 resize-none transition-all"
                        />
                    </div>

                    {/* Status & Priority Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {/* Priority */}
                         <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block pl-1">重要度</label>
                            <div className="flex bg-gray-50 p-1 rounded-xl">
                                {[
                                    { value: "low", label: "低", color: "text-blue-600 peer-checked:bg-white peer-checked:text-blue-600 peer-checked:shadow-sm" },
                                    { value: "medium", label: "中", color: "text-gray-600 peer-checked:bg-white peer-checked:text-gray-900 peer-checked:shadow-sm" },
                                    { value: "high", label: "高", color: "text-red-600 peer-checked:bg-white peer-checked:text-red-600 peer-checked:shadow-sm" },
                                ].map((p) => (
                                    <label key={p.value} className="flex-1 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value={p.value}
                                            defaultChecked={initialData?.priority === p.value || (!initialData && p.value === "medium")}
                                            className="peer sr-only"
                                        />
                                        <div className={cn(
                                            "flex items-center justify-center py-2.5 rounded-lg transition-all",
                                            "text-sm font-bold text-gray-400",
                                            p.color
                                        )}>
                                            {p.label}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Status Override */}
                        <div>
                             <label className="text-xs font-bold text-gray-400 mb-2 block pl-1">保存先のリスト</label>
                             <div className="relative">
                                <select
                                    name="status"
                                    className="w-full appearance-none bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 cursor-pointer"
                                    defaultValue={initialData?.status || initialStatus || columns[0]?.id}
                                >
                                    {columns.map(col => (
                                        <option key={col.id} value={col.id}>{col.title}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                             </div>
                        </div>
                    </div>

                    {/* Field if any */}
                    {fields.length > 0 && (
                         <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 block pl-1">場所・カテゴリ (任意)</label>
                            <div className="relative">
                                <select
                                    name="fieldId"
                                    defaultValue={initialData?.fieldId || ""}
                                    className="w-full appearance-none bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-gray-700 cursor-pointer"
                                >
                                    <option value="">指定なし</option>
                                    {fields.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    )}

                    {/* Recurrence (Simplified) */}
                    <div className="bg-gray-50 rounded-2xl p-4">
                         <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={() => setRecurrenceEnabled(!recurrenceEnabled)}>
                            <RefreshCw className={cn("w-5 h-5", recurrenceEnabled ? "text-indigo-500" : "text-gray-400")} />
                            <span className="text-sm font-bold text-gray-700 select-none">このタスクを繰り返す</span>
                            <div className={cn(
                                "ml-auto relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                recurrenceEnabled ? "bg-indigo-500" : "bg-gray-300"
                            )}>
                                <span className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-white transition",
                                    recurrenceEnabled ? "translate-x-6" : "translate-x-1"
                                )} />
                            </div>
                         </div>
                         
                         {recurrenceEnabled && (
                            <div className="flex gap-2 pt-3 border-t border-gray-200/60 mt-3 animate-in fade-in">
                                <div className="relative flex-1">
                                    <select
                                        name="recurrenceType"
                                        defaultValue={initialData?.recurrenceType || "weekly"}
                                        className="w-full appearance-none bg-white border-none rounded-xl py-2 pl-3 pr-8 text-sm font-bold text-gray-700 shadow-sm"
                                    >
                                        <option value="daily">毎日</option>
                                        <option value="weekly">毎週</option>
                                        <option value="monthly">毎月</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                                <div className="relative w-24">
                                    <input 
                                        type="number" 
                                        name="recurrenceInterval"
                                        min="1"
                                        placeholder="1"
                                        defaultValue={initialData?.recurrenceInterval || 1}
                                        className="w-full bg-white border-none rounded-xl py-2 px-3 text-sm font-bold text-gray-700 text-center shadow-sm"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">回</span>
                                </div>
                            </div>
                         )}
                    </div>

                </div>
            </details>

            {/* Existing Task Actions */}
            {initialData && (
                <div className="pt-6 mt-6 border-t-2 border-dashed border-gray-100 space-y-3">
                    <button
                        type="button"
                        onClick={() => setIsWorkLogOpen(true)}
                        className="w-full flex items-center justify-between px-4 py-4 bg-emerald-50 text-emerald-700 font-bold rounded-2xl hover:bg-emerald-100 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <Check className="w-5 h-5" />
                            <span>作業記録を見る</span>
                        </div>
                    </button>
                    
                    {onDelete && (
                        <button
                            type="button"
                            onClick={() => {
                            if (confirm("本当に削除しますか？この操作は取り消せません。")) {
                                onDelete();
                            }
                            }}
                            className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
                        >
                            <Trash2 className="w-5 h-5 opacity-70" />
                            タスクを完全に削除する
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Floating Footer Action Area */}
      <div className={cn(
        "p-4 md:p-6 bg-linear-to-t from-white via-white to-transparent pb-safe-bottom z-20",
        isPageMode ? "fixed bottom-0 left-0 right-0 max-w-2xl mx-auto" : "absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100"
      )}>
        <div className="flex gap-3 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={onCancel}
            className="w-24 md:w-32 py-4 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all flex items-center justify-center"
          >
            やめる
          </button>
          <button
            type="submit"
            className="flex-1 py-4 text-base font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {initialData ? "変更を保存する" : "タスクを追加する"}
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

// Helper Components for the new UI
function QuickDateButton({ label, dateValue, currentSelection }: { label: string, dateValue: string, currentSelection: string }) {
    const isSelected = currentSelection === dateValue;
    return (
        <label className="cursor-pointer flex-1 min-w-[80px]">
            <input 
                type="radio" 
                name="dueDate" 
                value={dateValue} 
                defaultChecked={isSelected} 
                className="peer sr-only" 
            />
            <div className={cn(
                "flex items-center justify-center py-3.5 px-2 rounded-2xl border-2 transition-all font-bold text-sm",
                isSelected 
                    ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" 
                    : "bg-white border-gray-100 text-gray-500 hover:border-blue-200 hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700"
            )}>
                {label}
            </div>
        </label>
    );
}

// Helper functions for dates
function getIsoDateString(offsetDays: number) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
}

function getDaysUntilWeekend() {
    const d = new Date();
    const day = d.getDay();
    // Assuming weekend starts on Saturday (6)
    if (day === 6) return 0;
    if (day === 0) return 6; // Next Saturday if it's already Sunday
    return 6 - day;
}
