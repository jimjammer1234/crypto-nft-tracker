import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../config/env.js";
import * as mining from "./schema/mining.js";
import * as nft from "./schema/nft.js";
import * as alerts from "./schema/alerts.js";

const schema = { ...mining, ...nft, ...alerts };

export const queryClient = postgres(env.DATABASE_URL);
export const db = drizzle(queryClient, { schema });
