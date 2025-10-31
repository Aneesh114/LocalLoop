//app\api\auth\login\route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "LocalLoop",
  password: "qwe",
  port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });

    const res = NextResponse.json({ message: "Login successful" });
    res.cookies.set("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 });

    return res;
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
