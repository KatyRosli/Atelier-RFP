import express from "express";
import { config } from "../config.ts";
import { fetchProposalesCompanies } from "../services/proposales-client.ts";

export const healthRouter = express.Router();

healthRouter.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    tenant: "Noir Hôtel Stockholm",
    hasGeminiKey: !!config.geminiApiKey,
    hasOpenAIKey: !!config.openaiApiKey,
    hasProposalesKey: !!config.proposales.inboxToken,
  });
});


healthRouter.get("/api/proposales/company", async (_req, res) => {
  const apiKey = config.proposales.apiKey;
  if (!apiKey) {
    return res.status(404).json({ error: "PROPOSALES_API_KEY not configured" });
  }
  try {
    const response = await fetchProposalesCompanies(apiKey);
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch company info from Proposales" });
    }
    const { data } = await response.json();
    const company = data?.[0];
    if (!company) {
      return res.status(404).json({ error: "No company found for this API key" });
    }
    res.json({
      name: company.name,
      websiteUrl: company.website_url,
      currency: company.currency,
    });
  } catch (err) {
    console.warn("Proposales company lookup failed:", err);
    res.status(502).json({ error: "Could not reach Proposales API" });
  }
});
