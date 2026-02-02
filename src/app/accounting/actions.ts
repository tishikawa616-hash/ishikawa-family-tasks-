'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ensureUserHasGroup } from '@/features/accounting/lib/family';
import { analyzeReceipt } from '@/features/accounting/lib/gemini';

export async function saveTransaction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Handle Group (Optional)
  const groupId = await ensureUserHasGroup();

  const amount = Number(formData.get('amount'));
  const date = formData.get('date') as string;
  const description = formData.get('description') as string;
  const accountId = formData.get('accountId') as string;
  const ocrText = formData.get('ocr_text') as string;
  // If we have an image URL from upload (not implemented in form yet, but handled via separate action usually)
  
  if (!amount || !date || !accountId) {
      return { success: false, error: 'Missing required fields' };
  }

  const { error } = await supabase
    .from('acc_transactions')
    .insert({
      user_id: user.id,
      group_id: groupId,
      account_id: accountId,
      amount: amount,
      date: date,
      description: description || null,
      ocr_text: ocrText || null,
    });

  if (error) {
    console.error('Failed to save transaction:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/accounting');
  revalidatePath('/accounting/list');
  return { success: true };
}

export async function uploadAndAnalyzeAction(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: "No file provided" };
    
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const result = await analyzeReceipt(base64);
        return { success: true, url: "/accounting/confirm?" + new URLSearchParams({
            amount: String(result.amount),
            date: result.date,
            category: result.category, // We might need to map this to ID or name
            description: result.description,  
            ocr_text: result.ocr_text
        }).toString() };
    } catch (e) {
        console.error(e);
        return { success: false, error: "解析に失敗しました" };
    }
}

export async function deleteTransaction(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('acc_transactions').delete().eq('id', id);
    if(error) return { success: false, error: error.message };
    revalidatePath('/accounting/list');
    return { success: true };
}

export async function updateTransaction(id: string, formData: FormData) {
    const supabase = await createClient();
    
    const amount = Number(formData.get('amount'));
    const date = formData.get('date') as string;
    const description = formData.get('description') as string;
    const accountId = formData.get('accountId') as string;

    const { error } = await supabase
        .from('acc_transactions')
        .update({
            amount, date, description, account_id: accountId
        })
        .eq('id', id);

    if(error) return { success: false, error: error.message };
    
    revalidatePath(`/accounting/transactions/${id}`);
    revalidatePath('/accounting/list');
    return { success: true };
}

export async function addTransactionComment(transactionId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    await supabase.from('acc_transaction_comments').insert({
        transaction_id: transactionId,
        user_id: user.id,
        content
    });

    revalidatePath(`/accounting/transactions/${transactionId}`);
    return { success: true };
}
