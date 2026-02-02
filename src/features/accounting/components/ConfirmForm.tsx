'use client';

import { useState } from 'react';
import AccountSelector, { defaultAccounts } from './AccountSelector';
import { saveTransaction } from '@/app/accounting/actions'; // Fixed import

interface ConfirmFormProps {
  initialData: {
    amount: number;
    date: string;
    category: string;
    description: string;
    ocr_text: string;
  }
}

export default function ConfirmForm({ initialData }: ConfirmFormProps) {
  // Find initial mock ID based on name match
  const findAccountId = (name: string) => {
    const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
    const target = normalize(name);
    return defaultAccounts.find(a => 
      normalize(a.name).includes(target) || normalize(a.name_simple).includes(target)
    )?.id || '6'; // Default to 雑費 (id 6) or '1'?
  };

  const [amount, setAmount] = useState(initialData.amount);
  const [date, setDate] = useState(initialData.date);
  const [description, setDescription] = useState(initialData.description);
  const [accountId, setAccountId] = useState(findAccountId(initialData.category));

  return (
    <form onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const result = await saveTransaction(formData);
        if (result.success) {
            window.location.href = '/accounting'; // Should use router.push but window works for full refresh which updates cache reliably
        } else {
            alert('保存に失敗しました: ' + result.error);
        }
    }} className="flex flex-col h-full">
      <div className="bg-white rounded-3xl p-8 shadow-[10px_10px_20px_#e0dfda,-10px_-10px_20px_#ffffff] mb-8 grow">
        <div className="flex flex-col space-y-8">
          
          {/* Amount */}
          <div className="flex flex-col">
            <span className="text-sm opacity-60 font-bold mb-1">金額</span>
            <div className="flex items-center border-b-2 border-[#4D7C0F]/20 pb-2">
                <span className="text-3xl font-bold text-[#4D7C0F] mr-2">¥</span>
                <input 
                    type="number" 
                    name="amount"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="text-5xl font-bold text-[#4D7C0F] bg-transparent w-full outline-none"
                />
            </div>
          </div>

          {/* Date */}
          <div className="flex flex-col">
            <span className="text-sm opacity-60 font-bold mb-1">日付</span>
            <input 
                type="date"
                name="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-2xl font-bold bg-transparent border-b-2 border-gray-200 outline-none py-1"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col relative z-20">
            <span className="text-sm opacity-60 font-bold mb-2">なにに使った？</span>
            {/* Hidden input to send the NAME to actions.ts (since logic expects name) */}
            <input 
                type="hidden" 
                name="category" 
                value={defaultAccounts.find(a => a.id === accountId)?.name_simple || '未分類'} 
            />
            <input type="hidden" name="accountId" value={accountId} />
            <input type="hidden" name="ocr_text" value={initialData.ocr_text} />
            <AccountSelector value={accountId} onChange={setAccountId} />
          </div>

          {/* Description */}
          <div className="flex flex-col">
            <span className="text-sm opacity-60 font-bold mb-1">メモ</span>
            <textarea 
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xl bg-transparent border-b-2 border-gray-200 outline-none w-full py-1 resize-none"
                rows={2}
            />
          </div>

        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pb-8">
         {/* Cancel / Back Button (Client side nav) */}
        <button 
            type="button"
            onClick={() => window.history.back()}
            className="flex-1 btn-mom bg-white text-[#78350F] border-2 border-[#78350F]/10"
        >
          戻る
        </button>

         {/* Submit Button */}
        <button type="submit" className="flex-1 btn-mom-action">
            OK！
        </button>
      </div>
    </form>
  );
}
