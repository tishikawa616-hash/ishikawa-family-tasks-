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
        <Drawer.Content className="fixed bottom-0 left-0 right-0 mt-24 max-h-[96vh] flex flex-col rounded-t-[20px] bg-white z-50 outline-none pb-safe-bottom shadow-2xl">
           {/* Handle Indicator */}
          <div className="p-4 bg-white rounded-t-[20px] flex-1 overflow-y-auto">
            <div className="mx-auto w-16 h-1.5 shrink-0 rounded-full bg-gray-300 mb-8" />
            <div className="max-w-md mx-auto">
              <Drawer.Title className="font-bold text-xl mb-6 text-center text-gray-800">
                {props.initialData ? "タスクを編集" : "新しいタスクを作成"}
              </Drawer.Title>
              <TaskForm {...props} />
            </div>
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
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 pb-8">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-semibold text-(--color-text-primary)">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              defaultValue={initialData?.title}
              placeholder="例: 苗の発注、土壌測定など"
              className="w-full px-4 py-2.5 bg-(--color-bg-primary) border border-(--color-border) rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-accent-primary)/50 transition-shadow text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)">
              <AlignLeft className="w-4 h-4 text-(--color-text-muted)" />
              詳細
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              defaultValue={initialData?.description}
              placeholder="タスクの詳細を入力..."
              className="w-full px-4 py-2.5 bg-(--color-bg-primary) border border-(--color-border) rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-accent-primary)/50 transition-shadow resize-none text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status (Column) */}
            <div className="space-y-1.5">
              <label htmlFor="status" className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)">
                <Tag className="w-4 h-4 text-(--color-text-muted)" />
                ステータス
              </label>
              <select
                name="status"
                id="status"
                defaultValue={initialData?.status || initialStatus || columns[0]?.id}
                className="w-full px-3 py-2.5 bg-(--color-bg-primary) border border-(--color-border) rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-accent-primary)/50 text-base"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label htmlFor="priority" className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)">
                <AlertCircle className="w-4 h-4 text-(--color-text-muted)" />
                優先度
              </label>
              <select
                name="priority"
                id="priority"
                defaultValue={initialData?.priority || "medium"}
                className="w-full px-3 py-2.5 bg-(--color-bg-primary) border border-(--color-border) rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-accent-primary)/50 text-base"
              >
                <option value="high">高 (High)</option>
                <option value="medium">中 (Medium)</option>
                <option value="low">低 (Low)</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label htmlFor="dueDate" className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)">
              <CalendarIcon className="w-4 h-4 text-(--color-text-muted)" />
              期限
            </label>
            <input
              type="date"
              name="dueDate"
              defaultValue={initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : ""}
              className="w-full px-3 py-2.5 bg-(--color-bg-primary) border border-(--color-border) rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-accent-primary)/50 text-base"
            />
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <label htmlFor="assigneeId" className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)">
              <User className="w-4 h-4 text-(--color-text-muted)" />
              担当者
            </label>
            <select
              name="assigneeId"
              id="assigneeId"
              defaultValue={initialData?.assigneeId || ""}
              className="w-full px-4 py-3 bg-(--color-bg-primary) border border-(--color-border) rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-accent-primary)/50 text-base appearance-none"
            >
              <option value="">担当者なし</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.displayName || profile.email}
                </option>
              ))}
            </select>
            {/* Custom arrow could be added here if needed, but appearance-none is safer for consistent heights */}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-(--color-border)">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("本当にこのタスクを削除しますか？")) {
                    onDelete();
                  }
                }}
                className="mr-auto flex items-center justify-center gap-2 px-5 py-3 text-base font-medium text-(--color-accent-danger) bg-red-50 hover:bg-red-100 rounded-xl transition-colors touch-target"
              >
                <Trash2 className="w-5 h-5" />
                <span className="md:inline hidden">削除</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-base font-medium text-(--color-text-secondary) hover:bg-(--color-bg-hover) rounded-xl transition-colors touch-target"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-8 py-3 text-base font-bold text-white bg-(--color-accent-primary) hover:bg-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all touch-target"
            >
              {initialData ? "保存" : "追加"}
            </button>
          </div>
        </form>
  )
}
