import { Pool } from "pg";

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Neon resets search_path to '' on every new connection (a security default),
// which breaks the app's unqualified table names (e.g. `FROM expenses`).
// Setting it explicitly here is a no-op on plain Postgres and fixes Neon.
pool.on("connect", (client) => {
    client.query("SET search_path TO public");
});
