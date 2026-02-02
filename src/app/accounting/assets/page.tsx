import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AssetsManager from '@/features/accounting/components/AssetsManager';
import { Wallet, Banknote, ChevronLeft, PiggyBank } from 'lucide-react';

export const dynamic = 'force-dynamic';

import { FamilyMember, Wallet as WalletType } from '@/features/accounting/types/database';

interface FamilyMemberWithWallets extends FamilyMember {
  wallets: WalletType[];
}

interface FamilyMemberRaw {
    id: string;
    name: string;
    display_order: number;
    wallets: WalletType[] | null;
}

export default async function AssetsPage() {
  const supabase = await createClient();
  
  // Fetch family members with their wallets
  const { data: members, error } = await supabase
    .from('acc_family_members')
    .select(`
      id,
      name,
      display_order,
      wallets:acc_wallets (
        id,
        name,
        wallet_type,
        balance,
        display_order
      )
    `)
    .order('display_order');

  if (error) {
    console.error('Failed to fetch family members:', error);
  }

  // Transform data
  const familyData: FamilyMemberWithWallets[] = ((members as unknown as FamilyMemberRaw[]) || []).map(m => ({
    ...m,
    user_id: '',
    wallets: (m.wallets || []).sort((a, b) => a.display_order - b.display_order),
  })) as unknown as FamilyMemberWithWallets[];

  // Calculate totals
  let totalCash = 0;
  let totalBank = 0;
  familyData.forEach(member => {
    member.wallets.forEach(wallet => {
      if (wallet.wallet_type === 'cash') {
        totalCash += wallet.balance;
      } else {
        totalBank += wallet.balance;
      }
    });
  });

  return (
    <main className="min-h-screen p-6 pb-28 bg-[#F8F7F2]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/accounting" 
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#78350F]"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-[#78350F]">資産管理</h1>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-[24px] p-6 shadow-[4px_4px_16px_rgba(0,0,0,0.06)] border border-gray-100 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <PiggyBank size={20} className="text-[#78350F]" />
          <h2 className="text-sm font-bold text-[#78350F]/60">家族全体の資産</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-amber-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Banknote size={18} className="text-amber-600" />
              <span className="text-sm font-bold text-amber-700">現金</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">¥{totalCash.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={18} className="text-blue-600" />
              <span className="text-sm font-bold text-blue-700">預貯金</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">¥{totalBank.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-[#78350F]/60">総資産</span>
            <p className="text-3xl font-extrabold text-[#4D7C0F]">¥{(totalCash + totalBank).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <Link href="/accounting/assets/fixed" className="block mb-6 group">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between group-active:scale-98 transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-xl">
              🚜
            </div>
            <div>
              <p className="font-bold text-[#78350F]">固定資産・減価償却</p>
              <p className="text-xs text-gray-400">トラクター、農機具などの管理</p>
            </div>
          </div>
          <span className="text-gray-300">→</span>
        </div>
      </Link>

      {/* Family Members List */}
      <AssetsManager initialMembers={familyData} />
    </main>
  );
}
