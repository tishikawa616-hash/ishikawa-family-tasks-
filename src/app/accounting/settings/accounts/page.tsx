import { createClient } from "@/lib/supabase/server";
import AccountRatioList from "./AccountRatioList";
import Link from "next/link";
import { ChevronLeft, Calculator, Info } from "lucide-react";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  
  // Fetch expense accounts (type 2) and household (3) logic if relevant? 
  // House hold usually 0% business. Business is usually 100%.
  // We want to fetch ALL expense accounts to allow tuning (e.g. utilities).
  // Utilities are type 2 usually but ratio < 100.
  
  const { data: accounts } = await supabase
    .from("acc_accounts")
    .select("*")
    .in("account_type_id", [2, 3]) // Expenses
    .order("code");

  return (
    <main className="min-h-screen bg-[#F8F7F2] p-6 pb-24">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/accounting/settings" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#78350F]">
          <ChevronLeft size={24} />
        </Link>
        <div className="flex items-center gap-2">
            <Calculator size={24} className="text-[#4D7C0F]" />
            <h1 className="text-2xl font-bold text-[#78350F]">家事按分</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-6 border border-blue-100 shadow-sm">
        <div className="flex gap-3">
            <Info className="text-blue-500 shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed">
                電気代やガソリン代など、仕事とプライベートの両方で使う経費の「事業で使う割合」を設定します。<br/>
                ここでの設定は、今後の入力と自動集計に反映されます。
            </p>
        </div>
      </div>

      <AccountRatioList accounts={accounts || []} />
    </main>
  );
}
