import { logger } from "../../utils/logger.js";

export interface ShareEvent {
  workerName: string;
  difficulty: number;
}

const RECONNECT_DELAY_MS = 5000;

/**
 * herominers pushes individual share submissions over a Server-Sent Events stream. Their live
 * dashboard computes hashrate client-side from this stream (difficulty-weighted, over a rolling
 * window) rather than from the stats_address REST endpoint, and the two numbers can differ by
 * orders of magnitude. This client mirrors that approach so our figures match their live page.
 */
export function startHeroMinersShareStream(coinSubdomain: string, address: string, onShare: (event: ShareEvent) => void) {
  void connect(coinSubdomain, address, onShare);
}

async function connect(coinSubdomain: string, address: string, onShare: (event: ShareEvent) => void) {
  const url = `https://${coinSubdomain}.herominers.com/api/workers_stream?address=${address}`;

  try {
    const res = await fetch(url, { headers: { Accept: "text/event-stream" } });
    if (!res.ok || !res.body) {
      throw new Error(`workers_stream request failed: ${res.status} ${res.statusText}`);
    }

    logger.info({ coinSubdomain }, "herominers share stream connected");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const payload = JSON.parse(line.slice("data: ".length));
          if (payload.type === "share" && payload.worker && payload.shareDiff) {
            onShare({ workerName: payload.worker, difficulty: Number(payload.shareDiff) });
          }
        } catch {
          // ignore malformed lines
        }
      }
    }

    throw new Error("stream ended");
  } catch (err) {
    logger.error({ err, coinSubdomain }, "herominers share stream disconnected, reconnecting");
    setTimeout(() => void connect(coinSubdomain, address, onShare), RECONNECT_DELAY_MS);
  }
}
