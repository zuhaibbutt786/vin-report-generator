/**
 * NHTSA Recalls API (by Year/Make/Model)
 * https://api.nhtsa.gov/recalls/recallsByVehicle
 */

import type { RecallItem } from "../types";

export interface RecallsResult {
  success: boolean;
  error?: string;
  count: number;
  items: RecallItem[];
}

export async function fetchRecalls(
  make: string,
  model: string,
  modelYear: string
): Promise<RecallsResult> {
  if (!make || !model || !modelYear) {
    return {
      success: false,
      error: "Make, model, and year required for recall lookup.",
      count: 0,
      items: [],
    };
  }

  try {
    const url = new URL("https://api.nhtsa.gov/recalls/recallsByVehicle");
    url.searchParams.set("make", make);
    url.searchParams.set("model", model);
    url.searchParams.set("modelYear", modelYear);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        success: false,
        error: `Recalls service returned ${res.status}.`,
        count: 0,
        items: [],
      };
    }

    const json = await res.json();
    const results = json?.results || [];

    const items: RecallItem[] = results.map((r: Record<string, unknown>) => ({
      campaignNumber: String(r.NHTSACampaignNumber || ""),
      manufacturer: r.Manufacturer ? String(r.Manufacturer) : undefined,
      component: r.Component ? String(r.Component) : undefined,
      summary: r.Summary ? String(r.Summary) : undefined,
      consequence: r.Consequence ? String(r.Consequence) : undefined,
      remedy: r.Remedy ? String(r.Remedy) : undefined,
      notes: r.Notes ? String(r.Notes) : undefined,
      reportDate: r.ReportReceivedDate ? String(r.ReportReceivedDate) : undefined,
      parkIt: Boolean(r.parkIt),
      parkOutSide: Boolean(r.parkOutSide),
      overTheAirUpdate: Boolean(r.overTheAirUpdate),
    }));

    return { success: true, count: items.length, items };
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Recall lookup timed out."
        : "Recall information was not available from the connected free source.";
    return { success: false, error: message, count: 0, items: [] };
  }
}
