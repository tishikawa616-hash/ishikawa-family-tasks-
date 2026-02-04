import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import webPush from "web-push";

// Top-level declarations removed to avoid build-time errors if env vars are missing
// import webPush from "web-push"; // webPush is imported at top but configured inside

export async function POST(request: Request) {
  const body = await request.json();

  // Validate shared secret
  const authHeader = request.headers.get("x-webhook-secret");
  if (authHeader !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Initialize Supabase and web-push dynamically
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  webPush.setVapidDetails(
    "mailto:example@yourdomain.org",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const { type, table, record } = body;

  console.log(`Received webhook: ${type} on ${table}`);

  try {
    if (table === "task_tasks" && (type === "INSERT" || type === "UPDATE")) {
      const task = record;
      const assignedTo = task.assigned_to;
      
      // If no one is assigned, valid case, but nothing to notify
      if (!assignedTo) {
          return NextResponse.json({ message: "No assignee" });
      }

      // 1. Get subscriptions for the user
      const { data: subscriptions, error } = await supabase
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_id", assignedTo);

      if (error) {
        console.error("Error fetching subscriptions:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No subscriptions found for user ${assignedTo}`);
        return NextResponse.json({ message: "No subscriptions found" });
      }

      // 2. Send notification to all devices
      const payload = JSON.stringify({
        title: type === "INSERT" ? "新しいタスクが割り当てられました" : "タスクが更新されました",
        body: `${task.title}`,
        url: `/board?taskId=${task.id}`, // Deep clean link if possible
      });

      const promises = subscriptions.map((sub) =>
        webPush.sendNotification(sub.subscription, payload).catch((err) => {
          if (err.statusCode === 410) {
            console.log("Subscription expired, deleting...");
            // Optionally delete from DB (requires enabled RLS/policy or service role)
            // supabase.from('push_subscriptions').delete().match({ subscription: sub.subscription });
          } else {
            console.error("Error sending notification:", err);
          }
        })
      );

      await Promise.all(promises);
      
      return NextResponse.json({ success: true, count: subscriptions.length });
    }
    
    return NextResponse.json({ message: "Event ignored" });

  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
