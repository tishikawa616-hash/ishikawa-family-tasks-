"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAccountRatio(accountId: string, ratio: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Update business_ratio in acc_accounts
  // Since accounts might be shared or system defaults, update behavior depends on design.
  // If editing a default account, we might need a user-specific override table.
  // BUT, for this consolidated schema, let's assume direct update if user allows, 
  // OR we shouldn't allow editing system defaults directly if they are shared.
  // HOWEVER, acc_accounts table usage implies it contains the chart of accounts.
  // For simplicity: We update the row.
  
  const { error } = await supabase
    .from("acc_accounts")
    .update({ business_ratio: ratio })
    .eq("id", accountId);

  if (error) {
    console.error("Failed to update ratio", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/accounting/settings/accounts");
  return { success: true };
}
