import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import TransactionEditForm from "@/features/accounting/components/TransactionEditForm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>ログインしてください</div>;

  const { data: transaction } = await supabase
    .from('acc_transactions')
    .select(`
        *,
        account:acc_accounts ( id, name, name_simple )
    `)
    .eq('id', id)
    .single();

  if (!transaction) return notFound();

  // Fetch accounts for selector
  const { data: accounts } = await supabase.from('acc_accounts').select('*').order('display_order');

  // Fetch comments
  const { data: comments } = await supabase
    .from('acc_transaction_comments')
    .select('*')
    .eq('transaction_id', id)
    .order('created_at');

  return (
    <main className="min-h-screen bg-[#F8F7F2]">
      <TransactionEditForm 
        transaction={transaction}
        accounts={accounts || []}
        comments={comments || []}
        currentUserId={user.id}
      />
    </main>
  );
}
