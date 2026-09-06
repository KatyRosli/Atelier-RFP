import "./src/env.ts";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import { app } from "./server/app.ts";
import { config } from "./server/config.ts";

// Vite middleware in development, static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${config.port}`);
  });
}

startServer();
