"use client";

import { useRef, useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { X, Calendar as CalendarIcon, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
        onClick={() => props.onClose()}
      >
        <div
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b-2 border-gray-100 bg-gray-50">
            <h2 className="text-2xl font-black text-gray-800">
              {props.initialData ? "📝 タスクを編集" : "✨ 新しいタスク"}
            </h2>
            <button
              onClick={props.onClose}
              className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
              aria-label="閉じる"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TaskForm {...props} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Drawer.Root open={props.isOpen} onOpenChange={(open) => !open && props.onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[95vh] flex flex-col rounded-t-[28px] bg-white z-50 outline-none shadow-2xl">
          {/* Handle */}
          <div className="w-full flex justify-center pt-4 pb-2">
            <div className="w-14 h-2 rounded-full bg-gray-300" />
          </div>
          
          {/* Header */}
          <div className="px-6 pb-4 border-b-2 border-gray-100">
            <Drawer.Title className="text-2xl font-black text-gray-800 text-center">
              {props.initialData ? "📝 編集する" : "✨ 新しいタスク"}
            </Drawer.Title>
          </div>

          <div className="flex-1 overflow-y-auto pb-safe-bottom">
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
  const [showDetails, setShowDetails] = useState(!!initialData);
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
    const tagsString = formData.get("tags") as string;
    const tags = tagsString
      ? tagsString.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    onSubmit({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as "high" | "medium" | "low",
      status: formData.get("status") as string,
      dueDate: formData.get("dueDate") as string,
      assigneeId: formData.get("assigneeId") as string,
      tags,
    });

    formRef.current.reset();
    onClose();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col min-h-full">
      <div className="flex-1 px-5 py-6 space-y-5">
        
        {/* ===== タイトル入力（必須・最重要） ===== */}
        <div className="bg-blue-50 p-6 rounded-3xl border-3 border-blue-200">
          <label htmlFor="title" className="block text-xl font-black text-blue-700 mb-3">
            📌 何をする？
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            autoFocus
            defaultValue={initialData?.title}
            placeholder="例：畑の水やり"
            className="w-full text-2xl font-bold text-gray-800 placeholder:text-gray-400 bg-white border-2 border-blue-300 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
          />
        </div>

        {/* ===== 期限（シンプル表示） ===== */}
        <div className="bg-orange-50 p-5 rounded-3xl border-2 border-orange-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-200 rounded-2xl">
                <CalendarIcon className="w-7 h-7 text-orange-700" />
              </div>
              <span className="text-xl font-black text-orange-800">いつまで？</span>
            </div>
            <input
              type="date"
              name="dueDate"
              defaultValue={
                initialData?.dueDate
                  ? new Date(initialData.dueDate).toISOString().split("T")[0]
                  : ""
              }
              className="text-xl font-bold text-orange-700 bg-white border-2 border-orange-300 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-orange-200 focus:border-orange-400 cursor-pointer"
            />
          </div>
        </div>

        {/* ===== ステータス（大きなボタン式） ===== */}
        <div className="bg-gray-50 p-5 rounded-3xl border-2 border-gray-200">
          <label className="block text-lg font-black text-gray-700 mb-3">
            📂 状態
          </label>
          <div className="grid grid-cols-2 gap-3">
            {columns.map((col) => (
              <label
                key={col.id}
                className="relative cursor-pointer"
              >
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
                <div
                  className="p-4 text-center text-lg font-bold rounded-2xl border-3 transition-all
                    peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-checked:text-white peer-checked:shadow-lg
                    border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  style={{
                    borderColor: col.color ? `${col.color}80` : undefined,
                  }}
                >
                  {col.title}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ===== 詳細設定（折りたたみ） ===== */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center gap-2 py-4 text-lg font-bold text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showDetails ? (
            <>
              <ChevronUp className="w-5 h-5" />
              詳細をとじる
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              もっと詳しく設定する
            </>
          )}
        </button>

        {showDetails && (
          <div className="space-y-4 animate-fade-in">
            {/* 優先度 */}
            <div className="bg-amber-50 p-5 rounded-3xl border-2 border-amber-200">
              <label className="block text-lg font-black text-amber-700 mb-3">
                ⚡ 優先度
              </label>
              <div className="flex gap-3">
                {[
                  { value: "high", label: "🔴 高", color: "red" },
                  { value: "medium", label: "🟡 中", color: "amber" },
                  { value: "low", label: "🟢 低", color: "green" },
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
                    <div
                      className={`p-4 text-center text-lg font-bold rounded-2xl border-3 transition-all
                        peer-checked:border-${p.color}-500 peer-checked:bg-${p.color}-500 peer-checked:text-white peer-checked:shadow-lg
                        border-gray-300 bg-white text-gray-700 hover:border-gray-400`}
                    >
                      {p.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* メモ */}
            <div className="bg-gray-50 p-5 rounded-3xl border-2 border-gray-200">
              <label htmlFor="description" className="block text-lg font-black text-gray-700 mb-3">
                📝 メモ
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                defaultValue={initialData?.description}
                placeholder="詳しい内容をここに書く..."
                className="w-full text-lg text-gray-800 placeholder:text-gray-400 bg-white border-2 border-gray-300 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-gray-200 focus:border-gray-400 resize-none"
              />
            </div>

            {/* 担当者 */}
            <div className="bg-emerald-50 p-5 rounded-3xl border-2 border-emerald-200">
              <label htmlFor="assigneeId" className="block text-lg font-black text-emerald-700 mb-3">
                👤 誰がやる？
              </label>
              <select
                name="assigneeId"
                id="assigneeId"
                defaultValue={initialData?.assigneeId || ""}
                className="w-full text-lg font-bold text-emerald-700 bg-white border-2 border-emerald-300 rounded-2xl px-4 py-4 focus:ring-4 focus:ring-emerald-200 focus:border-emerald-400 cursor-pointer"
              >
                <option value="">誰でもOK</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.displayName || profile.email}
                  </option>
                ))}
              </select>
            </div>

            {/* タグ */}
            <div className="bg-pink-50 p-5 rounded-3xl border-2 border-pink-200">
              <label htmlFor="tags" className="block text-lg font-black text-pink-700 mb-3">
                🏷️ タグ
              </label>
              <input
                type="text"
                name="tags"
                id="tags"
                defaultValue={initialData?.tags?.join(", ")}
                placeholder="例：畑, 野菜"
                className="w-full text-lg font-bold text-pink-700 placeholder:text-pink-300 bg-white border-2 border-pink-300 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-pink-200 focus:border-pink-400"
              />
              <p className="text-sm text-pink-500 mt-2">カンマ（,）で区切って入力</p>
            </div>
          </div>
        )}

        {/* 削除ボタン */}
        {initialData && onDelete && (
          <button
            type="button"
            onClick={() => {
              if (confirm("本当に削除しますか？")) {
                onDelete();
              }
            }}
            className="w-full flex items-center justify-center gap-3 py-5 text-xl font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-3xl hover:bg-red-100 transition-colors active:scale-98"
          >
            <Trash2 className="w-6 h-6" />
            🗑️ このタスクを削除
          </button>
        )}

        {/* 下部スペーサー */}
        <div className="h-32" />
      </div>

      {/* ===== 固定フッター ===== */}
      <div className="sticky bottom-0 left-0 right-0 p-5 bg-white border-t-2 border-gray-100 shadow-2xl pb-safe-bottom">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-5 text-xl font-black text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors active:scale-95"
          >
            ✕ やめる
          </button>
          <button
            type="submit"
            className="flex-[2] py-5 text-xl font-black text-white bg-blue-500 hover:bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/40 transition-all active:scale-95"
          >
            {initialData ? "✓ 保存する" : "＋ 追加する"}
          </button>
        </div>
      </div>
    </form>
  );
}
