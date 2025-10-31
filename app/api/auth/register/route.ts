//app\api\auth\register\route.ts

import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "LocalLoop",
  password: "qwe",
  port: 5432,
});

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
      [email, hashed]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    console.error("POST /api/auth/register error:", err);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
