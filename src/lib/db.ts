import { Pool, PoolClient } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Export default para compatibilidade
export default pool;

// Export nomeado para maior clareza
export const db = pool;

// Tipos úteis
export type DatabasePool = Pool;
export type DatabaseClient = PoolClient;
