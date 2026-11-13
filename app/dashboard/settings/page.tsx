'use client';

import React, { useState } from 'react';
import {
  Save,
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { createBackupPayload } from '@/lib/storage/localStorage';
import { downloadTextFile } from '@/lib/export/exporters';

export default function SettingsPage() {
  const {
    data,
    settings,
    ui,
    updateSettings,
    setTheme,
    toggleSidebar,
    restoreFromBackup,
    resetDemoData,
  } = useHRStore();

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [logoText, setLogoText] = useState(settings.logoText);
  const [companyDesc, setCompanyDesc] = useState(settings.companyDescription);
  const [currency, setCurrency] = useState(settings.defaultCurrency);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [startTime, setStartTime] = useState(settings.defaultStartTime);
  const [endTime, setEndTime] = useState(settings.defaultEndTime);
  const [lateMinutes, setLateMinutes] = useState(settings.lateArrivalThresholdMinutes);
  const [standardDays, setStandardDays] = useState(settings.standardMonthlyWorkingDays);
  const [workingDays, setWorkingDays] = useState<number[]>(settings.workingDays);

  const [restoreJsonText, setRestoreJsonText] = useState('');

  const toggleDay = (dayNum: number) => {
    setWorkingDays((prev) =>
      prev.includes(dayNum)
        ? prev.filter((d) => d !== dayNum)
        : [...prev, dayNum].sort()
    );
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      companyName,
      logoText,
      companyDescription: companyDesc,
      defaultCurrency: currency,
      currencySymbol,
      defaultStartTime: startTime,
      defaultEndTime: endTime,
      lateArrivalThresholdMinutes: Number(lateMinutes),
      standardMonthlyWorkingDays: Number(standardDays),
      workingDays,
    });
    toast.success(
      'Workspace settings saved and propagated to attendance, leave, and payroll engines.'
    );
  };

  const handleDownloadBackup = () => {
    const payload = createBackupPayload(data, settings, ui);
    downloadTextFile(
      JSON.stringify(payload, null, 2),
      `peoplix-hr-backup-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
    toast.success('Downloaded complete JSON workspace backup.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      const res = restoreFromBackup(content);
      if (!res.success) {
        toast.error(res.error || 'Invalid backup file');
      } else {
        toast.success('Restored workspace state from JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handlePasteRestore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreJsonText.trim()) return;
    const res = restoreFromBackup(restoreJsonText);
    if (!res.success) {
      toast.error(res.error || 'Invalid backup JSON');
      return;
    }
    setRestoreJsonText('');
    toast.success('Restored workspace state from pasted JSON.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Workspace Settings, Policies & LocalStorage Backup
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure company identity, working days, attendance thresholds, payroll rules, and JSON backup/restore.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Main Settings Form */}
        <form
          onSubmit={handleSaveSettings}
          className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-5 text-xs"
        >
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Organization Identity & Schedule Policy
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Company Name
              </label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Sidebar Brand Wordmark
              </label>
              <input
                required
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
              Workspace Description
            </label>
            <textarea
              rows={2}
              value={companyDesc}
              onChange={(e) => setCompanyDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Default Currency Code
              </label>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Currency Symbol
              </label>
              <input
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Working Days */}
          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-2">
              Configured Working Days (Used by Leave & Attendance Engines)
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Sun', val: 0 },
                { label: 'Mon', val: 1 },
                { label: 'Tue', val: 2 },
                { label: 'Wed', val: 3 },
                { label: 'Thu', val: 4 },
                { label: 'Fri', val: 5 },
                { label: 'Sat', val: 6 },
              ].map((d) => {
                const active = workingDays.includes(d.val);
                return (
                  <button
                    key={d.val}
                    type="button"
                    onClick={() => toggleDay(d.val)}
                    className={`px-3 py-1.5 rounded-lg font-medium border ${
                      active
                        ? 'bg-[#0D9488] text-white border-[#0D9488]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule & Thresholds */}
          <div className="grid sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Shift Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Shift End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Late Threshold (m)
              </label>
              <input
                type="number"
                value={lateMinutes}
                onChange={(e) => setLateMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Payroll Days/Mo
              </label>
              <input
                type="number"
                value={standardDays}
                onChange={(e) => setStandardDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold"
          >
            <Save className="w-4 h-4" />
            <span>Save & Propagate Settings</span>
          </button>
        </form>

        {/* Right Column: Theme, JSON Backup, Restore & Demo Reset */}
        <div className="lg:col-span-5 space-y-6 text-xs">
          {/* Appearance & Interface */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Theme & Interface Preferences
            </h2>
            <div className="flex items-center justify-between">
              <span>Color Mode</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                    ui.theme === 'light'
                      ? 'bg-[#E8F7F4] border-teal-500 text-teal-800 font-semibold'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                    ui.theme === 'dark'
                      ? 'bg-teal-950 border-teal-500 text-teal-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Dark
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Desktop Sidebar Layout</span>
              <button
                type="button"
                onClick={toggleSidebar}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium"
              >
                {ui.sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              </button>
            </div>
          </div>

          {/* LocalStorage Backup & Restore */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              JSON Data Backup, Restore & Demo Reset
            </h2>
            <p className="text-slate-500">
              Export your complete LocalStorage state (`peoplix:hr-data`, `peoplix:settings`, `peoplix:ui`) to a portable JSON file or restore from a backup.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON Backup</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-teal-500 font-medium">
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                <span>Upload Backup File</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <form onSubmit={handlePasteRestore} className="space-y-2 pt-2">
              <label className="block font-medium text-slate-600 dark:text-slate-300">
                Or Paste Backup JSON Directly
              </label>
              <textarea
                rows={3}
                value={restoreJsonText}
                onChange={(e) => setRestoreJsonText(e.target.value)}
                placeholder='{"schemaVersion":1,"application":"PEOPLIX HR","hrData":{...}}'
                className="w-full font-mono px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white font-medium"
              >
                Validate & Restore JSON
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-slate-500">
                Reset all records back to the 120-employee deterministic seed
              </span>
              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  toast.success('Reset workspace to clean deterministic demo dataset.');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
