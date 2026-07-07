import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_AUTH_TOKEN: z.string().min(16),
  PORT: z.coerce.number().default(8787),

  CKPOOL_BTC_ADDRESS: z.string().min(1),
  KANO_USERNAME: z.string().optional(),
  KANO_API_KEY: z.string().optional(),
  HEROMINERS_PRL_ADDRESS: z.string().optional(),
  HEROMINERS_XMR_ADDRESS: z.string().optional(),
  HASHVAULT_XMR_ADDRESS: z.string().optional(),

  OPENSEA_API_KEY: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  ALERT_EMAIL_TO: z.string().email().optional(),
});

export const env = envSchema.parse(process.env);
