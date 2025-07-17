import sqlite3 from 'sqlite3';
import path from 'path';

class Database {
  private db: sqlite3.Database;

  constructor() {
    // In production, use absolute path to ensure database persists
    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'database.sqlite');
    
    // Enable verbose mode in development
    const sqlite = process.env.NODE_ENV === 'development' ? sqlite3.verbose() : sqlite3;
    
    this.db = new sqlite.Database(dbPath, (err: Error | null) => {
      if (err) {
        console.error('Error opening database:', err);
        process.exit(1); // Exit in production if database fails
      } else {
        console.log(`Connected to SQLite database at: ${dbPath}`);
        this.initializeSchema();
      }
    });

    // Handle database errors
    this.db.on('error', (err: Error) => {
      console.error('Database error:', err);
    });
  }

  private initializeSchema(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS Contact (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phoneNumber TEXT,
        email TEXT,
        linkedId INTEGER,
        linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        deletedAt DATETIME,
        FOREIGN KEY (linkedId) REFERENCES Contact(id)
      )
    `;

    this.db.run(createTableSQL, (err: Error | null) => {
      if (err) {
        console.error('Error creating table:', err);
      } else {
        console.log('Contact table initialized');
      }
    });
  }

  public run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  public get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err: Error | null, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  public all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err: Error | null, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export const database = new Database();
