import * as cheerio from "cheerio";
import { parseHashrateString } from "../../utils/hashrate.js";

export interface KanoParsedStats {
  totalWorkers: number | null;
  activeWorkers: number | null;
  totalHashrate: number | null;
  totalShares: number | null;
  secondsSinceLastShare: number | null;
}

/**
 * kano.is has no JSON API despite the `api=` query param (it just bypasses login on the HTML worker
 * page). We scrape the #wkt table instead. This is inherently fragile — if kano.is changes markup,
 * these selectors break; raw HTML is still stored in raw_payload so parsing can be redone later.
 */
export async function fetchKanoWorkersHtml(username: string, apiKey: string): Promise<string> {
  const res = await fetch(`https://kano.is/index.php?k=work&username=${username}&api=${apiKey}`);
  if (!res.ok) {
    throw new Error(`kano.is request failed: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

export function parseKanoWorkersHtml(html: string): KanoParsedStats {
  const $ = cheerio.load(html);
  const footerRow = $("#wkt tfoot tr").first();

  const totalsText = footerRow.find("td").first().text();
  const totalsMatch = /Total:\s*(\d+)\s*\((\d+)\s*active workers?\)/i.exec(totalsText);

  const sharesText = footerRow.find("td[data-n]").first().attr("data-n") ?? "";
  const totalShares = sharesText ? Number(sharesText.replace(/,/g, "")) : null;

  // Multiple footer cells are hashrate-shaped (Share Rate and Hash Rate); Hash Rate is the one that
  // appears last in document order for this table layout.
  let totalHashrate: number | null = null;
  footerRow.find("td").each((_, el) => {
    const parsed = parseHashrateString($(el).text().trim());
    if (parsed !== null) totalHashrate = parsed;
  });

  let secondsSinceLastShare: number | null = null;
  $("#wkt tbody tr").each((_, row) => {
    const raw = $(row).find("td:nth-child(3)").attr("data-srt");
    if (raw === undefined) return;
    const seconds = Number(raw);
    if (Number.isNaN(seconds)) return;
    if (secondsSinceLastShare === null || seconds < secondsSinceLastShare) {
      secondsSinceLastShare = seconds;
    }
  });

  return {
    totalWorkers: totalsMatch ? Number(totalsMatch[1]) : null,
    activeWorkers: totalsMatch ? Number(totalsMatch[2]) : null,
    totalHashrate,
    totalShares,
    secondsSinceLastShare,
  };
}
