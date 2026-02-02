'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Banknote, PlusCircle, Trash2, Check, X, User } from 'lucide-react';
import { 
  addFamilyMember, 
  addWallet, 
  updateWalletBalance,
  deleteWallet,
  deleteFamilyMember 
} from '@/app/accounting/assets/actions'; // Fixed import

import { FamilyMember, Wallet as WalletType } from '@/features/accounting/types/database'; // Fixed import

interface FamilyMemberWithWallets extends FamilyMember {
  wallets: WalletType[];
}

interface AssetsManagerProps {
  initialMembers: FamilyMemberWithWallets[];
}

export default function AssetsManager({ initialMembers }: AssetsManagerProps) {
  const router = useRouter();
  const members = initialMembers;
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [addingWalletFor, setAddingWalletFor] = useState<string | null>(null);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<'cash' | 'bank'>('bank');
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedWalletId, setSavedWalletId] = useState<string | null>(null);
  const [confirmDeleteWallet, setConfirmDeleteWallet] = useState<string | null>(null);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<string | null>(null);

  const handleAddMember = async () => {
    if (!newMemberName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    const result = await addFamilyMember(newMemberName.trim());
    if (result.success) {
      setNewMemberName('');
      setShowAddMember(false);
      router.refresh();
    }
    setIsSubmitting(false);
  };

  const handleAddWallet = async (memberId: string) => {
    if (!newWalletName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    const result = await addWallet(memberId, newWalletName.trim(), newWalletType);
    if (result.success) {
      setNewWalletName('');
      setAddingWalletFor(null);
      router.refresh();
    }
    setIsSubmitting(false);
  };

  const handleUpdateBalance = async (walletId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const balance = parseInt(editBalance) || 0;
    const result = await updateWalletBalance(walletId, balance);
    if (result.success) {
      setEditingWallet(null);
      setEditBalance('');
      setSavedWalletId(walletId);
      setTimeout(() => setSavedWalletId(null), 1500);
      router.refresh();
    }
    setIsSubmitting(false);
  };

  const handleDeleteWallet = async (walletId: string) => {
    await deleteWallet(walletId);
    setConfirmDeleteWallet(null);
    router.refresh();
  };

  const handleDeleteMember = async (memberId: string) => {
    await deleteFamilyMember(memberId);
    setConfirmDeleteMember(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Members List */}
      {members.length === 0 ? (
        <div className="bg-white rounded-[24px] p-10 text-center opacity-60 font-bold shadow-sm border-2 border-dashed border-gray-200">
          <User size={48} className="mx-auto mb-4 text-gray-300" />
          まだメンバーがいません
        </div>
      ) : (
        members.map(member => (
          <motion.div 
            key={member.id} 
            layout
            className="bg-white rounded-[24px] p-5 shadow-[4px_4px_16px_rgba(0,0,0,0.06)] border border-gray-100"
          >
            {/* Member Header */}
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#78350F]/10 flex items-center justify-center">
                  <User size={20} className="text-[#78350F]" />
                </div>
                <h3 className="text-xl font-bold text-[#78350F]">{member.name}</h3>
              </div>
              
              {confirmDeleteMember === member.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-500 font-bold">削除する？</span>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-2 bg-red-500 text-white rounded-full"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteMember(null)}
                    className="p-2 bg-gray-200 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteMember(member.id)}
                  className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {/* Wallets */}
            <div className="space-y-3">
              <AnimatePresence>
                {member.wallets.map(wallet => (
                  <motion.div 
                    key={wallet.id} 
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`relative p-4 rounded-2xl border-2 transition-all ${
                      savedWalletId === wallet.id 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-100 bg-gray-50/50'
                    }`}
                  >
                    {/* Saved indicator */}
                    <AnimatePresence>
                      {savedWalletId === wallet.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <Check size={14} className="text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          wallet.wallet_type === 'cash' 
                            ? 'bg-amber-100 text-amber-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {wallet.wallet_type === 'cash' ? <Banknote size={20} /> : <Wallet size={20} />}
                        </div>
                        <span className="font-bold text-[#78350F]">{wallet.name}</span>
                      </div>
                      
                      {editingWallet === wallet.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-400">¥</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={editBalance}
                            onChange={(e) => setEditBalance(e.target.value)}
                            className="w-32 h-12 text-right text-xl font-bold border-2 border-[#4D7C0F] rounded-xl px-3 bg-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateBalance(wallet.id)}
                            disabled={isSubmitting}
                            className="h-12 px-4 bg-[#4D7C0F] text-white rounded-xl font-bold disabled:opacity-50"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingWallet(null)}
                            className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingWallet(wallet.id);
                              setEditBalance(wallet.balance.toString());
                            }}
                            className="text-2xl font-bold text-[#4D7C0F] hover:underline"
                          >
                            ¥{wallet.balance.toLocaleString()}
                          </button>
                          
                          {confirmDeleteWallet === wallet.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteWallet(wallet.id)}
                                className="p-2 bg-red-500 text-white rounded-full"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteWallet(null)}
                                className="p-2 bg-gray-200 rounded-full"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteWallet(wallet.id)}
                              className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add Wallet */}
            <AnimatePresence>
              {addingWalletFor === member.id ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-[#F8F7F2] rounded-2xl space-y-4 overflow-hidden"
                >
                  <input
                    type="text"
                    placeholder="口座名（例：JAバンク）"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    className="w-full h-14 border-2 border-gray-200 rounded-xl px-4 text-lg font-bold focus:border-[#4D7C0F] focus:outline-none"
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setNewWalletType('cash')}
                      className={`h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        newWalletType === 'cash' 
                          ? 'bg-amber-500 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Banknote size={20} /> 現金
                    </button>
                    <button
                      onClick={() => setNewWalletType('bank')}
                      className={`h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        newWalletType === 'bank' 
                          ? 'bg-blue-500 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Wallet size={20} /> 銀行
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAddWallet(member.id)}
                      disabled={!newWalletName.trim() || isSubmitting}
                      className="h-14 bg-[#4D7C0F] text-white rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <PlusCircle size={20} /> 追加
                    </button>
                    <button
                      onClick={() => setAddingWalletFor(null)}
                      className="h-14 bg-gray-200 rounded-xl font-bold text-lg"
                    >
                      キャンセル
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={() => setAddingWalletFor(member.id)}
                  className="mt-4 w-full h-14 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold flex items-center justify-center gap-2 hover:border-[#4D7C0F] hover:text-[#4D7C0F] transition-colors"
                >
                  <PlusCircle size={20} /> 口座を追加
                </button>
              )}
            </AnimatePresence>
          </motion.div>
        ))
      )}

      {/* Add Member Button */}
      <AnimatePresence>
        {showAddMember ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-[24px] p-5 shadow-sm space-y-4"
          >
            <input
              type="text"
              placeholder="名前（例：母）"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full h-16 border-2 border-gray-200 rounded-xl px-4 text-xl font-bold focus:border-[#4D7C0F] focus:outline-none"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleAddMember}
                disabled={!newMemberName.trim() || isSubmitting}
                className="h-16 bg-[#4D7C0F] text-white rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <PlusCircle size={20} /> 追加
              </button>
              <button
                onClick={() => setShowAddMember(false)}
                className="h-16 bg-gray-200 rounded-xl font-bold text-lg"
              >
                キャンセル
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            layout
            onClick={() => setShowAddMember(true)}
            className="w-full h-16 bg-white border-2 border-[#4D7C0F] text-[#4D7C0F] rounded-[24px] font-bold text-lg flex items-center justify-center gap-2 shadow-sm hover:bg-[#4D7C0F]/5 transition-colors"
          >
            <User size={20} /> メンバーを追加
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
