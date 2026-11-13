import { HRDataset, UIPreferences, WorkspaceSettings } from '@/lib/types/hr';
import {
  createDefaultSettings,
  createDefaultUIPreferences,
  generateDeterministicSeedData,
  STORAGE_SCHEMA_VERSION,
} from '@/lib/seed/seedData';

export const STORAGE_KEYS = {
  VERSION: 'peoplix:version',
  HR_DATA: 'peoplix:hr-data',
  SETTINGS: 'peoplix:settings',
  UI: 'peoplix:ui',
} as const;

export interface FullWorkspaceBackup {
  schemaVersion: number;
  exportedAt: string;
  application: 'PEOPLIX HR';
  hrData: HRDataset;
  settings: WorkspaceSettings;
  ui: UIPreferences;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Validates that an unknown parsed JSON object conforms to the structural requirements of HRDataset.
 */
export function isValidHRDataset(data: unknown): data is HRDataset {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  return (
    Array.isArray(candidate.employees) &&
    candidate.employees.length > 0 &&
    Array.isArray(candidate.departments) &&
    Array.isArray(candidate.attendance) &&
    Array.isArray(candidate.leaveRequests) &&
    Array.isArray(candidate.leaveBalances) &&
    Array.isArray(candidate.payrollRuns) &&
    Array.isArray(candidate.candidates)
  );
}

export function isValidWorkspaceSettings(data: unknown): data is WorkspaceSettings {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.companyName === 'string' &&
    typeof candidate.defaultCurrency === 'string' &&
    Array.isArray(candidate.workingDays)
  );
}

export function isValidUIPreferences(data: unknown): data is UIPreferences {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  return (
    (candidate.theme === 'light' || candidate.theme === 'dark') &&
    typeof candidate.sidebarCollapsed === 'boolean'
  );
}

/**
 * Loads the persisted HR dataset from LocalStorage.
 * Recovers gracefully with deterministic seed data if storage is empty or corrupted.
 * Never overwrites valid saved user changes during initialization.
 */
export function loadPersistedWorkspace(): {
  hrData: HRDataset;
  settings: WorkspaceSettings;
  ui: UIPreferences;
  recoveredFromCorruption: boolean;
} {
  if (!isBrowser()) {
    return {
      hrData: generateDeterministicSeedData(),
      settings: createDefaultSettings(),
      ui: createDefaultUIPreferences(),
      recoveredFromCorruption: false,
    };
  }

  let recoveredFromCorruption = false;
  let hrData: HRDataset | null = null;
  let settings: WorkspaceSettings | null = null;
  let ui: UIPreferences | null = null;

  try {
    const rawData = window.localStorage.getItem(STORAGE_KEYS.HR_DATA);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (isValidHRDataset(parsed)) {
        hrData = parsed;
      } else {
        recoveredFromCorruption = true;
      }
    }
  } catch {
    recoveredFromCorruption = true;
  }

  try {
    const rawSettings = window.localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (isValidWorkspaceSettings(parsed)) {
        settings = parsed;
      } else {
        recoveredFromCorruption = true;
      }
    }
  } catch {
    recoveredFromCorruption = true;
  }

  try {
    const rawUI = window.localStorage.getItem(STORAGE_KEYS.UI);
    if (rawUI) {
      const parsed = JSON.parse(rawUI);
      if (isValidUIPreferences(parsed)) {
        ui = parsed;
      }
    }
  } catch {
    // Recover UI preferences silently
  }

  const finalHRData = hrData ?? generateDeterministicSeedData();
  const finalSettings = settings ?? createDefaultSettings();
  const finalUI = ui ?? createDefaultUIPreferences();

  if (!hrData) {
    saveHRDataset(finalHRData);
  }
  if (!settings) {
    saveWorkspaceSettings(finalSettings);
  }
  if (!ui) {
    saveUIPreferences(finalUI);
  }

  return {
    hrData: finalHRData,
    settings: finalSettings,
    ui: finalUI,
    recoveredFromCorruption,
  };
}

export function saveHRDataset(hrData: HRDataset): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEYS.VERSION, String(STORAGE_SCHEMA_VERSION));
    window.localStorage.setItem(STORAGE_KEYS.HR_DATA, JSON.stringify(hrData));
    return true;
  } catch {
    return false;
  }
}

export function saveWorkspaceSettings(settings: WorkspaceSettings): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function saveUIPreferences(ui: UIPreferences): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEYS.UI, JSON.stringify(ui));
    return true;
  } catch {
    return false;
  }
}

export function createBackupPayload(
  hrData: HRDataset,
  settings: WorkspaceSettings,
  ui: UIPreferences
): FullWorkspaceBackup {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    application: 'PEOPLIX HR',
    hrData,
    settings,
    ui,
  };
}

export function parseAndValidateBackupJson(jsonString: string): {
  valid: boolean;
  error?: string;
  payload?: FullWorkspaceBackup;
} {
  try {
    const parsed = JSON.parse(jsonString) as Partial<FullWorkspaceBackup>;
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Backup file is not a valid JSON object.' };
    }
    if (!isValidHRDataset(parsed.hrData)) {
      return { valid: false, error: 'Backup JSON is missing required HR dataset collections.' };
    }
    if (!isValidWorkspaceSettings(parsed.settings)) {
      return { valid: false, error: 'Backup JSON is missing valid workspace settings.' };
    }
    const ui = isValidUIPreferences(parsed.ui) ? parsed.ui : createDefaultUIPreferences();
    return {
      valid: true,
      payload: {
        schemaVersion: parsed.schemaVersion ?? STORAGE_SCHEMA_VERSION,
        exportedAt: parsed.exportedAt ?? new Date().toISOString(),
        application: 'PEOPLIX HR',
        hrData: parsed.hrData,
        settings: parsed.settings,
        ui,
      },
    };
  } catch {
    return { valid: false, error: 'Malformed JSON syntax. Unable to parse backup file.' };
  }
}
