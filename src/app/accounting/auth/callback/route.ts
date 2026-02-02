import { NextResponse } from "next/server";
import { createClient } from "@/features/accounting/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Ensure we redirect to the same origin to avoid cookie domain issues
      // If we are on localhost/HTTP, secure cookies might be blocked if 'secure: true' is requested by Supabase
      // But usually Supabase client detects localhost. 
      // For now, redirect to the 'next' path on the same origin.
      
      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        // In dev, just go to origin + next
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
        console.error("Auth Callback Error:", error);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
