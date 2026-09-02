/**
 * NHTSA vPIC API client (client-side, free, no key)
 * https://vpic.nhtsa.dot.gov/api/
 */

export interface VpicResult {
  success: boolean;
  error?: string;
  data: Record<string, string>;
  raw?: unknown;
}

const BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";

export async function decodeVIN(vin: string): Promise<VpicResult> {
  try {
    const url = `${BASE}/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        success: false,
        error: `NHTSA service returned ${res.status}. Please try again later.`,
        data: {},
      };
    }

    const json = await res.json();
    const result = json?.Results?.[0];

    if (!result) {
      return {
        success: false,
        error: "No decode results returned for this VIN.",
        data: {},
      };
    }

    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(result)) {
      if (v != null && String(v).trim() !== "") {
        data[k] = String(v).trim();
      }
    }

    const errorCode = data.ErrorCode || "0";
    if (errorCode !== "0" && errorCode !== "1") {
      return {
        success: true,
        error: data.ErrorText || "Partial decode with warnings.",
        data,
        raw: result,
      };
    }

    return { success: true, data, raw: result };
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "VIN decoding timed out. Please check your connection and try again."
        : "VIN decoding service temporarily unavailable. Check your internet connection.";
    return { success: false, error: message, data: {} };
  }
}

export async function decodeVINWithModelYear(
  vin: string,
  modelYear: string | number
): Promise<VpicResult> {
  try {
    const url = `${BASE}/DecodeVinValues/${encodeURIComponent(vin)}?format=json&modelyear=${modelYear}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      return { success: false, error: `NHTSA service returned ${res.status}`, data: {} };
    }
    const json = await res.json();
    const result = json?.Results?.[0] || {};
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(result)) {
      if (v != null && String(v).trim() !== "") data[k] = String(v).trim();
    }
    return { success: true, data, raw: result };
  } catch {
    return {
      success: false,
      error: "VIN decoding service temporarily unavailable.",
      data: {},
    };
  }
}
