/**
 * Converts an array of flat record objects into an RFC-4180 compliant CSV string.
 */
export function convertRecordsToCSV(records: Record<string, string | number | boolean | null | undefined>[]): string {
  if (!records || records.length === 0) {
    return '';
  }
  const headers = Object.keys(records[0]);
  const escapeCell = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [
    headers.map(escapeCell).join(','),
    ...records.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
  ];

  return rows.join('\n');
}

/**
 * Triggers a client-side file download for CSV or JSON content.
 */
export function downloadTextFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;'): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
