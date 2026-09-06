import express from "express";
import cors from "cors";
import { config } from "./config.ts";
import { healthRouter } from "./routes/health.ts";
import { extractRouter } from "./routes/extract.ts";
import { proposalsRouter } from "./routes/proposals.ts";

export const app = express();

app.use(
  cors({
    origin: config.allowedOrigins.length > 0 ? config.allowedOrigins : true,
    credentials: true,
  })
);
app.use(express.json());

app.use(healthRouter);
app.use(extractRouter);
app.use(proposalsRouter);
