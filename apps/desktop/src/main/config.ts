import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// electron-vite's main process doesn't get Vite's import.meta.env substitution, so load the same
// .env file directly for the values the renderer already gets via VITE_-prefixed vars.
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../.env") });

export const config = {
  apiBaseUrl: process.env.VITE_API_BASE_URL!,
  apiToken: process.env.VITE_API_TOKEN!,
};
