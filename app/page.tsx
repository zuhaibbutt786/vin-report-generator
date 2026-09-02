"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReportMetaList, getStats, deleteReport } from "../lib/storage";
import type { StoredReportMeta } from "../lib/types";

export default function DashboardPage() {
  const [meta, setMeta] = useState<StoredReportMeta[]>([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, mostRecentVin: null as string | null, lastReportDate: null as string | null });

  useEffect(() => {
    setMeta(getReportMetaList());
    setStats(getStats());
  }, []);

  function handleDelete(id: string) {
    if (!confirm("Delete this report permanently?")) return;
    deleteReport(id);
    setMeta(getReportMetaList());
    setStats(getStats());
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">VIN Vehicle Report Generator</h1>
            <p className="text-sm text-slate-500">Decode vehicle information and generate a professional client report.</p>
          </div>
          <nav className="flex gap-3 text-sm">
            <Link href="/settings/" className="text-slate-600 hover:text-blue-600 dark:text-zinc-300">Settings</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Create New Vehicle Report</h2>
          <Link
            href="/report/new/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
          >
            Enter VIN →
          </Link>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Reports" value={String(stats.total)} />
          <StatCard label="This Month" value={String(stats.thisMonth)} />
          <StatCard label="Most Recent VIN" value={stats.mostRecentVin || "—"} mono />
          <StatCard
            label="Last Report"
            value={stats.lastReportDate ? new Date(stats.lastReportDate).toLocaleDateString() : "—"}
          />
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Recent Reports</h2>
          {meta.length === 0 ? (
            <p className="text-slate-500 text-sm">No reports yet. Create your first report above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-zinc-800">
                    <th className="pb-2 pr-4 font-medium">Report #</th>
                    <th className="pb-2 pr-4 font-medium">Vehicle</th>
                    <th className="pb-2 pr-4 font-medium">VIN</th>
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meta.map((m) => (
                    <tr key={m.id} className="border-b border-slate-50 dark:border-zinc-800/50">
                      <td className="py-3 pr-4 font-mono text-xs">{m.id}</td>
                      <td className="py-3 pr-4 font-medium">{m.vehicleLabel}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{m.vin}</td>
                      <td className="py-3 pr-4 text-slate-500">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 flex gap-2">
                        <Link
                          href={`/report/${m.id}/`}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          Open
                        </Link>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-semibold text-slate-900 dark:text-white truncate ${mono ? "font-mono text-sm" : ""}`}>
        {value}
      </p>
    </div>
  );
}
