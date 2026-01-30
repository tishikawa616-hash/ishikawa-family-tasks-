import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const subscription = await request.json();

  if (!subscription) {
    return NextResponse.json({ error: "No subscription provided" }, { status: 400 });
  }

  // user_id should ideally be fetched from auth session, but for now we might save anonymous or try to get session
  // For MVP, just saving the subscription is enough to broadcast. But let's try to attach user_id if possible.
  
  // In a real app, you'd use the service role key to write to a protected table if RLS is strict.
  // Assuming 'push_subscriptions' table exists with columns: id, user_id (optional), subscription (jsonb)
  
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ 
        subscription,
        updated_at: new Date().toISOString()
    }, { onConflict: 'subscription' }); 

  if (error) {
    console.error("Error saving subscription:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
