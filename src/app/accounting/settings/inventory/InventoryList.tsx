'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Package, Leaf, FlaskConical, Wrench, HelpCircle, X } from 'lucide-react';
import { addInventoryItem, deleteInventoryItem, type InventoryItem } from './actions';

const CATEGORIES = [
  { value: '収穫物', label: '収穫物', icon: Leaf, color: 'bg-orange-100 text-orange-600' },
  { value: '肥料', label: '肥料', icon: Package, color: 'bg-green-100 text-green-600' },
  { value: '農薬', label: '農薬', icon: FlaskConical, color: 'bg-purple-100 text-purple-600' },
  { value: '資材', label: '資材', icon: Wrench, color: 'bg-blue-100 text-blue-600' },
  { value: 'その他', label: 'その他', icon: HelpCircle, color: 'bg-gray-100 text-gray-600' },
];

const UNITS = ['個', 'kg', '袋', '本', 'L', '箱', 'セット'];

interface Props {
  items: InventoryItem[];
  fiscalYear: number;
}

export default function InventoryList({ items, fiscalYear }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Form state
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [unitPrice, setUnitPrice] = useState('');
  const [category, setCategory] = useState('収穫物');
  const [memo, setMemo] = useState('');

  const resetForm = () => {
    setItemName('');
    setQuantity('');
    setUnit('kg');
    setUnitPrice('');
    setCategory('収穫物');
    setMemo('');
  };

  const handleAdd = () => {
    if (!itemName || !quantity) return;
    
    const formData = new FormData();
    formData.append('fiscalYear', fiscalYear.toString());
    formData.append('itemName', itemName);
    formData.append('quantity', quantity);
    formData.append('unit', unit);
    formData.append('unitPrice', unitPrice || '0');
    formData.append('category', category);
    formData.append('memo', memo);
    
    startTransition(async () => {
      const result = await addInventoryItem(formData);
      if (result.success) {
        resetForm();
        setShowAddForm(false);
      } else {
        alert(result.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('この品目を削除しますか？')) return;
    
    setDeletingId(id);
    startTransition(async () => {
      await deleteInventoryItem(id);
      setDeletingId(null);
    });
  };

  const totalValue = items.reduce((sum, item) => sum + item.total_value, 0);
  
  const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[4];

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-amber-700">{fiscalYear}年末 棚卸資産合計</p>
            <p className="text-3xl font-bold text-amber-900">¥{totalValue.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-amber-600">{items.length}品目</p>
          </div>
        </div>
      </div>

      {/* Add Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-4 bg-white rounded-2xl border-2 border-dashed border-emerald-300 text-emerald-600 font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 active:scale-98 transition-all"
        >
          <Plus size={20} />
          棚卸品目を追加
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
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">新しい品目</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {/* Category Selection */}
              <div>
                <label className="text-sm font-bold text-gray-600 block mb-2">カテゴリ</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition-all ${
                          category === cat.value
                            ? cat.color + ' ring-2 ring-offset-1 ring-current'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Icon size={16} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="text-sm font-bold text-gray-600 block mb-1">品目名</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="例: サツマイモ（紅はるか）"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                />
              </div>

              {/* Quantity & Unit */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-bold text-gray-600 block mb-1">数量</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-xl font-bold"
                  />
                </div>
                <div className="w-24">
                  <label className="text-sm font-bold text-gray-600 block mb-1">単位</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-400 outline-none bg-white"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit Price */}
              <div>
                <label className="text-sm font-bold text-gray-600 block mb-1">単価 (円)</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-400">¥</span>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0"
                    className="flex-1 p-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-xl font-bold"
                  />
                </div>
                {quantity && unitPrice && (
                  <p className="text-sm text-emerald-600 font-bold mt-2">
                    合計: ¥{(parseFloat(quantity) * parseInt(unitPrice)).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Memo */}
              <div>
                <label className="text-sm font-bold text-gray-600 block mb-1">メモ（任意）</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="例: 倉庫Aに保管"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-emerald-400 outline-none"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleAdd}
                disabled={isPending || !itemName || !quantity}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-50 active:scale-98 transition-transform"
              >
                {isPending ? '保存中...' : '追加する'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item List */}
      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item) => {
            const catInfo = getCategoryInfo(item.category);
            const CatIcon = catInfo.icon;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${catInfo.color} flex items-center justify-center shrink-0`}>
                    <CatIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{item.item_name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} {item.unit} × ¥{item.unit_price.toLocaleString()}
                    </p>
                    {item.memo && (
                      <p className="text-xs text-gray-400 mt-1">📝 {item.memo}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-emerald-700">¥{item.total_value.toLocaleString()}</p>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="text-red-400 hover:text-red-600 mt-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {items.length === 0 && !showAddForm && (
          <div className="text-center py-12 opacity-50">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-bold text-gray-400">まだ棚卸品目がありません</p>
            <p className="text-sm text-gray-400 mt-1">年末の在庫を記録しましょう</p>
          </div>
        )}
      </div>
    </div>
  );
}
