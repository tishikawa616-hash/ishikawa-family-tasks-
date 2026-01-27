"use client";

import { useRef, useEffect, useState } from "react";
import { X, Calendar as CalendarIcon, Tag, AlignLeft, AlertCircle, Trash2, User } from "lucide-react";
import { Column, Task, Profile } from "@/types/board";
import { createClient } from "@/lib/supabase/client";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    status: string; // columnId
    dueDate: string;
    assigneeId: string;
  }) => void;
  onDelete?: () => void;
  columns: Column[];
  initialStatus?: string;
  initialData?: Task;
}

import { useCallback, useSyncExternalStore } from "react";
import { Drawer } from "vaul";

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const matchMedia = window.matchMedia(query);
      matchMedia.addEventListener("change", callback);
      return () => matchMedia.removeEventListener("change", callback);
    },
    [query]
  );

  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function TaskModal(props: TaskModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react/no-did-mount-set-state, @typescript-eslint/no-unused-expressions
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (isDesktop) {
     if (!props.isOpen) return null;
     return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={() => props.onClose()}
        >
          <div 
            className="w-full max-w-lg bg-(--color-bg-card) border border-(--color-border) rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex items-center justify-between p-4 border-b border-(--color-border) bg-(--color-bg-secondary)/50 shrink-0">
              <h2 className="text-lg font-bold text-(--color-text-primary)">
                {props.initialData ? "タスクを編集" : "新しいタスクを追加"}
              </h2>
              <button
                onClick={props.onClose}
                className="p-2 rounded-full hover:bg-(--color-bg-hover) text-(--color-text-secondary) transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
               <TaskForm {...props} />
            </div>
          </div>
        </div>
     );
  }

  return (
    <Drawer.Root open={props.isOpen} onOpenChange={(open) => !open && props.onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 mt-24 max-h-[96vh] flex flex-col rounded-t-[20px] bg-gray-50 z-50 outline-none pb-safe-bottom shadow-2xl">
           {/* Handle Indicator */}
          <div className="w-full flex justify-center py-3 bg-white rounded-t-[20px]">
             <div className="w-16 h-1.5 shrink-0 rounded-full bg-gray-300" />
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
              <Drawer.Title className="sr-only">
                {props.initialData ? "タスクを編集" : "新しいタスクを作成"}
              </Drawer.Title>
              <TaskForm {...props} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function TaskForm({
  onSubmit,
  onClose,
  onDelete,
  columns,
  initialStatus,
  initialData,
}: TaskModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from("profiles").select("*");
      if (data) {
        setProfiles(data.map(p => ({
          id: p.id,
          email: p.email,
          displayName: p.display_name,
          avatarUrl: p.avatar_url,
        })));
      }
    };
    fetchProfiles();
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
    });
    
    formRef.current.reset();
    onClose();
  };

  return (
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col h-full bg-gray-50/50">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            
            {/* Title Section - Standalone Card */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
               <label htmlFor="title" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                 タスク名 <span className="text-red-500">*</span>
               </label>
               <input
                 type="text"
                 name="title"
                 id="title"
                 required
                 defaultValue={initialData?.title}
                 placeholder="何をする予定ですか？"
                 className="w-full text-lg font-bold text-gray-900 placeholder:text-gray-300 border-none p-0 focus:ring-0 bg-transparent"
               />
            </div>

            {/* Details Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
               {/* Description */}
               <div className="p-4">
                  <div className="flex items-start gap-3">
                     <AlignLeft className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                     <div className="flex-1">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">詳細</label>
                        <textarea
                          name="description"
                          id="description"
                          rows={3}
                          defaultValue={initialData?.description}
                          placeholder="メモや手順を入力..."
                          className="w-full text-base text-gray-900 placeholder:text-gray-400 border-none p-0 focus:ring-0 bg-transparent resize-none leading-relaxed"
                        />
                     </div>
                  </div>
               </div>
            </div>

            {/* Properties Section - Grouped List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
               
               {/* Status */}
               <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-700">
                     <Tag className="w-5 h-5 text-gray-400" />
                     <span className="text-sm font-medium">ステータス</span>
                  </div>
                  <div className="relative">
                     <select
                       name="status"
                       id="status"
                       defaultValue={initialData?.status || initialStatus || columns[0]?.id}
                       className="appearance-none bg-transparent text-right font-medium text-gray-900 border-none p-0 pr-6 focus:ring-0 cursor-pointer"
                       style={{ direction: 'rtl' }}
                     >
                       {columns.map((col) => (
                         <option key={col.id} value={col.id}>
                           {col.title}
                         </option>
                       ))}
                     </select>
                     {/* Chevron could go here */}
                  </div>
               </div>

               {/* Priority */}
               <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-700">
                     <AlertCircle className="w-5 h-5 text-gray-400" />
                     <span className="text-sm font-medium">優先度</span>
                  </div>
                  <select
                     name="priority"
                     id="priority"
                     defaultValue={initialData?.priority || "medium"}
                     className="appearance-none bg-transparent text-right font-medium text-gray-900 border-none p-0 pr-6 focus:ring-0 cursor-pointer"
                     style={{ direction: 'rtl' }}
                  >
                     <option value="high">🔥 高 (High)</option>
                     <option value="medium">⚡ 中 (Medium)</option>
                     <option value="low">☕ 低 (Low)</option>
                  </select>
               </div>

               {/* Due Date */}
               <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-700">
                     <CalendarIcon className="w-5 h-5 text-gray-400" />
                     <span className="text-sm font-medium">期限</span>
                  </div>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : ""}
                    className="appearance-none bg-transparent text-right font-medium text-gray-900 border-none p-0 focus:ring-0 font-mono"
                  />
               </div>

               {/* Assignee */}
               <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-700">
                     <User className="w-5 h-5 text-gray-400" />
                     <span className="text-sm font-medium">担当者</span>
                  </div>
                  <select
                    name="assigneeId"
                    id="assigneeId"
                    defaultValue={initialData?.assigneeId || ""}
                    className="appearance-none bg-transparent text-right font-medium text-gray-900 border-none p-0 pr-6 focus:ring-0 text-ellipsis max-w-[150px]"
                    style={{ direction: 'rtl' }}
                  >
                    <option value="">未設定</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.displayName || profile.email}
                      </option>
                    ))}
                  </select>
               </div>
            </div>
            
            {initialData && onDelete && (
               <button
                  type="button"
                  onClick={() => {
                    if (confirm("本当にこのタスクを削除しますか？")) {
                      onDelete();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-medium bg-red-50 rounded-2xl hover:bg-red-100 transition-colors"
               >
                  <Trash2 className="w-5 h-5" />
                  このタスクを削除
               </button>
            )}

            {/* Spacer for bottom safe area/button */}
            <div className="h-24"></div>
          </div>

          {/* Sticky Footer Action */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 pb-safe-bottom">
             <div className="flex gap-3">
                <button
                   type="button"
                   onClick={onClose}
                   className="flex-1 py-3.5 text-base font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                   キャンセル
                </button>
                <button
                   type="submit"
                   className="flex-[2_2_0%] py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                >
                   {initialData ? "変更を保存" : "タスクを作成"}
                </button>
             </div>
          </div>
        </form>
  )
}
