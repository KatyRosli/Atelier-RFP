// Thin wrapper around the three Proposales API calls this app makes. Each call site
// still handles its own response (their shapes and error-handling differ enough that
// forcing one generic wrapper on top would risk changing behavior) - this module only
// centralizes the base URL, endpoint paths, and request construction.

const PROPOSALES_API_BASE = "https://api.proposales.com";

// GET /v3/companies - lists every company the API key's user belongs to.
export function fetchProposalesCompanies(apiKey: string): Promise<Response> {
  return fetch(`${PROPOSALES_API_BASE}/v3/companies`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

// POST /v3/proposals ("Create Proposal") - requires Bearer auth + company_id, authors
// a real proposal and returns a client-facing URL.
export function createProposalesProposal(apiKey: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(`${PROPOSALES_API_BASE}/v3/proposals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
}

// POST /v1/inbox/{token} ("Create an RFP") - public, no auth, files a request into a
// company's inbox. No client-facing URL is returned.
export function submitProposalesRfp(inboxToken: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(`${PROPOSALES_API_BASE}/v1/inbox/${inboxToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
