import sql from "mssql";

const config: sql.config = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,  // Close idle connections after 30s
    acquireTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  // If pool exists but is not connected, reset it
  if (pool && !pool.connected) {
    try {
      await pool.close();
    } catch {
      // Ignore close errors
    }
    pool = null;
  }

  // Create new pool if needed
  if (!pool) {
    pool = await sql.connect(config);
    
    // Handle pool errors to reset on connection issues
    pool.on('error', (err) => {
      console.error('SQL Pool Error:', err);
      pool = null;
    });
  }

  return pool;
}

