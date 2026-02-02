'use server';

import { createClient } from '@/lib/supabase/server';
import { getInventorySummary } from '@/app/accounting/settings/inventory/actions';

interface AccountSummary {
    name: string;
    amount: number;
}

export async function generateIncomeStatementCSV(year: number) {
  const supabase = await createClient();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // Fetch Transactions
  const { data: transactions } = await supabase
    .from('acc_transactions')
    .select(`
        amount,
        account:acc_accounts ( name, account_type_id )
    `)
    .gte('date', startDate)
    .lte('date', endDate);

  // Fetch Inventory (Beginning and Ending)
  // Assuming simplified inventory logic: Inventory At End is asset, but for P/L we need calculation.
  // Using helper
  const inventory = await getInventorySummary(year);

  // Aggregate
  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();
  let totalSales = 0;

  transactions?.forEach((t: any) => {
      const type = t.account?.account_type_id;
      const name = t.account?.name || '不明';
      const amount = t.amount;

      if (type === 1) { // Income
          incomeMap.set(name, (incomeMap.get(name) || 0) + amount);
          totalSales += amount;
      } else if (type === 2) { // Expense
          expenseMap.set(name, (expenseMap.get(name) || 0) + amount);
      }
      // Note: Household (3) is excluded from Income Statement (Tax Return)
  });

  // Calculate COGS (Cost of Goods Sold) roughly
  // This needs proper accounting logic, but for now we list Expenses.

  // Generate CSV String
  let csv = '\uFEFF'; // BOM
  csv += `青色申告決算書（農業所得用） - ${year}年\n\n`;
  
  csv += '【収入金額】\n';
  incomeMap.forEach((val, key) => csv += `${key},${val}\n`);
  csv += `計,${totalSales}\n\n`;

  csv += '【経費】\n';
  expenseMap.forEach((val, key) => csv += `${key},${val}\n`);
  
  // Add Inventory Info
  csv += `\n【棚卸高】\n`;
  csv += `期首棚卸高,0\n`; // Simplified (Need previous year end)
  csv += `期末棚卸高,${inventory.totalValue}\n`;

  return csv;
}
