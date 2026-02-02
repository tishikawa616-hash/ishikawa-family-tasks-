import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TransactionList from "@/features/accounting/components/TransactionList";

export const dynamic = 'force-dynamic';

export default async function ListPage() {
  const supabase = await createClient();
  const { data: transactions } = await supabase
    .from('acc_transactions')
    .select(`
        id, amount, date, description, group_id, account_id,
        account:acc_accounts ( name, name_simple )
    `)
    .order('date', { ascending: false });

  // Transform for client
  const formattedTransactions = (transactions || []).map((t: any) => ({
      id: t.id,
      amount: t.amount,
      date: t.date,
      description: t.description,
      category: t.account?.name_simple || t.account?.name || '不明'
  }));

  return (
    <main className="min-h-screen pb-20 bg-[#F8F7F2]">
      <div className="sticky top-0 z-10 bg-[#F8F7F2]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-200">
         <Link href="/accounting" className="text-[#78350F] font-bold text-sm">
             ← 戻る
         </Link>
         <h1 className="text-xl font-bold text-[#78350F]">履歴一覧</h1>
         <div className="w-8" />
      </div>

      <div className="p-4">
          <TransactionList transactions={formattedTransactions} />
      </div>
    </main>
  );
}
