export interface Task {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  assignee?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  assigneeId?: string; // For saving to DB
  tags?: string[];
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color?: string;
}

export interface Board {
  id: string;
  title: string;
  columns: Column[];
}

export interface Profile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}
