import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "LocalLoop", // or localloop — depending on what your actual DB name is
  password: "qwe",
  port: 5432,
});

async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Connected to database successfully!");
    console.log("Server time:", res.rows[0].now);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  } finally {
    await pool.end();
  }
}

testConnection();
