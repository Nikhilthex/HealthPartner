import session from "express-session";
import Database from "better-sqlite3";

type SessionRow = {
  id: string;
  data: string;
};

const getUserIdFromSession = (sess: session.SessionData) =>
  typeof sess.userId === "number" ? sess.userId : null;

export class SqliteSessionStore extends session.Store {
  private readonly getStatement;
  private readonly upsertStatement;
  private readonly destroyStatement;
  private readonly touchStatement;
  private readonly cleanupStatement;

  constructor(private readonly db: Database.Database) {
    super();
    this.getStatement = this.db.prepare("SELECT id, data FROM user_sessions WHERE id = ? AND expires_at > ?");
    this.upsertStatement = this.db.prepare(`
      INSERT INTO user_sessions (id, user_id, expires_at, data, created_at, updated_at)
      VALUES (@id, @userId, @expiresAt, @data, @now, @now)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        expires_at = excluded.expires_at,
        data = excluded.data,
        updated_at = excluded.updated_at
    `);
    this.destroyStatement = this.db.prepare("DELETE FROM user_sessions WHERE id = ?");
    this.touchStatement = this.db.prepare("UPDATE user_sessions SET expires_at = ?, updated_at = ? WHERE id = ?");
    this.cleanupStatement = this.db.prepare("DELETE FROM user_sessions WHERE expires_at <= ?");
  }

  get(sid: string, callback: (err?: unknown, sessionData?: session.SessionData | null) => void) {
    try {
      this.cleanupExpired();
      const row = this.getStatement.get(sid, new Date().toISOString()) as SessionRow | undefined;

      if (!row) {
        callback(undefined, null);
        return;
      }

      callback(undefined, JSON.parse(row.data) as session.SessionData);
    } catch (error) {
      callback(error);
    }
  }

  set(sid: string, sess: session.SessionData, callback?: (err?: unknown) => void) {
    try {
      this.cleanupExpired();
      const now = new Date().toISOString();
      const expiresAt = this.resolveExpiry(sess);

      this.upsertStatement.run({
        id: sid,
        userId: getUserIdFromSession(sess),
        expiresAt,
        data: JSON.stringify(sess),
        now
      });

      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  destroy(sid: string, callback?: (err?: unknown) => void) {
    try {
      this.destroyStatement.run(sid);
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  touch(sid: string, sess: session.SessionData, callback?: () => void) {
    const now = new Date().toISOString();
    this.touchStatement.run(this.resolveExpiry(sess), now, sid);
    callback?.();
  }

  private cleanupExpired() {
    this.cleanupStatement.run(new Date().toISOString());
  }

  private resolveExpiry(sess: session.SessionData) {
    const expiry = sess.cookie?.expires;

    if (expiry instanceof Date) {
      return expiry.toISOString();
    }

    const maxAge = sess.cookie?.maxAge ?? 1000 * 60 * 60 * 24;
    return new Date(Date.now() + maxAge).toISOString();
  }
}
