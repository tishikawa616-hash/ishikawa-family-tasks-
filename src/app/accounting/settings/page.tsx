import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Users, Sliders, ChevronRight, Package } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/accounting/login');
  }

  return (
    <main className="min-h-screen bg-[#F8F7F2] p-6 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/accounting" className="text-[#78350F] font-bold">← 戻る</Link>
        <h1 className="text-2xl font-bold text-[#78350F]">設定</h1>
      </div>

      <div className="space-y-4">
        {/* Family Group */}
        <Link href="/accounting/settings/family" className="block">
          <div className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm active:scale-98 transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Users size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-800">家族設定</p>
                <p className="text-xs text-gray-400">共有メンバーの管理</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" />
          </div>
        </Link>

        {/* Account Ratios */}
        <Link href="/accounting/settings/accounts" className="block">
          <div className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm active:scale-98 transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Sliders size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-800">勘定科目・按分</p>
                <p className="text-xs text-gray-400">事業比率の設定</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" />
          </div>
        </Link>

        {/* Inventory */}
        <Link href="/accounting/settings/inventory" className="block">
          <div className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm active:scale-98 transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Package size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-800">棚卸入力</p>
                <p className="text-xs text-gray-400">年末の在庫登録</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" />
          </div>
        </Link>
      </div>
    </main>
  );
}
