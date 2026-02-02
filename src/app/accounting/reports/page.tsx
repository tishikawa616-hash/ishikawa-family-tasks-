import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ReportCharts from '@/features/accounting/components/ReportCharts';
import MonthlyMemo from '@/features/accounting/components/MonthlyMemo';
import { getMonthlyNote } from '@/app/accounting/assets/actions';
import { ChevronLeft } from 'lucide-react';
import ExportButton from './ExportButton';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const supabase = await createClient();
  const now = new Date();
  const currentYear = now.getFullYear();
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;

  // Fetch all transactions for the year
  const { data: transactions } = await supabase
    .from('acc_transactions')
    .select(`
        id, amount, date,
        account:acc_accounts ( name, account_type_id, business_ratio )
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');

  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const initialNote = await getMonthlyNote(currentMonthStr);

  // --- Data Aggregation Logic ---

  // Initialize monthly buckets
  const monthlyDataMap = new Map<string, {
    income: number;
    expense: number;
    business_income: number;
    business_expense: number;
    household_expense: number;
  }>();

  for (let i = 1; i <= 12; i++) {
     const m = `${currentYear}-${i.toString().padStart(2, '0')}`;
     monthlyDataMap.set(m, { income: 0, expense: 0, business_income: 0, business_expense: 0, household_expense: 0 });
  }

  // Initialize category hashmaps
  const busCatMap = new Map<string, number>();
  const houseCatMap = new Map<string, number>();

  (transactions || []).forEach((t: any) => {
      const month = t.date.substring(0, 7);
      const data = monthlyDataMap.get(month);
      if (!data) return;

      const typeId = t.account?.account_type_id;
      const amount = t.amount;
      const ratio = t.account?.business_ratio ?? (typeId === 2 ? 100 : 0);
      const name = t.account?.name || '不明';

      if (typeId === 1) {
          // Income
          data.income += amount;
          data.business_income += amount; // Assume all income is business for simplicity unless ratio applies? Usually farmers income is business.
      } else {
          // Expense (2 or 3)
          data.expense += amount;
          
          const busAmt = Math.round(amount * (ratio / 100));
          const houseAmt = amount - busAmt;

          data.business_expense += busAmt;
          data.household_expense += houseAmt;

          if (busAmt > 0) {
              busCatMap.set(name, (busCatMap.get(name) || 0) + busAmt);
          }
          if (houseAmt > 0) {
              houseCatMap.set(name, (houseCatMap.get(name) || 0) + houseAmt);
          }
      }
  });

  // Convert to arrays for props
  const monthlyData = Array.from(monthlyDataMap.entries()).map(([month, d]) => ({
      month: `${parseInt(month.split('-')[1])}月`,
      ...d
  }));

  const businessCategoryData = Array.from(busCatMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

  const householdCategoryData = Array.from(houseCatMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);


  return (
    <main className="min-h-screen bg-[#F8F7F2] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F8F7F2]/95 backdrop-blur px-6 py-4 flex items-center justify-between border-b border-gray-200">
         <div className="flex items-center gap-4">
            <Link href="/accounting" className="text-[#78350F]">
                <ChevronLeft size={28} />
            </Link>
            <h1 className="text-xl font-bold text-[#78350F]">{currentYear}年の分析</h1>
         </div>
         <ExportButton fiscalYear={currentYear} />
      </div>

      <div className="p-4 space-y-6">
         {/* Charts Section */}
         <ReportCharts 
            monthlyData={monthlyData} 
            businessCategoryData={businessCategoryData}
            householdCategoryData={householdCategoryData}
         />

         {/* Monthly Memo Section */}
         <MonthlyMemo initialContent={initialNote} yearMonth={currentMonthStr} />
      </div>
    </main>
  );
}
