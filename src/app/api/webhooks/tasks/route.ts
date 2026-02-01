import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import webpush from "web-push";

// Init web-push (lazy init inside handler to avoid build-time errors if env vars are missing)
const initWebPush = () => {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    throw new Error("VAPID keys are missing");
  }
  webpush.setVapidDetails(
    "mailto:ishikawa-family-tasks@vercel.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
};

export async function POST(req: Request) {
  try {
    initWebPush();
    const body = await req.json();
    const { record, type } = body;

    // Only proceed for INSERT or UPDATE operations where assignee_id exists
    if (!record || !record.assignee_id) {
      return NextResponse.json({ message: "No assignee to notify" });
    }

    // Logic to avoid notifying for minor updates (optional)
    // For now, we notify on assignment change or task creation
    // In a real app, we might check if 'old_record.assignee_id' !== 'record.assignee_id'

    // Init Supabase Admin Client (Service Role)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch user's push subscriptions
    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", record.assignee_id);

    if (error || !subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions found for user:", record.assignee_id);
      return NextResponse.json({ message: "No subscriptions found" });
    }

    // Send notifications
    const notificationPayload = JSON.stringify({
      title: type === "INSERT" ? "新しいタスクが割り当てられました" : "タスクが更新されました",
      body: `タスク: ${record.title}`,
      url: `/tasks/${record.id}`,
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload
        );
      } catch (err: any) {
        console.error("Error sending push:", err);
        if (err.statusCode === 410) {
          // Subscription is gone, remove from DB
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ message: "Notifications processed" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
