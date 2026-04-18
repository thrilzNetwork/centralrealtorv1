import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// Replicate model. Veo is enterprise-gated; `minimax/video-01` is generally
// available and gives realtor-friendly results. Override via `model` in body.
const DEFAULT_MODEL = "minimax/video-01";

const STYLE_PRESETS: Record<string, string> = {
  cinematic:   "cinematic real estate walkthrough, slow dolly, golden hour lighting, shallow depth of field",
  aerial:      "aerial drone shot sweeping over the property, wide angle, dramatic sky",
  walkthrough: "first person walkthrough of the property, steady gimbal, natural lighting",
  testimonial: "agent on camera, friendly tone, modern interior behind, 9:16 portrait",
};

type Body = {
  style?: keyof typeof STYLE_PRESETS;
  listingTitle?: string;
  customPrompt?: string;
  model?: string;
};

export async function POST(request: NextRequest) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN no está configurado. Video IA deshabilitado." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Body;
  const style = body.style && STYLE_PRESETS[body.style] ? body.style : "cinematic";
  const stylePrompt = STYLE_PRESETS[style];

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, city")
    .eq("id", user.id)
    .single();

  const agentName = profile?.full_name ?? "Asesor Inmobiliario";
  const city = profile?.city ?? "Bolivia";

  const prompt = [
    stylePrompt,
    body.listingTitle ? `Property: ${body.listingTitle}` : null,
    `Agent: ${agentName}, ${city}`,
    body.customPrompt ?? null,
  ]
    .filter(Boolean)
    .join(". ");

  const model = body.model ?? DEFAULT_MODEL;

  // `Prefer: wait` blocks up to 60s so most calls return a finished URL.
  const resp = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify({
      input: { prompt, prompt_optimizer: true },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("replicate video error:", resp.status, errText);
    return NextResponse.json(
      { error: `Replicate devolvió ${resp.status}. Revisa el token y el acceso al modelo.` },
      { status: 502 }
    );
  }

  const data = (await resp.json()) as {
    id: string;
    status: string;
    output?: string | string[];
    error?: string;
  };

  if (data.status === "succeeded" && data.output) {
    const videoUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    return NextResponse.json({
      videoUrl,
      predictionId: data.id,
      status: "succeeded",
      style,
      label: "Video IA",
      generatedAt: new Date().toISOString(),
    });
  }

  if (data.status === "failed" || data.error) {
    return NextResponse.json(
      { error: data.error ?? "La generación de video falló." },
      { status: 502 }
    );
  }

  // Still processing — client must poll `/api/media/video-status/[id]`.
  return NextResponse.json({
    predictionId: data.id,
    status: data.status,
    style,
    label: "Video IA",
    generatedAt: new Date().toISOString(),
  });
}
