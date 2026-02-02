"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";
import { Wifi, RefreshCw } from "lucide-react";

export function OfflineSyncManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();
  const { showToast } = useToast();

  // Check unsynced count
  const checkUnsynced = useCallback(async () => { // Wrapped in useCallback
    const count = await db.workLogs.where("synced").equals(0).count();
    setUnsyncedCount(count);
  }, []); // No deps

  const syncData = useCallback(async () => { // Wrapped in useCallback
    if (isSyncing) return;
    const unsyncedLogs = await db.workLogs.where("synced").equals(0).toArray();
    if (unsyncedLogs.length === 0) return;

    setIsSyncing(true);
    let successCount = 0;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; 

        for (const log of unsyncedLogs) {
            try {
                // 1. Upload Images
                const photoUrls: string[] = [];
                for (const base64 of log.images) {
                     const mimeMatch = base64.match(/^data:(.*?);base64,/);
                     const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
                     const extension = mimeType.split('/')[1];
                     
                     const res = await fetch(base64);
                     const blob = await res.blob();
                     const file = new File([blob], `offline-upload.${extension}`, { type: mimeType });

                     const fileName = `${log.taskId}/${Date.now()}-offline.${extension}`;
                     const { error: uploadError } = await supabase.storage
                        .from("work-logs")
                        .upload(fileName, file);
                     
                     if (!uploadError) {
                        const { data } = supabase.storage.from("work-logs").getPublicUrl(fileName);
                        photoUrls.push(data.publicUrl);
                     }
                }

                // 2. Insert Record
                const { error: insertError } = await supabase.from("task_work_logs").insert({
                    task_id: log.taskId,
                    user_id: user.id,
                    started_at: null,
                    photo_urls: photoUrls.length > 0 ? photoUrls : null,
                    notes: log.content,
                    created_at: log.createdAt
                });

                if (!insertError) {
                    // 3. Delete from Local DB
                    if (log.id) await db.workLogs.delete(log.id);
                    successCount++;
                }

            } catch (err) {
                console.error("Sync error for log:", log.id, err);
            }
        }

        if (successCount > 0) {
            showToast(`オフライン記録 (${successCount}件) を送信しました`, "success");
            checkUnsynced();
        }

    } catch (err) {
        console.error("Sync process error:", err);
    } finally {
        setIsSyncing(false);
    }
  }, [isSyncing, supabase, showToast, checkUnsynced]); // Added dependencies

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);
    checkUnsynced();

    const handleOnline = () => {
        setIsOnline(true);
        showToast("オンラインに復帰しました。同期を開始します...", "info");
        syncData();
    };

    const handleOffline = () => {
        setIsOnline(false);
        showToast("オフラインになりました。データは端末に保存されます。", "warning");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
    };
  }, [checkUnsynced, showToast, syncData]); // Added dependencies

  if (unsyncedCount === 0 && isOnline) return null;

  return (
    <div className="fixed bottom-24 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-gray-900/90 text-white rounded-full text-xs font-bold shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-5">
      {!isOnline ? (
         <>
           <Wifi className="w-3.5 h-3.5 text-gray-400" />
           <span>オフライン (未送信: {unsyncedCount})</span>
         </>
      ) : (
         <>
           <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
           <span>同期中... {unsyncedCount}件</span>
         </>
      )}
    </div>
  );
}
