"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, Image, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WorkLog } from "@/types/field";
import Link from "next/link";

interface WorkLogWithTask extends WorkLog {
  taskTitle?: string;
  userName?: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<WorkLogWithTask[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from("task_work_logs")
      .select(`
        *,
        tasks:task_id (title),
        profiles:user_id (display_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setLogs(
        data.map((log) => ({
          id: log.id,
          taskId: log.task_id,
          userId: log.user_id,
          startedAt: log.started_at,
          endedAt: log.ended_at,
          photoUrls: log.photo_urls,
          notes: log.notes,
          createdAt: log.created_at,
          taskTitle: (log.tasks as { title?: string })?.title || "不明なタスク",
          userName: (log.profiles as { display_name?: string; email?: string })?.display_name || 
                    (log.profiles as { email?: string })?.email || "不明",
        }))
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">作業履歴</h1>
            <p className="text-sm text-gray-500">過去の作業記録を確認</p>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="px-4 py-6 space-y-4">
        {loading && (
          <div className="text-center py-12 text-gray-400">
            読み込み中...
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>作業記録がまだありません</p>
          </div>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">{log.taskTitle}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {log.userName} · {formatDate(log.createdAt!)}
                </p>
              </div>
              {log.startedAt && (
                <div className="text-right text-sm">
                  <span className="text-gray-500">
                    {formatTime(log.startedAt)} - {formatTime(log.endedAt)}
                  </span>
                </div>
              )}
            </div>

            {log.notes && (
              <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
                {log.notes}
              </p>
            )}

            {log.photoUrls && log.photoUrls.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {log.photoUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
