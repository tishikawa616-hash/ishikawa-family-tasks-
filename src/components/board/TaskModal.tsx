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
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
        onClick={() => props.onClose()}
      >
        <div
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-500 to-indigo-600">
            <h2 className="text-xl font-bold text-white">
              {props.initialData ? "タスクを編集" : "新しいタスク"}
            </h2>
            <button
              onClick={props.onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
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
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content 
          className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-3xl bg-gray-50 z-50"
          style={{ height: '92vh' }}
        >
          {/* Handle */}
          <div className="w-full flex justify-center py-4 bg-white rounded-t-3xl shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-gray-300" />
          </div>
          
          {/* Header */}
          <div className="px-6 pb-4 bg-white shrink-0">
            <Drawer.Title className="text-2xl font-bold text-gray-900 text-center">
              {props.initialData ? "タスクを編集" : "新しいタスク"}
            </Drawer.Title>
          </div>

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
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        
        {/* タイトル - カードスタイル */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <label htmlFor="title" className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
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
            className="w-full text-xl font-semibold text-gray-900 placeholder:text-gray-300 bg-transparent border-0 border-b-2 border-gray-200 px-0 py-3 focus:ring-0 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* ステータス - カードスタイル */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
            状態
          </label>
          <div className="grid grid-cols-2 gap-3">
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
                <span className="flex items-center justify-center px-4 py-4 text-base font-semibold rounded-xl border-2 transition-all
                  peer-checked:bg-blue-500 peer-checked:text-white peer-checked:border-blue-500 peer-checked:shadow-lg peer-checked:shadow-blue-500/25
                  border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50">
                  {col.title}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 期限 - カードスタイル */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <label htmlFor="dueDate" className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
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
            className="w-full text-lg font-semibold text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 focus:ring-0 focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* 優先度 - カードスタイル */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
            優先度
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "high", label: "高", bgClass: "peer-checked:bg-red-500 peer-checked:border-red-500 peer-checked:shadow-red-500/25 hover:border-red-300 hover:bg-red-50" },
              { value: "medium", label: "中", bgClass: "peer-checked:bg-amber-500 peer-checked:border-amber-500 peer-checked:shadow-amber-500/25 hover:border-amber-300 hover:bg-amber-50" },
              { value: "low", label: "低", bgClass: "peer-checked:bg-green-500 peer-checked:border-green-500 peer-checked:shadow-green-500/25 hover:border-green-300 hover:bg-green-50" },
            ].map((p) => (
              <label key={p.value} className="cursor-pointer">
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
                <span className={`flex items-center justify-center px-4 py-4 text-base font-bold rounded-xl border-2 transition-all
                  peer-checked:text-white peer-checked:shadow-lg ${p.bgClass}
                  border-gray-200 text-gray-600`}>
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 担当者 - カードスタイル */}
        {profiles.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label htmlFor="assigneeId" className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
              担当者
            </label>
            <select
              name="assigneeId"
              id="assigneeId"
              defaultValue={initialData?.assigneeId || ""}
              className="w-full text-lg font-semibold text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 focus:ring-0 focus:border-blue-500 focus:bg-white transition-all appearance-none"
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

        {/* メモ - カードスタイル */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <label htmlFor="description" className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            メモ
          </label>
          <textarea
            name="description"
            id="description"
            rows={4}
            defaultValue={initialData?.description}
            placeholder="詳細やメモを入力..."
            className="w-full text-base text-gray-900 placeholder:text-gray-400 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 focus:ring-0 focus:border-blue-500 focus:bg-white transition-all resize-none"
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
            className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-semibold bg-red-50 hover:bg-red-100 rounded-2xl transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            このタスクを削除
          </button>
        )}

        {/* 下部スペーサー */}
        <div className="h-24" />
      </div>

      {/* フッター - フローティングスタイル */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-safe-bottom shadow-2xl shadow-black/5">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 text-base font-bold text-gray-600 bg-gray-100 rounded-2xl hover:bg-gray-200 active:scale-98 transition-all"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="flex-2 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 active:scale-98 transition-all"
          >
            {initialData ? "保存する" : "追加する"}
          </button>
        </div>
      </div>
    </form>
  );
}
