//app\api\auth\me\route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

export async function GET(request: Request) {
  const token = request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];

  if (!token) return NextResponse.json({ loggedIn: false }, { status: 401 });

  try {
    const user = jwt.verify(token, JWT_SECRET);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ loggedIn: false }, { status: 401 });
  }
}
