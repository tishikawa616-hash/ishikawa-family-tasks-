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

export const db = new WorkLogDatabase();
