// app/api/comments/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";
import jwt from "jsonwebtoken";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "LocalLoop",
  password: "qwe",
  port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

// GET comments for a post
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT c.*, u.email AS user_email
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE post_id = $1
       ORDER BY created_at ASC`,
      [postId]
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/comments error:", err);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST new comment (requires login)
export async function POST(request: Request) {
  const token = request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let user;
  try {
    user = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const { post_id, text } = await request.json();
    if (!post_id || !text) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO comments (post_id, user_id, text)
       VALUES ($1, $2, $3) RETURNING *`,
      [post_id, user.id, text]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error("POST /api/comments error:", err);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
