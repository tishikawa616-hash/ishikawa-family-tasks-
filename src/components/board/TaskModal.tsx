"use client";

import { useRef, useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { X, Trash2 } from "lucide-react";
import { Column, Task, Profile } from "@/types/board";
import { createClient } from "@/lib/supabase/client";
import { Drawer } from "vaul";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    status: string;
    dueDate: string;
    assigneeId: string;
    tags: string[];
  }) => void;
  onDelete?: () => void;
  columns: Column[];
  initialStatus?: string;
  initialData?: Task;
}

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

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function TaskModal(props: TaskModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isMounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  if (!isMounted) return null;

  if (isDesktop) {
    if (!props.isOpen) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
        onClick={() => props.onClose()}
      >
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              {props.initialData ? "タスクを編集" : "新しいタスク"}
            </h2>
            <button
              onClick={props.onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <TaskForm {...props} />
        </div>
      </div>
    );
  }

  return (
    <Drawer.Root 
      open={props.isOpen} 
      onOpenChange={(open) => !open && props.onClose()}
      snapPoints={[1]}
      activeSnapPoint={1}
      setActiveSnapPoint={() => {}}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content 
          className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-2xl bg-white z-50"
          style={{ height: '90vh' }}
        >
          <div className="w-full flex justify-center py-3 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
          
          <Drawer.Title className="sr-only">
            {props.initialData ? "タスクを編集" : "新しいタスク"}
          </Drawer.Title>

          <TaskForm {...props} />
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
        setProfiles(
          data.map((p) => ({
            id: p.id,
            email: p.email,
            displayName: p.display_name,
            avatarUrl: p.avatar_url,
          }))
        );
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
      tags: [],
    });

    formRef.current.reset();
    onClose();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        
        {/* タイトル */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-600 mb-2">
            タスク名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            autoFocus
            defaultValue={initialData?.title}
            placeholder="何をしますか？"
            className="w-full text-lg font-medium text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
          />
        </div>

        {/* ステータス */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            状態
          </label>
          <div className="flex flex-wrap gap-2">
            {columns.map((col) => (
              <label key={col.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={col.id}
                  defaultChecked={
                    initialData?.status === col.id ||
                    (!initialData && (initialStatus === col.id || col.id === columns[0]?.id))
                  }
                  className="peer sr-only"
                />
                <span className="block px-4 py-2 text-sm font-medium rounded-full border-2 transition-all
                  peer-checked:bg-blue-500 peer-checked:text-white peer-checked:border-blue-500
                  border-gray-200 text-gray-600 hover:border-gray-300">
                  {col.title}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 期限 */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-600 mb-2">
            期限
          </label>
          <input
            type="date"
            name="dueDate"
            id="dueDate"
            defaultValue={
              initialData?.dueDate
                ? new Date(initialData.dueDate).toISOString().split("T")[0]
                : ""
            }
            className="w-full text-base font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
          />
        </div>

        {/* 優先度 */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            優先度
          </label>
          <div className="flex gap-2">
            {[
              { value: "high", label: "高", color: "red" },
              { value: "medium", label: "中", color: "amber" },
              { value: "low", label: "低", color: "green" },
            ].map((p) => (
              <label key={p.value} className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  defaultChecked={
                    initialData?.priority === p.value ||
                    (!initialData && p.value === "medium")
                  }
                  className="peer sr-only"
                />
                <span className={`block text-center px-3 py-2 text-sm font-medium rounded-xl border-2 transition-all
                  peer-checked:bg-${p.color}-500 peer-checked:text-white peer-checked:border-${p.color}-500
                  border-gray-200 text-gray-600 hover:border-gray-300`}>
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 担当者 */}
        {profiles.length > 0 && (
          <div>
            <label htmlFor="assigneeId" className="block text-sm font-semibold text-gray-600 mb-2">
              担当者
            </label>
            <select
              name="assigneeId"
              id="assigneeId"
              defaultValue={initialData?.assigneeId || ""}
              className="w-full text-base font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
            >
              <option value="">指定なし</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.displayName || profile.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* メモ */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-600 mb-2">
            メモ
          </label>
          <textarea
            name="description"
            id="description"
            rows={3}
            defaultValue={initialData?.description}
            placeholder="詳細やメモを入力..."
            className="w-full text-base text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all resize-none"
          />
        </div>

        {/* 削除ボタン */}
        {initialData && onDelete && (
          <button
            type="button"
            onClick={() => {
              if (confirm("削除しますか？")) {
                onDelete();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            削除する
          </button>
        )}
      </div>

      {/* フッター */}
      <div className="shrink-0 px-5 py-4 bg-gray-50 border-t border-gray-100 pb-safe-bottom">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-base font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="flex-2 py-3 text-base font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-600 shadow-sm transition-all"
          >
            {initialData ? "保存" : "追加"}
          </button>
        </div>
      </div>
    </form>
  );
}
