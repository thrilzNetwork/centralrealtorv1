import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // This is a placeholder until Veo API key is procured
    return NextResponse.json(
      { error: "API Key for Veo is missing. Video generation is currently unavailable." },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
