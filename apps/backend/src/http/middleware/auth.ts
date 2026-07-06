import type { FastifyRequest, FastifyReply } from "fastify";
import { env } from "../../config/env.js";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (token !== env.API_AUTH_TOKEN) {
    return reply.code(401).send({ error: "unauthorized" });
  }
}
