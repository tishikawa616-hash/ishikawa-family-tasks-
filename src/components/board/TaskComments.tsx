"use client";

import { useEffect, useState, useCallback } from "react";
import { Send, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TaskComment } from "@/types/field";

interface TaskCommentsProps {
  taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchComments = useCallback(async () => {
    // Simplified query without profiles join (foreign key may not be configured)
    const { data, error } = await supabase
      .from("task_comments")
      .select("id, content, created_at, user_id")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    if (data) {
      setComments(
        data.map((c) => ({
          id: c.id,
          taskId,
          userId: c.user_id,
          userName: "ユーザー", // Default name since we can't fetch profiles
          userAvatar: undefined,
          content: c.content,
          createdAt: c.created_at,
        }))
      );
    }
  }, [supabase, taskId]);

  useEffect(() => {
    fetchComments();

    // Realtime subscription
    const channel = supabase
      .channel(`comments-${taskId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${taskId}` },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, taskId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from("task_comments").insert({
        task_id: taskId,
        user_id: user.id,
        content: newComment.trim(),
      });
      setNewComment("");
    }
    setLoading(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "今";
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          コメント ({comments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            コメントはまだありません
          </p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-sm font-bold text-gray-500">
              {comment.userName?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-800">
                  {comment.userName}
                </span>
                <span className="text-xs text-gray-400">
                  {formatTime(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="コメントを入力..."
          className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || loading}
          className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
