"use client";

import { Account } from "@/features/accounting/types/database"; // Updated import
import { updateAccountRatio } from "../actions";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Check, RotateCcw, Zap } from "lucide-react";

// Preset configurations for common scenarios
const PRESETS = [
  { label: "すべて100%", description: "全科目を事業用に", values: { default: 100 } },
  { label: "農業標準", description: "動力光熱費50%・通信費30%", values: { "4105": 50, "6006": 30, default: 100 } },
];

interface AccountWithRatio extends Account {
  localRatio: number;
  originalRatio: number;
  hasChanged: boolean;
}

export default function AccountRatioList({ accounts }: { accounts: Account[] }) {
  const [isPending, startTransition] = useTransition();
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Initialize with local state for each account
  const [localAccounts, setLocalAccounts] = useState<AccountWithRatio[]>(
    accounts.map(acc => ({
      ...acc,
      localRatio: acc.business_ratio ?? 100,
      originalRatio: acc.business_ratio ?? 100,
      hasChanged: false,
    }))
  );

  const handleSliderChange = (accountId: string, newRatio: number) => {
    setLocalAccounts(prev => prev.map(acc => 
      acc.id === accountId 
        ? { ...acc, localRatio: newRatio, hasChanged: newRatio !== acc.originalRatio }
        : acc
    ));
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setLocalAccounts(prev => prev.map(acc => {
      const presetValue = (preset.values as any)[acc.code] ?? preset.values.default;
      return {
        ...acc,
        localRatio: presetValue,
        hasChanged: presetValue !== acc.originalRatio,
      };
    }));
  };

  const resetAll = () => {
    setLocalAccounts(prev => prev.map(acc => ({
      ...acc,
      localRatio: acc.originalRatio,
      hasChanged: false,
    })));
  };

  const saveAll = async () => {
    const changedAccounts = localAccounts.filter(acc => acc.hasChanged);
    if (changedAccounts.length === 0) return;

    startTransition(async () => {
      try {
        for (const acc of changedAccounts) {
          await updateAccountRatio(acc.id, acc.localRatio);
        }
        // Update original values after save
        setLocalAccounts(prev => prev.map(acc => ({
          ...acc,
          originalRatio: acc.localRatio,
          hasChanged: false,
        })));
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
      } catch (e) {
        alert("保存に失敗しました");
      }
    });
  };

  const hasAnyChanges = localAccounts.some(acc => acc.hasChanged);
  const changedCount = localAccounts.filter(acc => acc.hasChanged).length;

  return (
    <div className="space-y-6">
      {/* Preset Buttons */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={18} className="text-emerald-600" />
          <span className="font-bold text-emerald-800">かんたん設定</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => applyPreset(preset)}
              className="px-4 py-2 bg-white rounded-xl text-sm font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 active:scale-95 transition-all"
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={resetAll}
            className="px-4 py-2 bg-white rounded-xl text-sm font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1"
          >
            <RotateCcw size={14} />
            リセット
          </button>
        </div>
      </div>

      {/* Account List with Sliders */}
      <div className="space-y-3">
        {localAccounts.map((account) => (
          <motion.div
            key={account.id}
            layout
            className={`bg-white p-4 rounded-xl shadow-sm border-2 transition-colors ${
              account.hasChanged ? "border-amber-300 bg-amber-50/30" : "border-stone-100"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold text-lg text-stone-800">{account.name_simple}</div>
                <div className="text-xs text-stone-400">{account.name}</div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  account.localRatio === 100 ? "text-emerald-600" :
                  account.localRatio === 0 ? "text-gray-400" :
                  "text-amber-600"
                }`}>
                  {account.localRatio}%
                </div>
                {account.hasChanged && (
                  <div className="text-xs text-amber-600 font-bold">
                    変更前: {account.originalRatio}%
                  </div>
                )}
              </div>
            </div>
            
            {/* Slider */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={account.localRatio}
                onChange={(e) => handleSliderChange(account.id, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0% 家計</span>
                <span>50%</span>
                <span>100% 事業</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Save Button (Fixed at Bottom) */}
      {hasAnyChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-0 right-0 px-4"
        >
          <button
            onClick={saveAll}
            disabled={isPending}
            className="w-full py-4 bg-emerald-600 text-white font-bold text-lg rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isPending ? (
              "保存中..."
            ) : (
              <>
                <Check size={20} />
                {changedCount}件の変更を保存
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Success Toast */}
      {showSaveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2"
        >
          <Check size={20} />
          保存しました！
        </motion.div>
      )}
    </div>
  );
}
