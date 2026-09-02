"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getReport, saveReport, getSettings } from "../../../lib/storage";
import { downloadPdf } from "../../../lib/pdf/generate";
import type { VehicleReport, BrandingSettings, PhotoEntry } from "../../../lib/types";

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<VehicleReport | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [tab, setTab] = useState<"overview" | "edit" | "photos">("overview");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReport(getReport(id));
    setBranding(getSettings());
  }, [id]);

  function updateManual(partial: Partial<VehicleReport["manual"]>) {
    if (!report) return;
    const updated = {
      ...report,
      manual: { ...report.manual, ...partial },
      updatedAt: new Date().toISOString(),
    };
    setReport(updated);
  }

  function updateCondition(key: keyof VehicleReport["manual"]["condition"], value: string) {
    if (!report) return;
    updateManual({ condition: { ...report.manual.condition, [key]: value } });
  }

  function handleSave() {
    if (!report) return;
    setSaving(true);
    saveReport(report);
    setTimeout(() => setSaving(false), 600);
  }

  function handlePdf() {
    if (!report || !branding) return;
    downloadPdf(report, branding);
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>, label: string) {
    const file = e.target.files?.[0];
    if (!file || !report) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 1200;
        let w = img.width;
        let h = img.height;
        if (w > max) {
          h = (h * max) / w;
          w = max;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        const photo: PhotoEntry = {
          id: `ph-${Date.now()}`,
          label,
          dataUrl: compressed,
          addedAt: new Date().toISOString(),
        };
        updateManual({ photos: [...report.manual.photos, photo] });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function removePhoto(pid: string) {
    if (!report) return;
    updateManual({ photos: report.manual.photos.filter((p) => p.id !== pid) });
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Report not found.</p>
          <Link href="/" className="text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const vehicleLabel = [report.identification.modelYear, report.identification.make, report.identification.model].filter(Boolean).join(" ") || "Vehicle Report";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-slate-500 hover:text-blue-600">← Dashboard</Link>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">{vehicleLabel}</p>
              <p className="text-xs font-mono text-slate-400">{report.vin} · {report.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 text-sm text-slate-700 dark:text-zinc-200">
              {saving ? "Saved" : "Save"}
            </button>
            <button onClick={handlePdf} className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
              Generate PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-zinc-800">
          {(["overview", "edit", "photos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${
                tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "edit" ? "Edit / Inspection" : t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
              <div className="bg-slate-800 text-white px-6 py-4">
                <p className="text-slate-300 text-xs uppercase tracking-wide">Vehicle Report</p>
                <h2 className="text-xl font-bold">{vehicleLabel}</h2>
                <p className="font-mono text-sm mt-1 opacity-80">{report.vin}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6">
                <Field label="Make" value={report.identification.make} />
                <Field label="Model" value={report.identification.model} />
                <Field label="Year" value={report.identification.modelYear} />
                <Field label="Trim" value={report.identification.trim} />
                <Field label="Body Class" value={report.identification.bodyClass} />
                <Field label="Drive" value={report.drivetrain.driveType} />
                <Field label="Fuel" value={report.engine.fuelType} />
                <Field label="Engine" value={[report.engine.cylinders && `${report.engine.cylinders} cyl`, report.engine.displacement, report.engine.horsepower && `${report.engine.horsepower} hp`].filter(Boolean).join(" \u00b7 ") || undefined} />
                <Field label="Plant" value={[report.manufacturing.plantCity, report.manufacturing.plantState, report.manufacturing.plantCountry].filter(Boolean).join(", ") || undefined} />
              </div>
              <div className="px-6 pb-4 flex items-center gap-3 text-sm">
                <span className="text-slate-500">Data completeness:</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden max-w-xs">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${report.dataCompleteness}%` }} />
                </div>
                <span className="font-medium">{report.dataCompleteness}%</span>
              </div>
              <p className="px-6 pb-4 text-xs text-slate-400">Data completeness indicates how many requested fields were populated. It does not guarantee factual accuracy.</p>
            </section>

            <Section title="Vehicle Identification">
              <Grid>
                <Field label="Manufacturer" value={report.identification.manufacturer} />
                <Field label="Series" value={report.identification.series} />
                <Field label="Vehicle Type" value={report.identification.vehicleType} />
                <Field label="Vehicle Class" value={report.identification.vehicleClass} />
                {report.wmi && (
                  <>
                    <Field label="WMI Code" value={report.wmi.code} />
                    <Field label="WMI Country" value={report.wmi.country} />
                    <Field label="WMI Region" value={report.wmi.region} />
                  </>
                )}
              </Grid>
            </Section>

            <Section title="Engine & Drivetrain">
              <Grid>
                <Field label="Engine Model" value={report.engine.engineModel} />
                <Field label="Displacement" value={report.engine.displacement} />
                <Field label="Cylinders" value={report.engine.cylinders} />
                <Field label="Configuration" value={report.engine.configuration} />
                <Field label="Horsepower" value={report.engine.horsepower} />
                <Field label="Transmission" value={report.drivetrain.transmission} />
                <Field label="Drive Type" value={report.drivetrain.driveType} />
                <Field label="Doors" value={report.dimensions.doors} />
                <Field label="GVWR" value={report.dimensions.gvwr} />
              </Grid>
            </Section>

            <Section title="Manufacturing">
              <Grid>
                <Field label="Plant City" value={report.manufacturing.plantCity} />
                <Field label="Plant State" value={report.manufacturing.plantState} />
                <Field label="Plant Country" value={report.manufacturing.plantCountry} />
                <Field label="Plant Company" value={report.manufacturing.plantCompany} />
              </Grid>
            </Section>

            <Section title="Safety Recalls">
              {!report.safety.recallsAvailable || report.safety.recalls.length === 0 ? (
                <p className="text-sm text-slate-500">{report.safety.recallsNote || "Recall information was not available from the connected free source."}</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-amber-700 dark:text-amber-400">{report.safety.recalls.length} recall campaign(s) for this Year / Make / Model.</p>
                  {report.safety.recalls.map((r) => (
                    <div key={r.campaignNumber} className="border border-slate-200 dark:border-zinc-700 rounded-xl p-4 text-sm">
                      <p className="font-mono text-blue-600 font-medium">{r.campaignNumber}</p>
                      <p className="font-medium mt-0.5">{r.component}</p>
                      {r.summary && <p className="text-slate-600 dark:text-zinc-300 mt-1">{r.summary}</p>}
                      {r.remedy && <p className="text-slate-500 mt-1"><span className="font-medium">Remedy:</span> {r.remedy}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Sources">
              <ul className="text-sm space-y-2">
                {report.sources.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={s.success ? "text-green-600" : "text-red-500"}>{s.success ? "\u2713" : "\u2717"}</span>
                    <span><strong>{s.name}</strong>{s.error && <span className="text-slate-500"> \u2014 {s.error}</span>}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        )}

        {tab === "edit" && (
          <div className="space-y-6">
            <Section title="Client Information (User-provided)">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Client Name" value={report.manual.clientName || ""} onChange={(v) => updateManual({ clientName: v })} />
                <Input label="Client Reference" value={report.manual.clientReference || ""} onChange={(v) => updateManual({ clientReference: v })} />
                <Input label="Registration" value={report.manual.registration || ""} onChange={(v) => updateManual({ registration: v })} />
                <Input label="Mileage" value={report.manual.mileage || ""} onChange={(v) => updateManual({ mileage: v })} />
                <Input label="Purchase Price" value={report.manual.purchasePrice || ""} onChange={(v) => updateManual({ purchasePrice: v })} />
                <Input label="Inspection Date" value={report.manual.inspectionDate || ""} onChange={(v) => updateManual({ inspectionDate: v })} type="date" />
                <Input label="Inspector Name" value={report.manual.inspectorName || ""} onChange={(v) => updateManual({ inspectorName: v })} />
              </div>
            </Section>

            <Section title="Vehicle Condition (User-provided)">
              <div className="grid sm:grid-cols-2 gap-4">
                {([["overall", "Overall Condition"], ["exterior", "Exterior"], ["interior", "Interior"], ["engine", "Engine"], ["transmission", "Transmission"], ["electrical", "Electrical"], ["tires", "Tires"], ["brakes", "Brakes"]] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                    <select value={report.manual.condition[key]} onChange={(e) => updateCondition(key, e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm">
                      {key === "overall" ? (
                        <>
                          <option value="not_assessed">Not Assessed</option>
                          <option value="excellent">Excellent</option>
                          <option value="very_good">Very Good</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                        </>
                      ) : (
                        <>
                          <option value="not_inspected">Not Inspected</option>
                          <option value="excellent">Excellent</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                        </>
                      )}
                    </select>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Notes & Findings (User-provided)">
              <textarea value={report.manual.notes || ""} onChange={(e) => updateManual({ notes: e.target.value })} rows={4} placeholder="General notes\u2026" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm mb-3" />
              <textarea value={report.manual.additionalFindings || ""} onChange={(e) => updateManual({ additionalFindings: e.target.value })} rows={3} placeholder="Additional findings\u2026" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm" />
            </Section>

            <div className="flex justify-end">
              <button onClick={handleSave} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium">{saving ? "Saved \u2713" : "Save Changes"}</button>
            </div>
          </div>
        )}

        {tab === "photos" && (
          <div className="space-y-6">
            <Section title="Vehicle Photos (stored locally only)">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {["Front", "Rear", "Left Side", "Right Side", "Interior", "Dashboard", "Engine", "VIN Plate", "Odometer", "Damage", "Other"].map((label) => (
                  <label key={label} className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-xl p-4 cursor-pointer hover:border-blue-400 text-sm text-slate-500">
                    <span className="mb-1">+ {label}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e, label)} />
                  </label>
                ))}
              </div>
              {report.manual.photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {report.manual.photos.map((p) => (
                    <div key={p.id} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.dataUrl} alt={p.label} className="w-full h-36 object-cover rounded-xl border border-slate-200 dark:border-zinc-700" />
                      <p className="text-xs mt-1 text-slate-500">{p.label}</p>
                      <button onClick={() => removePhoto(p.id)} className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{children}</div>;
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">{value && value.trim() ? value : "Not available from free sources"}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm" />
    </div>
  );
}
