'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_value: number;
  category: string;
  memo?: string;
}

export async function addInventoryItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const fiscalYear = Number(formData.get('fiscalYear'));
  const name = formData.get('itemName') as string;
  const quantity = Number(formData.get('quantity'));
  const unit = formData.get('unit') as string;
  const unitPrice = Number(formData.get('unitPrice'));
  const category = formData.get('category') as string;
  const memo = formData.get('memo') as string;

  const total = quantity * unitPrice;

  const { error } = await supabase.from('acc_inventory_items').insert({
      user_id: user.id,
      fiscal_year: fiscalYear,
      item_name: name,
      quantity,
      unit,
      unit_price: unitPrice,
      total_value: total,
      category,
      memo
  });

  if (error) return { success: false, error: error.message };
  revalidatePath('/accounting/settings/inventory');
  return { success: true };
}

export async function deleteInventoryItem(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('acc_inventory_items').delete().eq('id', id);
    if(error) return { success: false, error: error.message };
    revalidatePath('/accounting/settings/inventory');
    return { success: true };
}

export async function getInventoryItems(year: number) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('acc_inventory_items')
        .select('*')
        .eq('fiscal_year', year);
    return data || [];
}

export async function getInventorySummary(year: number) {
    const items = await getInventoryItems(year);
    const totalValue = items.reduce((sum, item) => sum + (item.total_value || 0), 0);
    return { count: items.length, totalValue };
}
