import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

export const query = async (text, params) => {
  const start = Date.now();
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    console.log("Executed query", { text, duration: Date.now() - start, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Error executing query:", text, error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
