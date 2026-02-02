import Link from 'next/link';
import { ChevronLeft, Package, Info } from 'lucide-react';
import { getInventoryItems } from './actions';
import InventoryList from './InventoryList';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  // Get current fiscal year (JST)
  const jstNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const currentYear = jstNow.getFullYear();
  
  // For inventory, we typically want the previous year's data at year-end
  // But for now, we'll show current year
  const fiscalYear = currentYear;
  
  const items = await getInventoryItems(fiscalYear);

  return (
    <main className="min-h-screen pb-32 bg-gradient-to-b from-[#F8F7F2] to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#F8F7F2]/95 backdrop-blur-sm border-b border-stone-200/50 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link 
            href="/accounting/settings" 
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-stone-600 hover:bg-stone-50 active:scale-95 transition-all"
          >
            <ChevronLeft size={24} />
          </Link>
          <div className="flex items-center gap-2">
            <Package size={24} className="text-amber-600" />
            <h1 className="text-xl font-bold text-stone-800">期末棚卸</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Info Card */}
        <div className="bg-amber-50 rounded-2xl p-4 mb-6 border border-amber-100">
          <div className="flex gap-3">
            <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 leading-relaxed">
              <p className="font-bold mb-1">期末棚卸（たなおろし）とは？</p>
              <p>
                年末時点で残っている「肥料」「農薬」「出荷前のサツマイモ」などを
                資産として計上します。これにより、正確な利益計算ができます。
              </p>
            </div>
          </div>
        </div>

        {/* Year Selector (future: allow switching years) */}
        <div className="bg-white rounded-xl p-3 mb-4 flex items-center justify-center gap-2 shadow-sm border border-gray-100">
          <span className="text-gray-500">年度:</span>
          <span className="text-xl font-bold text-gray-800">{fiscalYear}年</span>
        </div>

        {/* Inventory List */}
        <InventoryList items={items} fiscalYear={fiscalYear} />
      </div>
    </main>
  );
}
