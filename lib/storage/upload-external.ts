/**
 * Re-upload external images to Supabase Storage so they render reliably.
 * Downloaded images get uploaded to the "listings" bucket under {userId}/.
 * External => Supabase, internal (already supabase.co) => pass through.
 */
import { createAdminClient } from "@/lib/supabase/admin";

const EXTERNAL_DOMAINS = [
  "infocasas.com",
  "fincaraiz.com.co",
  "c21.com.bo",
  "cloudfront.net",
  "googleapis.com",
  "unsplash.com",
  "postimg.cc",
];

function isExternalUrl(url: string): boolean {
  if (!url || !url.startsWith("http")) return false;
  // Already on our Supabase? Pass through
  if (url.includes(".supabase.co") || url.includes(".supabase.in")) return false;
  return true;
}

export async function reuploadExternalImages(
  urls: string[],
  userId: string
): Promise<string[]> {
  if (!urls.length) return [];

  const admin = createAdminClient();
  const results: string[] = [];

  for (const url of urls) {
    if (!isExternalUrl(url)) {
      results.push(url);
      continue;
    }

    try {
      // Download the image
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent": "Mozilla/5.0 CentralBolivia/1.0",
        },
      });

      if (!response.ok) {
        console.warn(`[REUPLOAD] Failed to download ${url}: ${response.status}`);
        results.push(url); // Keep original as fallback
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type") ?? "image/jpeg";
      const ext = contentType.split("/")[1] ?? "jpg";

      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error } = await admin.storage
        .from("listings")
        .upload(fileName, buffer, {
          contentType,
          upsert: false,
        });

      if (error) {
        console.warn(`[REUPLOAD] Upload failed for ${url}: ${error.message}`);
        results.push(url);
        continue;
      }

      const { data: { publicUrl } } = admin.storage.from("listings").getPublicUrl(data.path);
      results.push(publicUrl);
    } catch (err) {
      console.warn(`[REUPLOAD] Error processing ${url}:`, err);
      results.push(url); // Keep original as fallback
    }
  }

  return results;
}
