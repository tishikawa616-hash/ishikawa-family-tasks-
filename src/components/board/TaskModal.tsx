"use client";

import { useCallback, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { Column, Task } from "@/types/board";
import { Drawer } from "vaul";
import { TaskForm } from "@/components/tasks/TaskForm";

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
    fieldId?: string;
    recurrence?: {
      type: "daily" | "weekly" | "monthly";
      interval: number;
      endDate?: string;
    };
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
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm"
        onClick={() => props.onClose()}
      >
        <div
          className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col border border-white/50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-xl font-bold text-gray-800">
              {props.initialData ? "タスクを編集" : "新しいタスク"}
            </h2>
            <button
              onClick={props.onClose}
              className="p-2 rounded-full bg-gray-100/50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <TaskForm {...props} onCancel={props.onClose} />
        </div>
      </div>
    );
  }

  // Mobile Drawer (Fallback, though we plan to allow full page override in page.tsx)
  return (
    <Drawer.Root 
      open={props.isOpen} 
      onOpenChange={(open) => !open && props.onClose()}
      snapPoints={[0.95]}
      activeSnapPoint={0.95}
      setActiveSnapPoint={() => {}}
      dismissible={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={props.onClose} />
        <Drawer.Content 
          className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-[32px] bg-[#F7F9FC] z-50 after:hidden"
          style={{ height: '95vh' }}
        >
          {/* Handle */}
          <div className="w-full flex justify-center py-3 bg-transparent shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-gray-300/80" />
          </div>
          
          {/* Header */}
          <div className="px-6 pb-2 shrink-0 flex justify-between items-center">
            <Drawer.Title className="text-2xl font-bold text-gray-900 tracking-tight">
              {props.initialData ? "編集" : "新規作成"}
            </Drawer.Title>
            <button onClick={props.onClose} className="p-2 bg-gray-200/50 rounded-full hover:bg-gray-200 transition-colors">
                <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <TaskForm {...props} onCancel={props.onClose} />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
