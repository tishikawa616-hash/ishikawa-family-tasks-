import { SupabaseClient } from "@supabase/supabase-js";
import { mockBoard } from "@/data/mockData";

export async function seedMockData(supabase: SupabaseClient) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User must be logged in to seed data");
      return;
    }

    console.log("Starting seeding...");
    
    // 1. Ensure Profile exists
    const { error: profileError } = await supabase
      .from("task_profiles")
      .upsert({
        id: user.id,
        email: user.email,
        display_name: '管理者', // Default name
        avatar_url: '',
      });
      
    if (profileError) {
        console.error("Error creating profile:", profileError);
        // Continue anyway as profile might exist
    }

    // 2. Insert Tasks
    const tasks = mockBoard.columns.flatMap(col => 
        col.tasks.map(task => ({
            title: task.title,
            description: task.description,
            status: col.id,
            priority: task.priority || 'medium',
            due_date: task.dueDate,
            tags: task.tags,
            created_by: user.id
        }))
    );

    const { error: tasksError } = await supabase
      .from("task_tasks")
      .insert(tasks);

    if (tasksError) {
        console.error("Error seeding tasks:", tasksError);
        throw tasksError;
    }

    console.log("Seeding completed successfully!");
    return true;
  } catch (err) {
    console.error("Seeding failed:", err);
    return false;
  }
}
