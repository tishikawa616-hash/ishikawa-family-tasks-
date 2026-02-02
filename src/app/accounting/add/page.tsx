import { createClient } from "@/lib/supabase/server";
import ManualEntryForm from '@/features/accounting/components/ManualEntryForm';

export const dynamic = 'force-dynamic';

export default async function AddTransactionPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('acc_accounts')
    .select('*')
    .order('display_order'); // or id

  if (error) {
    console.error('Failed to fetch accounts:', error);
  }

  // Filter or process accounts if needed (e.g. separate income/expense)
  // For ManualEntryForm, we might pass all.
  
  return (
    <main className="min-h-screen bg-[#F8F7F2] p-4 flex flex-col items-center justify-center">
      <ManualEntryForm accounts={data || []} />
    </main>
  );
}
