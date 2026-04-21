import { createAdminClient } from "@/lib/supabase/admin";

export type AuditEntry = {
  actor_id: string | null;
  action: string;
  subject_id?: string | null;
  resource?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("audit_log").insert({
      actor_id:   entry.actor_id,
      action:     entry.action,
      subject_id: entry.subject_id ?? null,
      resource:   entry.resource ?? null,
      metadata:   entry.metadata ?? {},
    });
  } catch (err) {
    console.error("audit_log insert failed:", err);
  }
}
