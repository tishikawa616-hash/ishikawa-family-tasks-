'use client';

import { useState } from 'react';
import { Copy, Check, UserPlus, Users, Crown, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Define expected structure from getGroupWithMembers
interface GroupData {
    id: string;
    name: string;
    invite_code: string;
    members: {
        user_id: string;
        role: string;
    }[];
    currentUserRole?: string;
}

interface FamilySettingsClientProps {
  initialGroup: GroupData | null;
  userInfo: { id: string; email: string };
  onJoinGroup: (code: string) => Promise<{ success: boolean; error?: string }>;
  onCreateGroup: (name: string) => Promise<{ success: boolean; error?: string }>;
}

export default function FamilySettingsClient({ 
  initialGroup, 
  userInfo,
  onJoinGroup,
  onCreateGroup
}: FamilySettingsClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const handleCopyCode = async () => {
    if (initialGroup?.invite_code) {
      await navigator.clipboard.writeText(initialGroup.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    
    setJoining(true);
    setJoinError(null);
    
    // Use prop action
    try {
        const result = await onJoinGroup(joinCode.trim());
        
        if (result.success) {
        setJoinSuccess(true);
        setTimeout(() => {
            router.refresh();
        }, 1500);
        } else {
        setJoinError(result.error || 'エラーが発生しました');
        }
    } catch (e) {
        setJoinError('通信エラー');
    }
    setJoining(false);
  };

  return (
    <main className="p-4 space-y-6">
      {/* Current Group Section */}
      {initialGroup && (
        <section className="rounded-2xl bg-white p-5 shadow-sm border border-orange-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800">{initialGroup.name}</h2>
              <p className="text-sm text-stone-500">
                {initialGroup.members.length} 人のメンバー
              </p>
            </div>
          </div>

          {/* Invite Code */}
          <div className="bg-orange-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-stone-500 mb-2">招待コード</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-2xl font-mono font-bold tracking-[0.3em] text-orange-800 text-center py-2 bg-white rounded-lg border border-orange-100">
                {initialGroup.invite_code}
              </div>
              <button
                onClick={handleCopyCode}
                className="w-14 h-14 rounded-xl bg-orange-500 text-white flex items-center justify-center transition-all hover:bg-orange-600 active:scale-95"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Copy className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-2 text-center">
              このコードを家族に共有してください
            </p>
          </div>

          {/* Members List */}
          <div className="space-y-2">
            <p className="text-sm text-stone-500 font-medium">メンバー</p>
            {initialGroup.members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 p-3 rounded-xl bg-stone-50"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  member.role === 'owner' 
                    ? 'bg-amber-100 text-amber-600' 
                    : 'bg-stone-200 text-stone-500'
                }`}>
                  {member.role === 'owner' ? (
                    <Crown className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-stone-700">
                    {member.user_id === userInfo.id ? 'あなた' : 'メンバー'}
                  </p>
                  <p className="text-xs text-stone-400">
                    {member.role === 'owner' ? 'オーナー' : 'メンバー'}
                  </p>
                </div>
                {member.user_id === userInfo.id && (
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600 font-bold">
                    自分
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Join Another Group Section */}
      <section className="rounded-2xl bg-white p-5 shadow-sm border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-800">グループに参加</h2>
            <p className="text-sm text-stone-500">
              招待コードで参加
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {joinSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-bold text-green-800">参加しました！</p>
              <p className="text-sm text-green-600">ページを更新中...</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="flex-1 h-14 px-4 text-lg font-mono tracking-[0.2em] text-center rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-blue-400 focus:bg-white outline-none transition-all"
                />
                <button
                  onClick={handleJoinGroup}
                  disabled={joining || joinCode.length < 6}
                  className="h-14 px-6 rounded-xl bg-blue-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-blue-600 active:scale-95"
                >
                  {joining ? '...' : '参加'}
                </button>
              </div>
              {joinError && (
                <p className="text-sm text-red-500 mt-2 font-bold">{joinError}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
