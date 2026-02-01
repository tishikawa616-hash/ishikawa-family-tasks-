"use client";

import { useState } from "react";
import { Save, SkipForward, Clock, Leaf } from "lucide-react";
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
  const [harvestQuantity, setHarvestQuantity] = useState("");
  const [harvestUnit, setHarvestUnit] = useState("kg");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!duration) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { 
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
        harvest_quantity: harvestQuantity ? parseFloat(harvestQuantity) : null,
        harvest_unit: harvestQuantity ? harvestUnit : null,
      });

      if (error) throw error;
      
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error saving completion log:", error);
      alert("保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-8 pb-4 text-center shrink-0">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🎉
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">お疲れ様でした！</h2>
          <p className="text-sm text-gray-500 break-words leading-relaxed px-4">
            <span className="font-semibold text-gray-800">"{taskTitle}"</span><br/>
            の作業を記録しますか？
          </p>
        </div>

        <div className="px-6 py-2 overflow-y-auto flex-1 space-y-6">
          {/* Work Time Input */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3 text-gray-500">
                <Clock className="w-4 h-4" />
                <label className="text-xs font-bold uppercase tracking-wider">作業時間</label>
            </div>
            
            <div className="flex items-end gap-3">
                <div className="flex-1">
                    <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="0"
                        className="w-full text-4xl font-bold bg-transparent outline-none placeholder:text-gray-300 text-gray-900"
                        autoFocus
                    />
                </div>
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200 shrink-0">
                    <button
                        onClick={() => setUnit("minutes")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            unit === "minutes" 
                                ? "bg-blue-500 text-white shadow-sm" 
                                : "text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                        分
                    </button>
                    <button
                        onClick={() => setUnit("hours")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            unit === "hours" 
                                ? "bg-blue-500 text-white shadow-sm" 
                                : "text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                        時間
                    </button>
                </div>
            </div>
          </div>

          {/* Harvest Input (Optional) */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3 text-gray-500">
                <Leaf className="w-4 h-4" />
                <label className="text-xs font-bold uppercase tracking-wider">収穫量 (任意)</label>
            </div>
            
            <div className="flex items-end gap-3">
                <div className="flex-1">
                    <input
                        type="number"
                        value={harvestQuantity}
                        onChange={(e) => setHarvestQuantity(e.target.value)}
                        placeholder="0"
                        className="w-full text-3xl font-bold bg-transparent outline-none placeholder:text-gray-300 text-gray-900"
                    />
                </div>
                <div className="shrink-0 w-24">
                     <select
                        value={harvestUnit}
                        onChange={(e) => setHarvestUnit(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                     >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="個">個</option>
                        <option value="箱">箱</option>
                        <option value="束">束</option>
                     </select>
                </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 flex items-center gap-3 shrink-0">
          <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-gray-500 font-medium hover:bg-gray-100 active:scale-95 transition-all"
          >
              <SkipForward className="w-5 h-5" />
              スキップ
          </button>
          <button
              onClick={handleSubmit}
              disabled={!duration || loading}
              className={`flex-[2] flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-all ${
                  !duration || loading
                      ? "bg-gray-300 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              }`}
          >
              <Save className="w-5 h-5" />
              {loading ? "保存中..." : "記録する"}
          </button>
        </div>
      </div>
    </div>
  );
}
