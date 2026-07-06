import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Env file lives at the monorepo root, not per-app, since this is a single-deployment personal app.
const here = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(here, "../../../../.env");

dotenv.config({ path: rootEnvPath });
