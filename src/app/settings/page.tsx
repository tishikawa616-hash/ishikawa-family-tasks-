"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save, User as UserIcon, Coins } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hourlyWage, setHourlyWage] = useState("1000");
  const [displayName, setDisplayName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("hourly_wage, display_name")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setHourlyWage(String(profile.hourly_wage || 1000));
          setDisplayName(profile.display_name || "");
        } else {
            // Check if user has metadata in auth
            setDisplayName(user.user_metadata.display_name || user.email?.split('@')[0] || "");
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updates = {
        id: user.id,
        hourly_wage: parseInt(hourlyWage, 10),
        display_name: displayName,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      
      alert("設定を保存しました");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-28">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 safe-p-top sticky top-0 z-20">
        <div className="max-w-lg mx-auto flex items-center justify-between">
            <Link href="/" className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <h1 className="text-lg font-bold text-slate-800">設定</h1>
            <div className="w-9" /> {/* Spacer */}
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        
        {/* Profile Section */}
        <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="font-bold text-slate-800">プロフィール設定</h2>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">表示名</label>
                    <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                        placeholder="名前を入力"
                    />
                </div>
            </div>
        </section>

        {/* Agricultural Settings */}
        <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-amber-100 p-2 rounded-lg">
                    <Coins className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="font-bold text-slate-800">経営設定</h2>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">想定時給 (概算人件費の計算用)</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={hourlyWage}
                            onChange={(e) => setHourlyWage(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 outline-none focus:border-amber-500 transition-colors font-mono font-bold text-lg"
                            placeholder="1000"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">円/時</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        ※ この設定はレポート画面のコスト計算に使用されます。実際の給与計算とは異なります。
                    </p>
                </div>
            </div>
        </section>
        
        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 safe-p-bottom">
            <div className="max-w-lg mx-auto">
                <button 
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    {saving ? "保存中..." : "設定を保存する"}
                </button>
            </div>
        </div>

      </main>
    </div>
  );
}
