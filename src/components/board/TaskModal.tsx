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

export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  columns,
  initialStatus,
  initialData,
}: TaskModalProps) {
  const formRef = useRef<HTMLFormElement>(null);

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
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && formRef.current) {
      formRef.current.reset();
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in"
      onClick={() => onClose()}
    >
      <div 
        className="w-full max-w-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {initialData ? "タスクを編集" : "新しいタスクを追加"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-semibold text-[var(--color-text-primary)]">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              defaultValue={initialData?.title}
              placeholder="例: 苗の発注、土壌測定など"
              className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/50 transition-shadow"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              <AlignLeft className="w-4 h-4 text-[var(--color-text-muted)]" />
              詳細
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              defaultValue={initialData?.description}
              placeholder="タスクの詳細を入力..."
              className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/50 transition-shadow resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status (Column) */}
            <div className="space-y-1.5">
              <label htmlFor="status" className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                <Tag className="w-4 h-4 text-[var(--color-text-muted)]" />
                ステータス
              </label>
              <select
                name="status"
                id="status"
                defaultValue={initialData?.status || initialStatus || columns[0]?.id}
                className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/50"
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
              <label htmlFor="priority" className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                <AlertCircle className="w-4 h-4 text-[var(--color-text-muted)]" />
                優先度
              </label>
              <select
                name="priority"
                id="priority"
                defaultValue={initialData?.priority || "medium"}
                className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/50"
              >
                <option value="high">高 (High)</option>
                <option value="medium">中 (Medium)</option>
                <option value="low">低 (Low)</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label htmlFor="dueDate" className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              <CalendarIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
              期限
            </label>
            <input
              type="date"
              name="dueDate"
              defaultValue={initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : ""}
              className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/50"
            />
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <label htmlFor="assigneeId" className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              <User className="w-4 h-4 text-[var(--color-text-muted)]" />
              担当者
            </label>
            <select
              name="assigneeId"
              id="assigneeId"
              defaultValue={initialData?.assigneeId || ""}
              className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/50"
            >
              <option value="">担当者なし</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.displayName || profile.email}
                </option>
              ))}
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("本当にこのタスクを削除しますか？")) {
                    onDelete();
                  }
                }}
                className="mr-auto flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-accent-danger)] hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                削除
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-[var(--color-accent-primary)] hover:bg-blue-600 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              {initialData ? "保存する" : "追加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
