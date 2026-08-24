import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

export const DATA_DIR = path.join(__dirname, '..', '..', 'data');
export const SQLITE_FILE = path.join(DATA_DIR, 'sgbuild.db');
export const LEGACY_JSON_FILE = path.join(DATA_DIR, 'db.json');
export const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const BACKUP_KEEP = 10;

interface DbPayload {
  users?: any[];
  collections?: Record<string, any[]>;
  auditLogs?: any[];
  notifications?: any[];
  conversations?: any[];
  chatMessages?: any[];
  settings?: Record<string, any>;
}

const COLLECTION_KEYS = ['users', 'auditLogs', 'notifications', 'conversations', 'chatMessages'] as const;

export class SqliteStore {
  private db: Database.Database;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    this.db = new Database(SQLITE_FILE);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS docs (
        collection TEXT NOT NULL,
        id TEXT NOT NULL,
        seq INTEGER,
        data TEXT NOT NULL,
        PRIMARY KEY (collection, id)
      );
      CREATE INDEX IF NOT EXISTS idx_docs_collection ON docs(collection);
      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  isEmpty(): boolean {
    const row = this.db.prepare('SELECT COUNT(*) AS n FROM docs').get() as { n: number };
    return row.n === 0;
  }

  /** 从旧 db.json 导入数据（一次性迁移） */
  importFromJson(data: DbPayload) {
    const insert = this.db.prepare('INSERT OR REPLACE INTO docs (collection, id, data, seq) VALUES (?, ?, ?, ?)');
    this.db.transaction(() => {
      for (const key of COLLECTION_KEYS) {
        for (const item of (data as any)[key] || []) {
          insert.run(key, String(item.id), JSON.stringify(item), null);
        }
      }
      for (const [name, items] of Object.entries(data.collections || {})) {
        for (const item of items || []) {
          insert.run(`col:${name}`, String(item.id), JSON.stringify(item), null);
        }
      }
      if (data.settings) {
        this.db.prepare('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)').run('settings', JSON.stringify(data.settings));
      }
    })();
  }

  loadAll(): DbPayload & { collections: Record<string, any[]> } {
    const result: any = { users: [], auditLogs: [], notifications: [], conversations: [], chatMessages: [], collections: {} };
    const rows = this.db.prepare('SELECT collection, data FROM docs ORDER BY rowid').all() as Array<{ collection: string; data: string }>;
    const colMap = new Map<string, any[]>();
    for (const r of rows) {
      let parsed: any;
      try { parsed = JSON.parse(r.data); } catch { continue; }
      if ((COLLECTION_KEYS as readonly string[]).includes(r.collection)) {
        result[r.collection].push(parsed);
      } else if (r.collection.startsWith('col:')) {
        const name = r.collection.slice(4);
        if (!colMap.has(name)) colMap.set(name, []);
        colMap.get(name)!.push(parsed);
      }
    }
    result.collections = Object.fromEntries(colMap);
    const settingsRow = this.db.prepare("SELECT value FROM kv WHERE key = 'settings'").get() as { value: string } | undefined;
    result.settings = settingsRow ? JSON.parse(settingsRow.value) : {};
    return result;
  }

  /** 事务性整体持久化（原子：任一失败自动回滚） */
  persistAll(data: DbPayload) {
    const clear = this.db.prepare('DELETE FROM docs');
    const insert = this.db.prepare('INSERT INTO docs (collection, id, data) VALUES (?, ?, ?)');
    const setKv = this.db.prepare('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)');
    this.db.transaction(() => {
      clear.run();
      for (const key of COLLECTION_KEYS) {
        for (const item of (data as any)[key] || []) {
          if (item && item.id !== undefined) insert.run(key, String(item.id), JSON.stringify(item));
        }
      }
      for (const [name, items] of Object.entries(data.collections || {})) {
        for (const item of items || []) {
          if (item && item.id !== undefined) insert.run(`col:${name}`, String(item.id), JSON.stringify(item));
        }
      }
      setKv.run('settings', JSON.stringify(data.settings || {}));
    })();
  }

  /** 创建带时间戳的备份，保留最近 BACKUP_KEEP 份 */
  backup(label = 'auto'): string | null {
    try {
      if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const target = path.join(BACKUP_DIR, `sgbuild-${ts}-${label}.db`);
      // 使用 VACUUM INTO 保证一致性快照
      this.db.prepare(`VACUUM INTO ?`).run(target);
      this.pruneBackups();
      return target;
    } catch (e) {
      console.error('[SqliteStore] 备份失败', e);
      return null;
    }
  }

  private pruneBackups() {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.db'))
      .map((f) => ({ f, t: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    for (const old of files.slice(BACKUP_KEEP)) {
      try { fs.unlinkSync(path.join(BACKUP_DIR, old.f)); } catch {}
    }
  }

  close() {
    try { this.db.close(); } catch {}
  }
}
