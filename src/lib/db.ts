import Dexie, { Table } from 'dexie';

export interface OfflineWorkLog {
  id?: number;
  taskId: string;
  content: string;
  images: string[]; // Base64 strings
  createdAt: string;
  synced: number; // 0: not synced, 1: synced (though we delete synced ones usually)
}

export class WorkLogDatabase extends Dexie {
  workLogs!: Table<OfflineWorkLog>;

  constructor() {
    super('IshikawaTasksDB');
    this.version(1).stores({
      workLogs: '++id, taskId, synced, createdAt'
    });
  }
}

// Singleton instance, created lazily to avoid SSR/Build issues
let dbInstance: WorkLogDatabase | undefined;

export const getDb = () => {
    if (typeof window === "undefined") {
        return null; // Return null on server
    }
    if (!dbInstance) {
        dbInstance = new WorkLogDatabase();
    }
    return dbInstance;
};

// For backward compatibility if needed, but better to use getDb()
// Or we can mock it on server to avoid import errors
export const db = typeof window !== "undefined" ? new WorkLogDatabase() : {} as WorkLogDatabase;
