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
  assigneeId?: string;
  tags?: string[];
  fieldId?: string;
  fieldName?: string;
  fieldColor?: string;
  recurrenceType?: "none" | "daily" | "weekly" | "monthly";
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
  parentTaskId?: string;
  createdAt?: string;
  updatedAt?: string;
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
