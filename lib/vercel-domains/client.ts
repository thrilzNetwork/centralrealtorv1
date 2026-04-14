const VERCEL_API = "https://api.vercel.com";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function getProjectId() {
  return process.env.VERCEL_PROJECT_ID!;
}

function getTeamId() {
  return process.env.VERCEL_TEAM_ID;
}

function withTeam(url: string): string {
  const teamId = getTeamId();
  return teamId ? `${url}?teamId=${teamId}` : url;
}

export interface VercelDomainResult {
  name: string;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
}

export async function addDomain(domain: string): Promise<VercelDomainResult> {
  const res = await fetch(
    withTeam(`${VERCEL_API}/v10/projects/${getProjectId()}/domains`),
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name: domain }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? `Failed to add domain: ${res.status}`);
  }

  return res.json();
}

export async function removeDomain(domain: string): Promise<void> {
  const res = await fetch(
    withTeam(`${VERCEL_API}/v9/projects/${getProjectId()}/domains/${domain}`),
    {
      method: "DELETE",
      headers: getHeaders(),
    }
  );

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Failed to remove domain: ${res.status}`);
  }
}

export async function getDomainStatus(domain: string): Promise<{ verified: boolean }> {
  const res = await fetch(
    withTeam(`${VERCEL_API}/v6/domains/${domain}/config`),
    { headers: getHeaders() }
  );

  if (!res.ok) return { verified: false };
  const data = await res.json();
  return { verified: !data.misconfigured };
}
