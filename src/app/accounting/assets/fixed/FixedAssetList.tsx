'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Calendar, DollarSign, Clock, HelpCircle } from 'lucide-react';
import { FixedAsset } from '@/features/accounting/types/database';
import { addFixedAsset, deleteFixedAsset } from './actions';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  initialAssets: FixedAsset[];
}

export default function FixedAssetList({ initialAssets }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [usefulLifeYears, setUsefulLifeYears] = useState('7'); // Default 7 years (common for machinery)
  const [memo, setMemo] = useState('');

  const resetForm = () => {
    setName('');
    setPurchasePrice('');
    setPurchaseDate('');
    setUsefulLifeYears('7');
    setMemo('');
  };

  const handleAdd = () => {
    if (!name || !purchasePrice || !purchaseDate) return;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('purchasePrice', purchasePrice);
    formData.append('purchaseDate', purchaseDate);
    formData.append('usefulLifeYears', usefulLifeYears);
    formData.append('memo', memo);

    startTransition(async () => {
      const result = await addFixedAsset(formData);
      if (result.success) {
        setShowAddForm(false);
        resetForm();
      } else {
        alert("追加に失敗しました: " + result.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if(!confirm("本当に削除しますか？")) return;
    startTransition(async () => {
       await deleteFixedAsset(id);
    });
  };

  return (
    <div className="space-y-6">
       {/* Add Button */}
       {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-4 bg-white rounded-2xl border-2 border-dashed border-emerald-300 text-emerald-600 font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 active:scale-98 transition-all"
        >
          <Plus size={20} />
          固定資産を登録
        </button>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
            >
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 space-y-4 mb-6">
                    <h3 className="font-bold text-gray-800">資産の登録</h3>

                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">資産の名前</label>
                        <input 
                            type="text" 
                            value={name} onChange={e => setName(e.target.value)}
                            placeholder="例: トラクター"
                            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-emerald-400"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">購入金額</label>
                            <input 
                                type="number" 
                                value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)}
                                placeholder="円"
                                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-emerald-400"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">購入日</label>
                            <input 
                                type="date" 
                                value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-emerald-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">耐用年数（年）</label>
                         <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                value={usefulLifeYears} onChange={e => setUsefulLifeYears(e.target.value)}
                                className="w-24 p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-emerald-400"
                            />
                            <span className="text-sm text-gray-400">年で償却</span>
                         </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">メモ</label>
                        <textarea 
                            value={memo} onChange={e => setMemo(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-emerald-400 h-20 resize-none"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button 
                            onClick={() => setShowAddForm(false)}
                            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                        >
                            キャンセル
                        </button>
                        <button 
                            onClick={handleAdd}
                            disabled={!name || !purchasePrice || !purchaseDate || isPending}
                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
                        >
                            保存
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* List */}
      <div className="space-y-3">
        {initialAssets.map(asset => (
             <div key={asset.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-start">
                 <div>
                     <h3 className="font-bold text-stone-800 text-lg">{asset.name}</h3>
                     <div className="flex items-center gap-3 text-sm text-stone-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={14}/> {asset.purchase_date}</span>
                        <span className="flex items-center gap-1"><Clock size={14}/> {asset.useful_life_years}年</span>
                     </div>
                     <p className="text-emerald-700 font-bold mt-2 text-lg">¥{asset.purchase_price.toLocaleString()}</p>
                 </div>
                 <button 
                    onClick={() => handleDelete(asset.id)}
                    className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                 >
                    <Trash2 size={18} />
                 </button>
             </div>
        ))}
        
        {initialAssets.length === 0 && !showAddForm && (
            <div className="text-center py-10 opacity-50">
                <p>登録された固定資産はありません</p>
            </div>
        )}
      </div>
    </div>
  );
}
