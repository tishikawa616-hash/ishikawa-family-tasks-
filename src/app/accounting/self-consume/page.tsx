import { createClient } from "@/lib/supabase/server";
import ManualEntryForm from '@/features/accounting/components/ManualEntryForm';

export const dynamic = 'force-dynamic';

export default async function SelfConsumePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('acc_accounts')
    .select('*')
    .order('display_order');

  if (error) {
    console.error('Failed to fetch accounts:', error);
  }
  
  // Self consume page basically uses manual entry but likely with pre-filled context instructions
  // or specialized form. Since original is lost, reusing ManualEntry with specific title context.

  return (
    <main className="min-h-screen bg-[#F8F7F2] p-4 flex flex-col items-center justify-center">
      <div className="mb-4 text-center">
         <h1 className="text-xl font-bold text-orange-700">自家消費の記録</h1>
         <p className="text-xs text-orange-600/80">作った作物を家で食べた場合など</p>
      </div>
      <ManualEntryForm accounts={data || []} />
    </main>
  );
}
