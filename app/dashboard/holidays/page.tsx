'use client';

import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, Edit3, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { Holiday } from '@/lib/types/hr';

export default function HolidaysPage() {
  const { data, addHoliday, updateHoliday, deleteHoliday, importHolidays } =
    useHRStore();

  const [name, setName] = useState('');
  const [date, setDate] = useState('2026-12-24');
  const [recurring, setRecurring] = useState(true);
  const [location, setLocation] = useState('All');
  const [description, setDescription] = useState('');

  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [importText, setImportText] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) {
      toast.error('Please enter holiday name and date.');
      return;
    }
    addHoliday({
      name: name.trim(),
      date,
      recurring,
      applicableLocation: location,
      description: description.trim() || 'Configured demonstration holiday',
    });
    toast.success(`Added holiday ${name} (${date}) — affects working-day leave calculations.`);
    setName('');
    setDescription('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHoliday) return;
    updateHoliday(editingHoliday.id, editingHoliday);
    toast.success(`Updated holiday ${editingHoliday.name}`);
    setEditingHoliday(null);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) {
        toast.error('Import JSON must be an array of holiday objects.');
        return;
      }
      const count = importHolidays(parsed);
      toast.success(`Imported ${count} validated holiday record(s).`);
      setImportText('');
      setImportModalOpen(false);
    } catch {
      toast.error('Invalid JSON format.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Holiday Calendar & Working-Day Exclusions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configurable demonstration holidays automatically excluded from working-day leave deductions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setImportModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-[#304154] text-xs font-medium hover:border-teal-500"
        >
          <Upload className="w-3.5 h-3.5 text-teal-600" />
          <span>Import Holidays (JSON)</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Holiday List & Calendar Overview */}
        <div className="lg:col-span-8 p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Configured 2026 Company Holidays ({data.holidays.length})
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {data.holidays.map((hol) => (
              <div
                key={hol.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {hol.name}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">
                      Location: {hol.applicableLocation}
                    </span>
                    {hol.recurring && (
                      <span className="text-[11px] text-teal-600 dark:text-teal-400">
                        · Recurring Annually
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 pl-5">{hol.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-5 sm:pl-0">
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                    {hol.date}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingHoliday(hol)}
                    className="p-1.5 rounded text-slate-400 hover:text-teal-600"
                    aria-label={`Edit ${hol.name}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteHoliday(hol.id);
                      toast.success(`Removed holiday ${hol.name}`);
                    }}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-600"
                    aria-label={`Delete ${hol.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Holiday Form */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] space-y-4 h-fit">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Add Demonstration Holiday
          </h2>
          <form onSubmit={handleAddHoliday} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Holiday Name *
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Winter Solstice Recharge"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Applicable Location / Hub
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="All">All Locations (Global)</option>
                <option value="San Francisco">San Francisco</option>
                <option value="New York">New York</option>
                <option value="London">London</option>
                <option value="Berlin">Berlin</option>
                <option value="Toronto">Toronto</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="hol-recurring"
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="rounded border-slate-300"
              />
              <label htmlFor="hol-recurring" className="font-medium">
                Recurring every calendar year
              </label>
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes on observance policy..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Holiday</span>
            </button>
          </form>
        </div>
      </div>

      {/* Edit Holiday Modal */}
      {editingHoliday && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Edit Holiday</h3>
              <button type="button" onClick={() => setEditingHoliday(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Name</label>
                <input
                  required
                  value={editingHoliday.name}
                  onChange={(e) =>
                    setEditingHoliday({ ...editingHoliday, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={editingHoliday.date}
                  onChange={(e) =>
                    setEditingHoliday({ ...editingHoliday, date: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingHoliday(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Holidays Modal */}
      {importModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Import Holidays via JSON</h3>
              <button type="button" onClick={() => setImportModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleImportSubmit} className="space-y-3 text-xs">
              <p className="text-slate-500">
                Paste a JSON array of holiday objects with <code>name</code>, <code>date</code> (YYYY-MM-DD), <code>recurring</code>, <code>applicableLocation</code>, and <code>description</code>.
              </p>
              <textarea
                rows={5}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`[{"name":"Year-End Company Appreciation","date":"2026-12-31","recurring":true,"applicableLocation":"All","description":"Year-end holiday"}]`}
                className="w-full font-mono px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold"
                >
                  Validate & Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
