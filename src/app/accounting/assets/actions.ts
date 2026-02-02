'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addFamilyMember(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase.from('acc_family_members').insert({
    user_id: user.id,
    name,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath('/accounting/assets');
  return { success: true };
}

export async function deleteFamilyMember(memberId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('acc_family_members').delete().eq('id', memberId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/accounting/assets');
  return { success: true };
}

export async function addWallet(memberId: string, name: string, walletType: 'cash' | 'bank') {
  const supabase = await createClient();
  const { error } = await supabase.from('acc_wallets').insert({
    member_id: memberId,
    name,
    wallet_type: walletType,
    balance: 0,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath('/accounting/assets');
  return { success: true };
}

export async function updateWalletBalance(walletId: string, balance: number) {
  const supabase = await createClient();
  const { error } = await supabase.from('acc_wallets').update({ balance, updated_at: new Date().toISOString() }).eq('id', walletId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/accounting/assets');
  return { success: true };
}

export async function deleteWallet(walletId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('acc_wallets').delete().eq('id', walletId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/accounting/assets');
  return { success: true };
}

export async function saveMonthlyNote(yearMonth: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('acc_monthly_notes')
    .upsert({
      user_id: user.id,
      month: `${yearMonth}-01`,
      note: content,
    }, {
      onConflict: 'user_id,month,group_id',
    });

  if (error) return { success: false, error: error.message };
  revalidatePath('/accounting/reports');
  return { success: true };
}

export async function getMonthlyNote(yearMonth: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('acc_monthly_notes')
    .select('note')
    .eq('month', `${yearMonth}-01`)
    .single();

  if (error && error.code !== 'PGRST116') console.error(error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any)?.note || '';
}
