import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const subscription = await request.json();

  if (!subscription) {
    return NextResponse.json({ error: "No subscription provided" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("task_push_subscriptions")
    .upsert({ 
        user_id: user.id,
        subscription,
        updated_at: new Date().toISOString()
    }, { onConflict: 'subscription' }); 

  if (error) {
    console.error("Error saving subscription:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
