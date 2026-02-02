import Link from 'next/link';
import { ChevronLeft, Tractor } from 'lucide-react';
import { getFixedAssets } from './actions';
import FixedAssetList from './FixedAssetList';

export const dynamic = 'force-dynamic';

export default async function FixedAssetsPage() {
  const assets = await getFixedAssets();

  return (
    <main className="min-h-screen p-6 pb-32 bg-[#F8F7F2]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/accounting/assets" 
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#78350F]"
        >
          <ChevronLeft size={24} />
        </Link>
        <div className="flex items-center gap-2">
            <Tractor size={24} className="text-[#4D7C0F]" />
            <h1 className="text-2xl font-bold text-[#78350F]">固定資産</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-4 mb-6 border border-emerald-100 shadow-sm">
             <p className="text-sm text-emerald-800">
               トラクター、ハウス、軽トラなど、10万円以上で長く使うものは「固定資産」として登録します。
               減価償却（げんかしょうきゃく）の計算に使います。
             </p>
        </div>

        <FixedAssetList initialAssets={assets} />
      </div>
    </main>
  );
}
