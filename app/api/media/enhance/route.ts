import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // This is a placeholder until Nano Banana API key is procured
    return NextResponse.json(
      { error: "API Key for Nano Banana is missing. Media enhancement is currently unavailable." },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
