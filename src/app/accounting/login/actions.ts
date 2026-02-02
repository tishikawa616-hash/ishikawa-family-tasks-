"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/features/accounting/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true, // Auto-signup new users (Mom)
      // Vercel deployment URL handling needs care.
      // Use configured BASE_URL, or VERCEL_URL (auto-set by Vercel), or localhost.
      emailRedirectTo: `${
        process.env.NEXT_PUBLIC_BASE_URL 
          ? process.env.NEXT_PUBLIC_BASE_URL 
          : process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000'
      }/auth/callback`,
    },
  });

  if (error) {
    redirect("/login?error=Could not authenticate user");
  }

  revalidatePath("/", "layout");
  redirect("/login?message=Check email to continue sign in process");
}
