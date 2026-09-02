import type { VehicleReport, BrandingSettings, StoredReportMeta } from "../types";

const REPORTS_KEY = "vr_reports";
const META_KEY = "vr_report_meta";
const SETTINGS_KEY = "vr_settings";

const DEFAULT_SETTINGS: BrandingSettings = {
  name: "",
  company: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  address: "",
  reportFooter: "Confidential – For client use only",
  disclaimer:
    "Information in this report is compiled from available external data sources and user-provided information. Availability and accuracy depend on the underlying sources. The absence of information does not confirm that an event did not occur. This report is not a substitute for a professional mechanical inspection, official title verification, or a comprehensive paid vehicle-history report.",
  defaultReportTitle: "Vehicle VIN Report",
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getSettings(): BrandingSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...safeParse(localStorage.getItem(SETTINGS_KEY), {}) };
}

export function saveSettings(settings: BrandingSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getReportMetaList(): StoredReportMeta[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(META_KEY), []);
}

export function getReport(id: string): VehicleReport | null {
  if (typeof window === "undefined") return null;
  const all = safeParse<Record<string, VehicleReport>>(localStorage.getItem(REPORTS_KEY), {});
  return all[id] || null;
}

export function saveReport(report: VehicleReport): void {
  const all = safeParse<Record<string, VehicleReport>>(localStorage.getItem(REPORTS_KEY), {});
  all[report.id] = report;
  localStorage.setItem(REPORTS_KEY, JSON.stringify(all));

  const meta = getReportMetaList().filter((m) => m.id !== report.id);
  const label = [
    report.identification.modelYear,
    report.identification.make,
    report.identification.model,
  ]
    .filter(Boolean)
    .join(" ") || "Unknown Vehicle";

  meta.unshift({
    id: report.id,
    vin: report.vin,
    vehicleLabel: label,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  });

  localStorage.setItem(META_KEY, JSON.stringify(meta.slice(0, 100)));
}

export function deleteReport(id: string): void {
  const all = safeParse<Record<string, VehicleReport>>(localStorage.getItem(REPORTS_KEY), {});
  delete all[id];
  localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
  const meta = getReportMetaList().filter((m) => m.id !== id);
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function getStats() {
  const meta = getReportMetaList();
  const now = new Date();
  const thisMonth = meta.filter((m) => {
    const d = new Date(m.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  return {
    total: meta.length,
    thisMonth: thisMonth.length,
    mostRecentVin: meta[0]?.vin || null,
    lastReportDate: meta[0]?.createdAt || null,
  };
}
