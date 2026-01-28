import * as XLSX from "xlsx";
import Papa from "papaparse";

/**
 * Export data to CSV format
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @returns Blob containing CSV data
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string
): Blob {
  const csv = Papa.unparse(data);
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}

/**
 * Export data to Excel format
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param sheetName Name of the worksheet (default: 'Sheet1')
 * @returns Blob containing Excel data
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName = "Sheet1"
): Blob {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Trigger browser download of a blob
 * @param blob The blob to download
 * @param filename Full filename including extension
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export and download data in specified format
 * @param data Array of objects to export
 * @param filename Base filename (without extension)
 * @param format 'csv' or 'xlsx'
 * @param sheetName Optional sheet name for Excel files
 */
export function exportAndDownload<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  format: "csv" | "xlsx",
  sheetName = "Sheet1"
): void {
  const blob =
    format === "csv"
      ? exportToCSV(data, filename)
      : exportToExcel(data, filename, sheetName);
  const extension = format === "csv" ? "csv" : "xlsx";
  downloadBlob(blob, `${filename}.${extension}`);
}

/**
 * Format booking data for export
 */
export interface BookingExportData {
  "Booking Ref": string;
  "Child First Name": string;
  "Child Last Name": string;
  "Age Group": string;
  "Parent First Name": string;
  "Parent Last Name": string;
  "Parent Email": string;
  "Parent Phone": string;
  "Session ID": string;
  "Payment Status": string;
  "Amount": string;
  "Booking Date": string;
  "Photo Consent": string;
  "Marketing Consent": string;
}

/**
 * Format attendance data for export
 */
export interface AttendanceExportData {
  "Session Name": string;
  "Session Date": string;
  "Child Name": string;
  "Parent Name": string;
  "Contact Phone": string;
  "Contact Email": string;
  "Medical Conditions": string;
  "Emergency Contact": string;
  "Emergency Phone": string;
  "Checked In": string;
}
