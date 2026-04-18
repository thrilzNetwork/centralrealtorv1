import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 15;

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "REPLICATE_API_TOKEN missing" }, { status: 503 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const resp = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!resp.ok) {
    const errText = await resp.text();
    return NextResponse.json(
      { error: `Replicate status ${resp.status}: ${errText}` },
      { status: 502 }
    );
  }

  const data = (await resp.json()) as {
    id: string;
    status: string;
    output?: string | string[];
    error?: string;
  };

  const videoUrl =
    data.status === "succeeded" && data.output
      ? Array.isArray(data.output) ? data.output[0] : data.output
      : null;

  return NextResponse.json({
    id: data.id,
    status: data.status,
    videoUrl,
    error: data.error ?? null,
  });
}
