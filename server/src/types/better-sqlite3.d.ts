declare module "better-sqlite3" {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement {
    run(...params: unknown[]): RunResult;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  interface Database {
    pragma(command: string): unknown;
    exec(sql: string): this;
    prepare(sql: string): Statement;
    close(): void;
  }

  interface DatabaseConstructor {
    new (filename: string): Database;
  }

  const Database: DatabaseConstructor;

  namespace Database {
    export type Database = import("better-sqlite3").Database;
    export type Statement = import("better-sqlite3").Statement;
    export type RunResult = import("better-sqlite3").RunResult;
  }

  export = Database;
}
