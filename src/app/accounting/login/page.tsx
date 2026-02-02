import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/accounting');
  }

  return (
    <main className="min-h-screen bg-[#F8F7F2] p-6 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-[32px] shadow-lg w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-[#78350F] mb-6">家計簿アプリ</h1>
        
        <Link 
          href="/login?next=/accounting" 
          className="block w-full py-4 bg-[#4D7C0F] text-white font-bold rounded-2xl shadow-md hover:bg-[#3f660c] transition-colors"
        >
          ログインする
        </Link>
        
        <p className="mt-6 text-sm text-gray-400">
          石川家専用ツール
        </p>
      </div>
    </main>
  );
}
