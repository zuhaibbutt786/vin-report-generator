"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateVin, cleanVin } from "../../../lib/vin/validate";
import { buildReportFromVin } from "../../../lib/providers";
import { saveReport } from "../../../lib/storage";

export default function NewReportPage() {
  const router = useRouter();
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleDecode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = validateVin(vin);
    if (!result.valid) {
      setError(result.error || "Invalid VIN");
      return;
    }

    setLoading(true);
    setStatus("Decoding VIN…");
    try {
      setStatus("Retrieving vehicle information…");
      const { report, errors } = await buildReportFromVin(result.cleaned);
      setStatus("Preparing report…");
      saveReport(report);
      router.push(`/report/${report.id}/`);
    } catch {
      setError("Failed to generate report. Please check your connection and try again.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-500 hover:text-blue-600">
            ← Dashboard
          </Link>
          <h1 className="font-semibold text-slate-900 dark:text-white">New Report</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
            Enter Vehicle Identification Number
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            We will decode the VIN using free public NHTSA data and prepare a professional report.
          </p>

          <form onSubmit={handleDecode} className="space-y-4">
            <div>
              <label htmlFor="vin" className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                VIN
              </label>
              <input
                id="vin"
                type="text"
                value={vin}
                onChange={(e) => setVin(cleanVin(e.target.value).slice(0, 17))}
                placeholder="1HGCM82633A004352"
                maxLength={17}
                disabled={loading}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white font-mono text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
                spellCheck={false}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                {vin.length}/17 · Letters I, O, Q are not used in VINs
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || vin.length !== 17}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium transition"
              >
                {loading ? status || "Working…" : "Decode VIN"}
              </button>
              <button
                type="button"
                onClick={() => setVin("")}
                disabled={loading}
                className="px-4 py-3 rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-300"
              >
                Clear
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800">
            <p className="text-xs text-slate-400 mb-2">Sample VINs for testing:</p>
            <div className="flex flex-wrap gap-2">
              {["1HGCM82633A004352", "5YJSA1E14HF000001", "1FTFW1ET5DFC10312"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setVin(s)}
                  className="font-mono text-xs text-blue-600 hover:underline"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-8 flex flex-col items-center text-slate-500">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
            <p className="text-sm">{status}</p>
          </div>
        )}
      </main>
    </div>
  );
}
