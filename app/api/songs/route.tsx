import { NextResponse } from "next/server";
import { getSongs } from "@/app/lib/db";

export async function POST(req: Request) {
  try {
    const { emotion, quantity } = await req.json();
    const songs = await getSongs(emotion, quantity);
    return NextResponse.json(songs);
  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
