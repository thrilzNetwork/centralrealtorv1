import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { google } from "googleapis";

// Handles scheduling intent from the tenant chatbot.
//
// POST with action="slots"  → returns 3 available 30-min slots for the next 7 days
// POST with action="book"   → creates a Calendar event + sends Gmail confirmation
//
// Falls back gracefully if no Google token is stored for the realtor.

const WORK_START_HOUR = 9;  // 9 AM
const WORK_END_HOUR = 18;   // 6 PM
const SLOT_MINUTES = 30;

function buildOAuth2(refreshToken: string) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

function formatSlot(date: Date): string {
  return date.toLocaleString("es-BO", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/La_Paz",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile_id, action, visitor_name, visitor_email, slot_iso } = body;

    if (!profile_id || !action) {
      return NextResponse.json({ error: "profile_id and action required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("google_refresh_token, google_calendar_id, full_name, email")
      .eq("id", profile_id)
      .single();

    // ── No Google token → return placeholder slots ──────────────────────────
    if (!profile?.google_refresh_token) {
      const now = new Date();
      const placeholderSlots: string[] = [];
      let checked = new Date(now);
      checked.setDate(checked.getDate() + 1);
      checked.setHours(WORK_START_HOUR, 0, 0, 0);

      while (placeholderSlots.length < 3) {
        const dow = checked.getDay();
        if (dow !== 0 && dow !== 6) {
          placeholderSlots.push(formatSlot(checked));
          checked = new Date(checked.getTime() + 24 * 60 * 60 * 1000);
          checked.setHours(WORK_START_HOUR + placeholderSlots.length * 2, 0, 0, 0);
        } else {
          checked.setDate(checked.getDate() + 1);
        }
      }
      return NextResponse.json({ slots: placeholderSlots, calendar_linked: false });
    }

    const oauth2 = buildOAuth2(profile.google_refresh_token);
    const calendar = google.calendar({ version: "v3", auth: oauth2 });
    const calendarId = profile.google_calendar_id ?? "primary";

    // ── GET SLOTS ───────────────────────────────────────────────────────────
    if (action === "slots") {
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() + 1);
      timeMin.setHours(0, 0, 0, 0);

      const timeMax = new Date(timeMin);
      timeMax.setDate(timeMax.getDate() + 7);

      const freeBusy = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: calendarId }],
        },
      });

      const busyPeriods = freeBusy.data.calendars?.[calendarId]?.busy ?? [];

      // Walk each day finding free 30-min windows
      const slots: string[] = [];
      const cursor = new Date(timeMin);

      while (slots.length < 3 && cursor < timeMax) {
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) {
          // Try slots from WORK_START_HOUR to WORK_END_HOUR
          for (let h = WORK_START_HOUR; h < WORK_END_HOUR && slots.length < 3; h++) {
            for (let m = 0; m < 60 && slots.length < 3; m += SLOT_MINUTES) {
              const slotStart = new Date(cursor);
              slotStart.setHours(h, m, 0, 0);
              const slotEnd = new Date(slotStart.getTime() + SLOT_MINUTES * 60 * 1000);

              const isBusy = busyPeriods.some((b) => {
                const bStart = new Date(b.start!);
                const bEnd = new Date(b.end!);
                return slotStart < bEnd && slotEnd > bStart;
              });

              if (!isBusy) {
                slots.push(formatSlot(slotStart));
              }
            }
          }
        }
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(0, 0, 0, 0);
      }

      return NextResponse.json({ slots, calendar_linked: true });
    }

    // ── BOOK SLOT ───────────────────────────────────────────────────────────
    if (action === "book") {
      if (!slot_iso || !visitor_name) {
        return NextResponse.json({ error: "slot_iso and visitor_name required" }, { status: 400 });
      }

      const start = new Date(slot_iso);
      const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);

      await calendar.events.insert({
        calendarId,
        sendNotifications: true,
        requestBody: {
          summary: `Visita: ${visitor_name}`,
          description: visitor_email
            ? `Interesado: ${visitor_name} (${visitor_email})`
            : `Interesado: ${visitor_name}`,
          start: { dateTime: start.toISOString(), timeZone: "America/La_Paz" },
          end: { dateTime: end.toISOString(), timeZone: "America/La_Paz" },
          attendees: visitor_email ? [{ email: visitor_email }] : [],
        },
      });

      // Send Gmail confirmation to visitor
      if (visitor_email) {
        const gmail = google.gmail({ version: "v1", auth: oauth2 });
        const realtorName = profile.full_name ?? "Tu asesor";
        const slotFormatted = formatSlot(start);
        const rawMsg = [
          `To: ${visitor_email}`,
          "Content-Type: text/plain; charset=utf-8",
          "MIME-Version: 1.0",
          `Subject: Visita confirmada — ${slotFormatted}`,
          "",
          `Hola ${visitor_name},\n\nTu visita ha sido confirmada para el ${slotFormatted}.\n\nTe esperamos, ${realtorName}.\n\nCentral Bolivia`,
        ].join("\n");

        const encoded = Buffer.from(rawMsg)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw: encoded },
        });
      }

      return NextResponse.json({ booked: true, slot: formatSlot(start) });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("schedule route error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
