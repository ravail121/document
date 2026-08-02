import { Pool, type QueryResult, type QueryResultRow } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

function getPool(): Pool {
  if (!globalForDb.pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }

    const isProduction = process.env.NODE_ENV === "production";

    globalForDb.pgPool = new Pool({
      connectionString,
      // Production: enable TLS for hosted Postgres. Providers often use certificates
      // that Node does not trust by default, so rejectUnauthorized is false.
      ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {}),
      // Production: each serverless invocation is its own isolate. A large per-instance
      // pool multiplied across concurrent invocations exhausts the DB connection limit;
      // the hosted transaction pooler handles real pooling, so max stays at 1.
      ...(isProduction ? { max: 1 } : {}),
    });
  }

  // Cache the pool on globalThis so Next.js hot reload in local development does not
  // open a new pool on every module re-evaluation.
  return globalForDb.pgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}
