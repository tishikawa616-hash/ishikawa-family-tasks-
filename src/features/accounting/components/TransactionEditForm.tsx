'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTransaction, deleteTransaction } from '@/app/accounting/actions';
import TransactionComments from './TransactionComments';
import { TransactionComment } from '@/features/accounting/types/database';

interface Account {
  id: string;
  name: string;
  name_simple: string;
  account_type_id: number;
}

interface TransactionEditFormProps {
  transaction: {
    id: string;
    amount: number;
    date: string;
    description: string;
    account_id: string;
  };
  accounts: Account[];
  comments: TransactionComment[];
  currentUserId: string;
}

export default function TransactionEditForm({ transaction, accounts, comments, currentUserId }: TransactionEditFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState(transaction.amount);
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description);
  const [accountId, setAccountId] = useState(transaction.account_id);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Updated ID mapping: 1=income, 2=expense (business), 3=expense (household/other)
  // Assuming simple logic for now based on what we have.
  // Original code: 2=expense, 1=income.
  const expenseAccounts = accounts.filter(a => a.account_type_id === 2 || a.account_type_id === 3); 
  const incomeAccounts = accounts.filter(a => a.account_type_id === 1);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteTransaction(transaction.id);
  };

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
        <h1 className="text-xl font-bold text-[#78350F]">記録を直す</h1>
        <div className="w-12" />
      </div>

      {/* Form */}
      {/* Form */}
      <form onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const result = await updateTransaction(transaction.id, formData);
        if (result.success) {
          router.push('/accounting/list');
          router.refresh();
        } else {
          alert('更新に失敗しました: ' + result.error);
        }
      }} className="space-y-6">
        {/* Removed hidden input for id as it is passed directly */}
        {/* Amount */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="text-sm opacity-60 font-bold mb-2 block">金額</label>
          <div className="flex items-center border-b-2 border-[#4D7C0F]/20 pb-2">
            <span className="text-3xl font-bold text-[#4D7C0F] mr-2">¥</span>
            <input
              type="number"
              name="amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-4xl font-bold text-[#4D7C0F] bg-transparent w-full outline-none"
            />
          </div>
        </div>

        {/* Date */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="text-sm opacity-60 font-bold mb-2 block">日付</label>
          <input
            type="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xl font-bold bg-transparent border-b-2 border-gray-200 outline-none py-1 w-full"
          />
        </div>

        {/* Category */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="text-sm opacity-60 font-bold mb-2 block">なにに使った？</label>
          <select
            name="accountId"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full text-xl font-bold bg-transparent border-b-2 border-gray-200 outline-none py-2"
          >
            <optgroup label="経費（お金を使った）">
              {expenseAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name_simple}</option>
              ))}
            </optgroup>
            <optgroup label="売上（お金が入った）">
              {incomeAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name_simple}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="text-sm opacity-60 font-bold mb-2 block">メモ</label>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-xl bg-transparent border-b-2 border-gray-200 outline-none w-full py-1 resize-none"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 h-16 rounded-2xl bg-red-100 text-red-600 font-bold text-xl"
          >
            消す
          </button>
          <button
            type="submit"
            className="flex-1 h-16 rounded-2xl bg-[#4D7C0F] text-white font-bold text-xl"
          >
            保存
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full">
            <h2 className="text-xl font-bold text-center mb-4">本当に消しますか？</h2>
            <p className="text-center opacity-60 mb-6">この記録は元に戻せません</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-14 rounded-2xl bg-gray-100 font-bold"
                disabled={isDeleting}
              >
                やめる
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-14 rounded-2xl bg-red-500 text-white font-bold"
                disabled={isDeleting}
              >
                {isDeleting ? '消しています...' : '消す'}
              </button>
            </div>
          </div>
        </div>
      )}

      <TransactionComments 
        transactionId={transaction.id}
        comments={comments}
        currentUserId={currentUserId}
      />
    </div>
  );
}
