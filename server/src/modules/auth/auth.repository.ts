import Database from "better-sqlite3";

export type UserRecord = {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

const mapUserRecord = (row: {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}): UserRecord => ({
  id: row.id,
  username: row.username,
  passwordHash: row.password_hash,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export class AuthRepository {
  private readonly findByUsernameStatement;
  private readonly findByIdStatement;
  private readonly createUserStatement;

  constructor(private readonly db: Database.Database) {
    this.findByUsernameStatement = this.db.prepare(
      "SELECT id, username, password_hash, created_at, updated_at FROM users WHERE username = ?"
    );
    this.findByIdStatement = this.db.prepare(
      "SELECT id, username, password_hash, created_at, updated_at FROM users WHERE id = ?"
    );
    this.createUserStatement = this.db.prepare(`
      INSERT INTO users (username, password_hash, created_at, updated_at)
      VALUES (@username, @passwordHash, @createdAt, @updatedAt)
    `);
  }

  findByUsername(username: string): UserRecord | null {
    const row = this.findByUsernameStatement.get(username) as
      | {
          id: number;
          username: string;
          password_hash: string;
          created_at: string;
          updated_at: string;
        }
      | undefined;

    return row ? mapUserRecord(row) : null;
  }

  findById(id: number): UserRecord | null {
    const row = this.findByIdStatement.get(id) as
      | {
          id: number;
          username: string;
          password_hash: string;
          created_at: string;
          updated_at: string;
        }
      | undefined;

    return row ? mapUserRecord(row) : null;
  }

  createUser(username: string, passwordHash: string): UserRecord {
    const now = new Date().toISOString();
    const result = this.createUserStatement.run({
      username,
      passwordHash,
      createdAt: now,
      updatedAt: now
    });

    return this.findById(Number(result.lastInsertRowid)) as UserRecord;
  }
}
