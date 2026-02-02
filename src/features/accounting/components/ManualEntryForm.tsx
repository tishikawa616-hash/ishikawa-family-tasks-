'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveTransaction } from '@/app/accounting/actions';
import { motion } from 'framer-motion';
import { PlusCircle, Home, Check } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  name_simple: string;
  type: 'expense' | 'income';
  business_ratio?: number;
}

interface ManualEntryFormProps {
  accounts: Account[];
}

export default function ManualEntryForm({ accounts }: ManualEntryFormProps) {
  const router = useRouter();
  
  const incomeAccounts = accounts.filter(a => a.type === 'income');
  const businessExpenseAccounts = accounts.filter(a => a.type === 'expense' && (a.business_ratio === undefined || a.business_ratio > 0)); 
  const householdExpenseAccounts = accounts.filter(a => a.type === 'expense' && a.business_ratio === 0);

  // Default to first business expense account
  const defaultAccountId = businessExpenseAccounts[0]?.id || accounts[0]?.id || '';
  
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    return jst.toISOString().split('T')[0];
  });
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    // Keep date and category for convenience
    setShowSuccess(false);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;

    setIsSubmitting(true);
    
    // Calculate business amount
    // const selectedAccount = accounts.find(a => a.id === accountId);
    
    const inputAmount = parseInt(amount) || 0;
    
    const formData = new FormData();
    formData.append('amount', inputAmount.toString());
    formData.append('date', date);
    formData.append('accountId', accountId);
    formData.append('description', description);
    
    const result = await saveTransaction(formData);
    
    if (result.success) {
      setSavedCount(prev => prev + 1);
      setShowSuccess(true);
    } else {
      setIsSubmitting(false);
      alert('保存に失敗しました: ' + result.error);
    }
  };

  const handleGoHome = () => {
    router.push('/');
    router.refresh();
  };

  // Success screen with options
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm bg-[#F8F7F2] rounded-[32px] p-8 shadow-2xl border border-white/50 text-center relative overflow-hidden"
        >
          {/* Decor */}
          <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-white/60 to-transparent -z-10" />
          
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-24 h-24 bg-[#4D7C0F] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-white"
          >
            <Check size={48} strokeWidth={4} />
          </motion.div>

          <h2 className="text-2xl font-bold text-[#78350F] mb-2">保存しました！</h2>
          {savedCount > 1 && (
            <p className="text-sm font-bold text-[#4D7C0F] mb-8 bg-[#4D7C0F]/10 inline-block px-4 py-1 rounded-full">
              今回 {savedCount} 件目
            </p>
          )}
          
          <div className="space-y-3 mt-8">
            {/* Continue entering */}
            <button
              onClick={resetForm}
              className="w-full h-16 rounded-2xl bg-[#4D7C0F] text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
              <PlusCircle size={24} />
              続けて入力する
            </button>
            
            {/* Go home */}
            <button
              onClick={handleGoHome}
              className="w-full h-16 rounded-2xl bg-[#F8F7F2] border-2 border-[#78350F]/10 text-[#78350F] font-bold text-lg shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-[#78350F]/5"
            >
              <Home size={24} />
              ホームに戻る
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => router.back()}
          className="text-2xl text-[#78350F] font-bold"
        >
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-[#78350F]">
          手入力 {savedCount > 0 && <span className="text-[#4D7C0F]">({savedCount}件済)</span>}
        </h1>
        <div className="w-12" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="text-sm opacity-60 font-bold mb-2 block">金額</label>
          <div className="flex items-center border-b-2 border-[#4D7C0F]/20 pb-2">
            <span className="text-3xl font-bold text-[#4D7C0F] mr-2">¥</span>
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              autoFocus
              className="text-4xl font-bold text-[#4D7C0F] bg-transparent w-full outline-none"
            />
          </div>
        </div>

        {/* Date */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="text-sm opacity-60 font-bold mb-2 block">日付</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="text-xl font-bold bg-transparent border-b-2 border-gray-200 outline-none py-1 w-full"
          />
        </div>

        {/* Category */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="text-sm opacity-60 font-bold mb-2 block">なにに使った？</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full text-xl font-bold bg-transparent border-b-2 border-gray-200 outline-none py-2"
          >
            {businessExpenseAccounts.length > 0 && (
              <optgroup label="事業経費（農業）">
                {businessExpenseAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name_simple}</option>
                ))}
              </optgroup>
            )}
            {householdExpenseAccounts.length > 0 && (
              <optgroup label="家計支出（生活）">
                {householdExpenseAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name_simple}</option>
                ))}
              </optgroup>
            )}
            {incomeAccounts.length > 0 && (
              <optgroup label="売上">
                {incomeAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name_simple}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="text-sm opacity-60 font-bold mb-2 block">メモ</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="何を買った？"
            className="text-xl bg-transparent border-b-2 border-gray-200 outline-none w-full py-1 resize-none"
            rows={2}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!amount || isSubmitting}
          className="w-full h-16 rounded-2xl bg-[#4D7C0F] text-white font-bold text-xl disabled:opacity-50 active:scale-95 transition-transform"
        >
          {isSubmitting ? '保存中...' : '記録する'}
        </button>
      </form>
    </div>
  );
}
