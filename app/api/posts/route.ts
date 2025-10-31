import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "LocalLoop",
  password: "qwe",
  port: 5432,
});

export async function GET() {
  try {
    const { rows } = await pool.query("SELECT * FROM posts ORDER BY created_at DESC");
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/posts error:", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, latitude, longitude } = await request.json();

    if (!title || !latitude || !longitude) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { rows } = await pool.query(
      "INSERT INTO posts (title, latitude, longitude) VALUES ($1, $2, $3) RETURNING *",
      [title, latitude, longitude]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error("POST /api/posts error:", err);
    return NextResponse.json({ error: "Failed to add post" }, { status: 500 });
  }
}
