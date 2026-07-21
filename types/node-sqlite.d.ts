declare module 'node:sqlite' {
  export interface RunResult {
    changes: number;
    lastInsertRowid: number;
  }

  export interface Statement {
    run(...params: unknown[]): RunResult;
    get(...params: unknown[]): Record<string, unknown>;
    all(...params: unknown[]): Record<string, unknown>[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: Record<string, unknown>);

    exec(sql: string): void;

    prepare(sql: string): Statement;
  }
}
