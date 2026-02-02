import Link from "next/link";
import CameraInput from "@/features/accounting/components/CameraInput";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowRight, TrendingUp, TrendingDown, Plus, Home as HomeIcon, Briefcase } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AccountingHome({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const code = params.code;

  if (code) {
    const next = params.next || '/accounting';
    redirect(`/auth/callback?code=${code}&next=${next}`);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Data Fetching                                */
  /* -------------------------------------------------------------------------- */
  let currentBalance = 0;
  let incomeTotal = 0;
  let expenseTotal = 0;
  let businessExpenseTotal = 0;
  let householdExpenseTotal = 0;
  
  let recentExpenses: { id: string; date: string; category: string; amount: number }[] = [];
  let errorMessage = null;
  
  const now = new Date();
  const jstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const year = jstNow.getFullYear();
  const month = jstNow.getMonth() + 1;
  const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;

  try {
    const supabase = await createClient();

    // 1. Fetch recent transactions
    const { data: transactions, error: txError } = await supabase
      .from('acc_transactions')
      .select(`
        id, amount, date, description,
        account:acc_accounts ( name, name_simple, account_type_id, business_ratio )
      `)
      .order('date', { ascending: false })
      .limit(5);

    if (txError) {
      console.error("Failed to fetch transactions:", txError);
      errorMessage = "データ取得に失敗しました";
    }
    
    const { data: monthStats, error: statsError } = await supabase
      .from('acc_transactions')
      .select(`
        amount,
        account:acc_accounts!inner ( account_type_id, business_ratio )
      `)
      .gte('date', firstDay);

    if (statsError) console.error("Failed to fetch month stats:", statsError);

    if (monthStats) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        monthStats.forEach((t: any) => {
             const typeId = t.account?.account_type_id;
             const ratio = t.account?.business_ratio ?? 100;
             
             if (typeId === 1) { // Income
               incomeTotal += t.amount;
               currentBalance += t.amount;
             } else if (typeId === 2) { // Expense (Business)
                expenseTotal += t.amount;
                businessExpenseTotal += t.amount;
                currentBalance -= t.amount;
             } else if (typeId === 3) { // Expense (Household)
                expenseTotal += t.amount;
                householdExpenseTotal += t.amount;
                currentBalance -= t.amount;
             } else {
                 if (ratio === 0) {
                     householdExpenseTotal += t.amount;
                 } else {
                     businessExpenseTotal += t.amount;
                 }
                 expenseTotal += t.amount;
                 currentBalance -= t.amount;
             }
        });
    }

    if (transactions) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentExpenses = transactions.map((t: any) => ({
          id: t.id,
          date: t.date,
          category: t.account?.name_simple || t.account?.name || '未分類',
          amount: t.amount
      }));
    }

  } catch (error) {
    console.error("Home page data fetch failed:", error);
    errorMessage = "エラーが発生しました";
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Format                                   */
  /* -------------------------------------------------------------------------- */
  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-[300px] bg-linear-to-b from-[#FEFCE8] to-transparent -z-10 rounded-b-[40px] opacity-60" />

      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-sm font-bold text-[#78350F] mb-1">おかえりなさい</h1>
          <p className="text-2xl font-bold text-[#451a03]">家計の記録</p>
        </div>
      </header>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-6 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Main Balance Card */}
      <section className="mb-10 relative group">
        <Link href="/accounting/reports">
          <div className="absolute inset-0 bg-[#4D7C0F] rounded-[32px] rotate-1 opacity-10 scale-95 top-2 transition-transform group-active:scale-90 duration-200"></div>
          <div className="bg-white rounded-[32px] p-6 shadow-[8px_8px_24px_rgba(77,124,15,0.15)] border border-green-600/10 relative overflow-hidden transition-transform group-active:scale-95 duration-200">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm text-gray-500 font-bold mb-1">{month}月の収支</p>
                <div className="flex items-baseline gap-1 break-all">
                  <span className={`text-4xl font-extrabold tracking-tight ${currentBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    ¥{fmt(currentBalance)}
                  </span>
                </div>
              </div>
              {/* Visual Indicator */}
              <div className={`p-3 rounded-full ${currentBalance >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {currentBalance >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              </div>
            </div>

            {/* Income / Expense Breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-gray-100">
              <div>
                  <p className="text-xs text-gray-500 mb-1">収入</p>
                  <p className="font-bold text-[#451a03]">¥{fmt(incomeTotal)}</p>
              </div>
              <div>
                  <p className="text-xs text-gray-500 mb-1">支出計</p>
                  <p className="font-bold text-red-500">¥{fmt(expenseTotal)}</p>
              </div>
            </div>
            
            {/* Added: Business vs Household tiny breakdown */}
             <div className="flex gap-4 mt-3 pt-2 border-t border-gray-50 opacity-80">
                 <div className="flex items-center gap-1">
                     <Briefcase size={12} className="text-gray-400" />
                     <span className="text-[10px] text-gray-500 font-bold">事業: -¥{fmt(businessExpenseTotal)}</span>
                 </div>
                 <div className="flex items-center gap-1">
                     <HomeIcon size={12} className="text-gray-400" />
                     <span className="text-[10px] text-gray-500 font-bold">家計: -¥{fmt(householdExpenseTotal)}</span>
                 </div>
             </div>

            {/* Tap hint */}
            <div className="absolute top-2 right-4 text-[10px] text-green-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              タップで詳細 ➜
            </div>
          </div>
        </Link>
      </section>

      {/* Quick Actions */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Plus size={20} className="text-[#4D7C0F]" />
          記帳する
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          <CameraInput />
          
          <Link href="/accounting/add" className="group">
            <div className="bg-white aspect-square rounded-[24px] p-4 flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-200 group-active:scale-95 transition-all duration-200 hover:shadow-md">
              <div className="w-10 h-10 rounded-full bg-[#FEFCE8] flex items-center justify-center group-hover:bg-[#FEF9C3] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#78350F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <span className="font-bold text-sm text-gray-900">手入力</span>
            </div>
          </Link>
          
          <Link href="/accounting/self-consume" className="group">
            <div className="bg-white aspect-square rounded-[24px] p-4 flex flex-col items-center justify-center gap-2 shadow-sm border border-orange-200 group-active:scale-95 transition-all duration-200 hover:shadow-md hover:border-orange-300">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors text-2xl">
                🥕
              </div>
              <span className="font-bold text-sm text-orange-700">自家消費</span>
            </div>
          </Link>

          <Link href="/accounting/assets" className="group">
            <div className="bg-white aspect-square rounded-[24px] p-4 flex flex-col items-center justify-center gap-2 shadow-sm border border-emerald-200 group-active:scale-95 transition-all duration-200 hover:shadow-md hover:border-emerald-300">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors text-2xl">
                🥬
              </div>
              <span className="font-bold text-sm text-emerald-700">資産管理</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex justify-between items-end mb-4 px-1">
          <h2 className="text-lg font-bold text-gray-900">最近の履歴</h2>
          <Link href="/accounting/list" className="text-sm font-bold text-[#4D7C0F] flex items-center gap-0.5 active:opacity-60">
            すべて見る <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {recentExpenses.length === 0 ? (
            <div className="text-center py-10 opacity-40 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
              まだ記録はありません
            </div>
          ) : (
            recentExpenses.map((expense) => (
              <div key={expense.id} className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex justify-between items-center active:bg-gray-50 transition-colors">
                <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 px-2 py-0.5 bg-[#FEFCE8] rounded-md">
                        {expense.date.slice(5).replace('-', '/')}
                      </span>
                   </div>
                   <span className="font-bold text-gray-900">{expense.category}</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  -¥{fmt(expense.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  );
}
