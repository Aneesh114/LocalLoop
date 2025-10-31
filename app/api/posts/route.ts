//app\api\posts\route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
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

    const token = request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // continue with your insert logic...
   try {
    const { title, description, latitude, longitude } = await request.json();

    if (!title || !latitude || !longitude) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { rows } = await pool.query(
      "INSERT INTO posts (title,description, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *",
      [title,description, latitude, longitude]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error("POST /api/posts error:", err);
    return NextResponse.json({ error: "Failed to add post" }, { status: 500 });
  }
}
 

