export interface Field {
  id: string;
  name: string;
  description?: string;
  location?: string;
  color: string;
  createdAt?: string;
}

export interface WorkLog {
  id: string;
  taskId: string;
  userId: string;
  startedAt?: string;
  endedAt?: string;
  photoUrls?: string[];
  notes?: string;
  createdAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}
