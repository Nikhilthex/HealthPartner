import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

export const createDatabaseConnection = (databasePath: string) => {
  const directory = path.dirname(databasePath);
  fs.mkdirSync(directory, { recursive: true });

  const db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return db;
};
