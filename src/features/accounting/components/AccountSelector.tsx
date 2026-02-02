'use client';

import { useState } from 'react';

// Default accounts based on 青色申告決算書（農業所得用）
// Reference: https://aoshin.jp/faq/a000094/
export const defaultAccounts = [
  // === 経費（支出）科目 ===
  { id: '1', code: '4101', name: '種苗費', name_simple: '種・苗', type: 'expense' },
  { id: '2', code: '4102', name: '肥料費', name_simple: '肥料', type: 'expense' },
  { id: '3', code: '4103', name: '農薬衛生費', name_simple: '農薬', type: 'expense' },
  { id: '4', code: '4104', name: '農具費', name_simple: '道具', type: 'expense' },
  { id: '5', code: '4105', name: '動力光熱費', name_simple: 'ガソリン・電気', type: 'expense' },
  { id: '6', code: '4106', name: '修繕費', name_simple: '修理', type: 'expense' },
  { id: '7', code: '4107', name: '諸材料費', name_simple: '資材', type: 'expense' },
  { id: '8', code: '4108', name: '荷造運賃手数料', name_simple: '送料・手数料', type: 'expense' },
  { id: '9', code: '4109', name: '地代・賃借料', name_simple: 'レンタル・土地代', type: 'expense' },
  { id: '10', code: '4110', name: '雇人費', name_simple: '人件費', type: 'expense' },
  { id: '11', code: '4111', name: '租税公課', name_simple: '税金・手数料', type: 'expense' },
  { id: '12', code: '4112', name: '農業共済掛金', name_simple: '保険', type: 'expense' },
  { id: '13', code: '4113', name: '作業用衣料費', name_simple: '作業着', type: 'expense' },
  { id: '14', code: '4114', name: '土地改良費', name_simple: '土地改良', type: 'expense' },
  { id: '15', code: '4115', name: '利子割引料', name_simple: '利息', type: 'expense' },
  { id: '16', code: '4199', name: '雑費', name_simple: 'その他', type: 'expense' },
  // === 収入科目 ===
  { id: '17', code: '5001', name: '売上高', name_simple: '売上', type: 'income' },
  { id: '18', code: '5002', name: '家事消費', name_simple: '自家消費', type: 'income' },
  { id: '19', code: '5003', name: '雑収入', name_simple: 'その他収入', type: 'income' },
  // Added by us for household
  // However, in DB seed/migration we might rely on DB IDs. 
  // This file seems to be a UI helper primarily.
];

interface AccountSelectorProps {
  value: string;
  onChange: (accountId: string) => void;
}

export default function AccountSelector({ value, onChange }: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = defaultAccounts.find(a => a.id === value);

  return (
    <div className="relative">
      {/* Display Selected */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-20 rounded-3xl bg-white border-2 border-[#78350F]/10 flex items-center justify-between px-6 text-2xl font-bold transition-all active:scale-98"
      >
        <span>{selected?.name_simple || 'なにに使った？'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-xl z-50 overflow-hidden border border-[#78350F]/10">
          {/* Expenses */}
          <div className="p-2">
            <div className="text-xs font-bold text-[#78350F]/50 px-4 py-2">経費（お金を使った）</div>
            {defaultAccounts.filter(a => a.type === 'expense').map(account => (
              <button
                key={account.id}
                type="button"
                onClick={() => {
                  onChange(account.id);
                  setIsOpen(false);
                }}
                className={`w-full h-16 rounded-2xl flex items-center px-6 text-xl font-bold transition-all ${
                  value === account.id ? 'bg-[#4D7C0F] text-white' : 'hover:bg-[#F8F7F2]'
                }`}
              >
                {account.name_simple}
              </button>
            ))}
          </div>
          
          {/* Income */}
          <div className="p-2 border-t border-[#78350F]/10">
            <div className="text-xs font-bold text-[#78350F]/50 px-4 py-2">売上（お金が入った）</div>
            {defaultAccounts.filter(a => a.type === 'income').map(account => (
              <button
                key={account.id}
                type="button"
                onClick={() => {
                  onChange(account.id);
                  setIsOpen(false);
                }}
                className={`w-full h-16 rounded-2xl flex items-center px-6 text-xl font-bold transition-all ${
                  value === account.id ? 'bg-[#4D7C0F] text-white' : 'hover:bg-[#F8F7F2]'
                }`}
              >
                {account.name_simple}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
