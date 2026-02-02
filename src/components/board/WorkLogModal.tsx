"use client";

import { useState, useRef } from "react";
import { X, Camera, Clock, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Drawer } from "vaul";

interface WorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
}

export function WorkLogModal({ isOpen, onClose, taskId, taskTitle }: WorkLogModalProps) {
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setPhotos((prev) => [...prev, ...files].slice(0, 5)); // Max 5 photos
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreviewUrls((prev) => [...prev, reader.result as string].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Allow offline save even if auth check fails (might be cached session or completely offline)
      // But ideally we need user ID. For PWA, session persists. 
      // If completely offline and no session, we might verify later. 
      // For now, assume user is required but handle error if offline.

      const isOnline = navigator.onLine;

      if (isOnline && user) {
        // --- ONLINE FLOW ---
        // Upload photos to Supabase Storage
        const photoUrls: string[] = [];
        for (const photo of photos) {
          const fileName = `${taskId}/${Date.now()}-${photo.name}`;
          const { error } = await supabase.storage
            .from("work-logs")
            .upload(fileName, photo);

          if (!error) {
            const { data } = supabase.storage.from("work-logs").getPublicUrl(fileName);
            photoUrls.push(data.publicUrl);
          }
        }

        // Create work log entry
        const { error: insertError } = await supabase.from("task_work_logs").insert({
          task_id: taskId,
          user_id: user.id,
          started_at: startTime ? new Date(`2000-01-01T${startTime}`).toISOString() : null,
          ended_at: endTime ? new Date(`2000-01-01T${endTime}`).toISOString() : null,
          photo_urls: photoUrls.length > 0 ? photoUrls : null,
          notes: notes.trim() || null,
        });
        
        if (insertError) throw insertError;
        alert("保存しました");

      } else {
        // --- OFFLINE FLOW ---
        // Convert images to Base64 for local storage
        const base64Images: string[] = [];
        for (const photo of photos) {
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(photo);
            });
            base64Images.push(base64);
        }

        // Save to Dexie
        const { db } = await import("@/lib/db");
        await db.workLogs.add({
            taskId,
            content: notes.trim(),
            images: base64Images,
            createdAt: new Date().toISOString(),
            synced: 0
        });
        
        alert("オフラインのため、端末に一時保存しました。ネット復帰時に自動送信されます。");
      }

      // Reset and close
      setNotes("");
      setPhotos([]);
      setPhotoPreviewUrls([]);
      setStartTime("");
      setEndTime("");
      onClose();
    } catch (error) {
      console.error("Work log save error:", error);
      alert("保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-3xl bg-white z-50 max-h-[85vh]">
          {/* Handle */}
          <div className="w-full flex justify-center py-4 shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-gray-300" />
          </div>

          {/* Header */}
          <div className="px-5 pb-4 flex items-center justify-between border-b border-gray-100">
            <div>
              <Drawer.Title className="text-xl font-bold text-gray-900">
                作業記録
              </Drawer.Title>
              <p className="text-sm text-gray-500 mt-0.5">{taskTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
            {/* Time */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-semibold text-gray-600">作業時間</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">開始</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-lg font-medium bg-white border border-gray-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">終了</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-lg font-medium bg-white border border-gray-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-semibold text-gray-600">写真（最大5枚）</span>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {photoPreviewUrls.map((url, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                {photos.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Camera className="w-6 h-6 text-gray-400" />
                  </button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                メモ
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="作業内容や気づいたことを記録..."
                rows={4}
                className="w-full text-base bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-5 py-4 border-t border-gray-100 pb-safe-bottom">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 text-base font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              <Save className="w-5 h-5" />
              {loading ? "保存中..." : "記録を保存"}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
