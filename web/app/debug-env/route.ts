import { connection } from "next/server";
import { NextResponse } from "next/server";

export async function GET() {
  await connection();
  return NextResponse.json({
    API_URL: process.env.API_URL || "(not set)",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "(not set)",
  });
}
