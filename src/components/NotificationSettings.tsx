"use client";

import { Bell, BellOff, AlertTriangle } from "lucide-react";
import { usePushSubscription } from "@/hooks/usePushSubscription";

export function NotificationSettings() {
  const { isSupported, subscription, permissionState, loading, subscribe, unsubscribe } = usePushSubscription();

  if (loading) {
    return (
      <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse">
        <div className="h-6 w-32 bg-slate-100 rounded mb-4" />
        <div className="h-10 w-full bg-slate-50 rounded-xl" />
      </section>
    );
  }

  if (!isSupported) {
    return (
        <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm opacity-60">
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-slate-100 p-2 rounded-lg">
                    <BellOff className="w-5 h-5 text-slate-500" />
                </div>
                <h2 className="font-bold text-slate-800">通知設定</h2>
            </div>
            <p className="text-sm text-slate-500">このデバイスはプッシュ通知に対応していません。</p>
        </section>
    );
  }

  const isDenied = permissionState === "denied";

  return (
    <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${subscription ? "bg-blue-100" : "bg-slate-100"}`}>
          <Bell className={`w-5 h-5 ${subscription ? "text-blue-600" : "text-slate-500"}`} />
        </div>
        <h2 className="font-bold text-slate-800">通知設定</h2>
      </div>

      <div className="space-y-4">
        {isDenied && (
             <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start gap-2">
                 <AlertTriangle className="w-5 h-5 shrink-0" />
                 <span>
                     通知がブラウザでブロックされています。ブラウザの設定から通知を許可してください。
                 </span>
             </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-700">プッシュ通知</p>
            <p className="text-xs text-slate-400">タスクの割り当てや更新をお知らせします</p>
          </div>
          
          {subscription ? (
             <button
               onClick={unsubscribe}
               className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
             >
               無効にする
             </button>
          ) : (
             <button
                onClick={subscribe}
                disabled={isDenied}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200"
             >
               有効にする
             </button>
          )}
        </div>
      </div>
    </section>
  );
}
