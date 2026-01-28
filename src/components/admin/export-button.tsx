"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, Loader2, FileSpreadsheet, FileText } from "lucide-react";

export type ExportFormat = "csv" | "xlsx";

export interface ExportFilters {
  dateFrom?: string;
  dateTo?: string;
  sessionId?: string;
  paymentStatus?: string;
}

interface ExportButtonProps {
  /** The export endpoint (e.g., "/api/admin/export/bookings") */
  endpoint: string;
  /** Optional filters to apply to the export */
  filters?: ExportFilters;
  /** Label for the button */
  label?: string;
  /** Callback when export starts */
  onExportStart?: () => void;
  /** Callback when export completes */
  onExportComplete?: () => void;
  /** Callback when export fails */
  onExportError?: (error: Error) => void;
}

export function ExportButton({
  endpoint,
  filters = {},
  label = "Export",
  onExportStart,
  onExportComplete,
  onExportError,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setExportingFormat(format);
    setIsOpen(false);
    onExportStart?.();

    try {
      // Build query params
      const params = new URLSearchParams({ format });
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.sessionId) params.append("sessionId", filters.sessionId);
      if (filters.paymentStatus) params.append("paymentStatus", filters.paymentStatus);

      const response = await fetch(`${endpoint}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `export-${new Date().toISOString().split("T")[0]}.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      onExportComplete?.();
    } catch (error) {
      console.error("Export error:", error);
      onExportError?.(error instanceof Error ? error : new Error("Export failed"));
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="adminSecondary"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="w-full sm:w-auto"
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            {label}
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-neutral-200 bg-white shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => handleExport("csv")}
              className="flex w-full items-center px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <FileText className="mr-3 h-4 w-4 text-neutral-400" />
              Export as CSV
            </button>
            <button
              onClick={() => handleExport("xlsx")}
              className="flex w-full items-center px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <FileSpreadsheet className="mr-3 h-4 w-4 text-emerald-600" />
              Export as Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A more advanced export button with date range picker
 */
interface ExportButtonWithFiltersProps extends Omit<ExportButtonProps, "filters"> {
  /** Whether to show date range filter */
  showDateFilter?: boolean;
  /** Initial date from value */
  initialDateFrom?: string;
  /** Initial date to value */
  initialDateTo?: string;
  /** Session ID filter (optional) */
  sessionId?: string;
}

export function ExportButtonWithFilters({
  endpoint,
  label = "Export",
  showDateFilter = true,
  initialDateFrom,
  initialDateTo,
  sessionId,
  onExportStart,
  onExportComplete,
  onExportError,
}: ExportButtonWithFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dateFrom, setDateFrom] = useState(initialDateFrom || "");
  const [dateTo, setDateTo] = useState(initialDateTo || "");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setIsOpen(false);
    onExportStart?.();

    try {
      const params = new URLSearchParams({ format });
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (sessionId) params.append("sessionId", sessionId);

      const response = await fetch(`${endpoint}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `export-${new Date().toISOString().split("T")[0]}.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      onExportComplete?.();
    } catch (error) {
      console.error("Export error:", error);
      onExportError?.(error instanceof Error ? error : new Error("Export failed"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="adminSecondary"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="w-full sm:w-auto"
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            {label}
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-neutral-200 bg-white shadow-lg z-50">
          {showDateFilter && (
            <div className="p-4 border-b border-neutral-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Date Range (Optional)
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-neutral-500">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="py-1">
            <button
              onClick={() => handleExport("csv")}
              className="flex w-full items-center px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <FileText className="mr-3 h-4 w-4 text-neutral-400" />
              Export as CSV
            </button>
            <button
              onClick={() => handleExport("xlsx")}
              className="flex w-full items-center px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <FileSpreadsheet className="mr-3 h-4 w-4 text-emerald-600" />
              Export as Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
