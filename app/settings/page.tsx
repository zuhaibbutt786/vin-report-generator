"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSettings, saveSettings } from "../../lib/storage";
import type { BrandingSettings } from "../../lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  function update(key: keyof BrandingSettings, value: string) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  function handleSave() {
    if (!settings) return;
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-500 hover:text-blue-600">
            ← Dashboard
          </Link>
          <h1 className="font-semibold text-slate-900 dark:text-white">Settings</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Branding</h2>
          <p className="text-sm text-slate-500">
            These details appear on generated PDF reports. Saved locally in your browser.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Your Name" value={settings.name} onChange={(v) => update("name", v)} />
            <Field label="Company" value={settings.company} onChange={(v) => update("company", v)} />
            <Field label="Phone" value={settings.phone} onChange={(v) => update("phone", v)} />
            <Field label="WhatsApp" value={settings.whatsapp} onChange={(v) => update("whatsapp", v)} />
            <Field label="Email" value={settings.email} onChange={(v) => update("email", v)} />
            <Field label="Website" value={settings.website} onChange={(v) => update("website", v)} />
          </div>
          <Field label="Address" value={settings.address} onChange={(v) => update("address", v)} />
          <Field
            label="Default Report Title"
            value={settings.defaultReportTitle}
            onChange={(v) => update("defaultReportTitle", v)}
          />
          <Field
            label="Report Footer"
            value={settings.reportFooter}
            onChange={(v) => update("reportFooter", v)}
          />
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Disclaimer</label>
            <textarea
              value={settings.disclaimer}
              onChange={(e) => update("disclaimer", e.target.value)}
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {saved ? "Saved ✓" : "Save Settings"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
      />
    </div>
  );
}
