"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { Save, SkipForward } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CompletionWorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  taskId: string;
  taskTitle: string;
}

export function CompletionWorkLogModal({ isOpen, onClose, onSaved, taskId, taskTitle }: CompletionWorkLogModalProps) {
  const [duration, setDuration] = useState("");
  const [unit, setUnit] = useState<"minutes" | "hours">("minutes");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!duration) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { 
        // If offline/no-auth, we might skip or use Dexie. 
        // For simplicity reusing offline logic would be best, but let's stick to basic insert for now 
        // and assume online/auth or handle error gracefully.
        // Actually, we should probably support offline here too since it's a core feature.
        // But let's start simple.
        throw new Error("User not authenticated");
      }

      const numDuration = parseFloat(duration);
      if (isNaN(numDuration) || numDuration <= 0) return;

      const durationInMinutes = unit === "hours" ? numDuration * 60 : numDuration;
      
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - durationInMinutes * 60000);

      // Create work log
      const { error } = await supabase.from("work_logs").insert({
        task_id: taskId,
        user_id: user.id,
        started_at: startTime.toISOString(),
        ended_at: endTime.toISOString(),
        notes: "タスク完了時入力",
      });

      if (error) throw error;
      
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error saving completion log:", error);
      // Fallback: If network error, maybe try offline DB?
      // For now, simple alert.
      alert("保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-3xl bg-white z-50">
          <div className="w-full flex justify-center py-4 shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-gray-300" />
          </div>

          <div className="px-5 pb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">お疲れ様でした！</h2>
            <p className="text-sm text-gray-500">&quot;{taskTitle}&quot; の作業時間を記録しますか？</p>
          </div>

          <div className="px-5 py-4 space-y-6">
            <div className="flex items-end gap-3">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">作業時間</label>
                    <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="0"
                        className="w-full text-3xl font-bold border-b-2 border-gray-200 focus:border-blue-500 px-1 py-2 bg-transparent outline-none"
                        autoFocus
                    />
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1 shrink-0">
                    <button
                        onClick={() => setUnit("minutes")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${unit === "minutes" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        分
                    </button>
                    <button
                        onClick={() => setUnit("hours")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${unit === "hours" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        時間
                    </button>
                </div>
            </div>

            <div className="flex gap-3 pt-4 pb-safe-bottom">
                <button
                    onClick={onClose}
                    className="flex-1 py-3.5 flex items-center justify-center gap-2 text-gray-500 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                >
                    <SkipForward className="w-4 h-4" />
                    スキップ
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!duration || loading}
                    className="flex-[2] py-3.5 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all"
                >
                    <Save className="w-4 h-4" />
                    {loading ? "保存中..." : "記録して完了"}
                </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
