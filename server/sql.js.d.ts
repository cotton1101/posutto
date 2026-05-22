/* eslint-disable @typescript-eslint/no-explicit-any */
// Minimal type stubs for the external `sql.js` library. The upstream API is
// inherently dynamic, so `any` is intentional here.
declare module 'sql.js' {
    interface QueryExecResult {
        columns: string[];
        values: any[][];
    }

    interface Statement {
        bind(params?: any[]): boolean;
        step(): boolean;
        getAsObject(params?: object): Record<string, any>;
        get(params?: any[]): any[];
        free(): boolean;
        reset(): void;
    }

    interface Database {
        run(sql: string, params?: any[]): Database;
        exec(sql: string, params?: any[]): QueryExecResult[];
        prepare(sql: string): Statement;
        getRowsModified(): number;
        export(): Uint8Array;
        close(): void;
    }

    interface SqlJsStatic {
        Database: {
            new(): Database;
            new(data: ArrayLike<number>): Database;
            new(data: Buffer): Database;
        };
    }

    export type { Database, Statement, QueryExecResult, SqlJsStatic };

    export default function initSqlJs(config?: any): Promise<SqlJsStatic>;
}
