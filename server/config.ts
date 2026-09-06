// Centralizes every process.env read in one place instead of scattering them
// through route handlers. Nothing here is "required" (this app runs fine with
// providers/integrations disabled), but reading it all in one spot means the
// full set of things that CAN be configured is visible at a glance.

export const config = {
  port: 3000,

  // No login screen: this is a single-account technical demo, so every voice-to-RFP
  // recording is saved under one fixed default account instead of a per-user identity.
  defaultUserId: "alex-default-user",
  defaultUserEmail: "alex.lindell@noirhotel.se",

  // When the frontend is deployed separately from this backend (e.g. Vercel + Railway),
  // set ALLOWED_ORIGIN to the frontend's origin(s), comma-separated. Left unset, CORS is
  // wide open, which is fine for same-origin deployments or local development.
  allowedOrigins: (process.env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  openaiApiKey: process.env.OPENAI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,

  proposales: {
    apiKey: process.env.PROPOSALES_API_KEY,
    companyId: process.env.PROPOSALES_COMPANY_ID,
    inboxToken: process.env.PROPOSALES_INBOX_TOKEN,
    isTestSubmission: process.env.PROPOSALES_IS_TEST !== "false",
  },
};
