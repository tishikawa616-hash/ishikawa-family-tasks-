'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { FixedAsset } from '@/features/accounting/types/database';

export async function addFixedAsset(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const name = formData.get('name') as string;
  const purchasePrice = Number(formData.get('purchasePrice'));
  const purchaseDate = formData.get('purchaseDate') as string;
  const usefulLifeYears = Number(formData.get('usefulLifeYears'));
  const memo = formData.get('memo') as string;

  // Calculate residual value (Usually 10% or 0 depending on tax law, simplified to 0 or 1 yen, but allow user input or default?)
  // For now default to 0.
  const residualValue = 0;

  const { error } = await supabase.from('acc_fixed_assets').insert({
    user_id: user.id,
    name,
    purchase_price: purchasePrice,
    purchase_date: purchaseDate,
    useful_life_years: usefulLifeYears,
    residual_value: residualValue,
    memo: memo || null,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath('/accounting/assets/fixed');
  return { success: true };
}

export async function deleteFixedAsset(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('acc_fixed_assets').delete().eq('id', id);
    if(error) return { success: false, error: error.message };
    revalidatePath('/accounting/assets/fixed');
    return { success: true };
}

export async function getFixedAssets() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('acc_fixed_assets')
        .select('*')
        .order('purchase_date', { ascending: false });
    return (data || []) as FixedAsset[];
}
