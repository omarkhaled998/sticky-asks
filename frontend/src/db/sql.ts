import sql from "mssql";

const config: sql.config = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getDb() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}
