import path from "path";
import dotenv from "dotenv";

// Imported first, before any module that reads process.env at load time (e.g. the
// Postgres pool in db/index.ts) - ES module imports fully evaluate in source order
// before the importing file's own code runs, so this must be the first import.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
