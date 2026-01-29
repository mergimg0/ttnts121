"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminInput } from "@/components/admin/ui/admin-input";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { Button } from "@/components/ui/button";
import { Save, Copy, Loader2 } from "lucide-react";
import {
  IncomeBreakdown,
  ExpenseBreakdown,
  DailyFinancial,
  calculateIncomeTotal,
  calculateExpenseTotal,
  calculateGrossProfit,
  formatFinancialAmount,
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
} from "@/types/financials";

interface DailyEntryFormProps {
  date: string;
  existingData?: DailyFinancial | null;
  onSave: (data: {
    income: Omit<IncomeBreakdown, "total">;
    expenses: Omit<ExpenseBreakdown, "total">;
    notes?: string;
  }) => Promise<void>;
  onCopyFromPrevious?: () => Promise<DailyFinancial | null>;
  loading?: boolean;
}

// Convert pence to pounds for display
function penceToPounds(pence: number): string {
  return (pence / 100).toFixed(2);
}

// Convert pounds string to pence
function poundsToPence(pounds: string): number {
  const value = parseFloat(pounds);
  if (isNaN(value)) return 0;
  return Math.round(value * 100);
}

export function DailyEntryForm({
  date,
  existingData,
  onSave,
  onCopyFromPrevious,
  loading = false,
}: DailyEntryFormProps) {
  // Income state (stored in pence internally)
  const [income, setIncome] = useState<Omit<IncomeBreakdown, "total">>({
    asc: 0,
    gds: 0,
    oneToOne: 0,
    other: 0,
  });

  // Expenses state (stored in pence internally)
  const [expenses, setExpenses] = useState<Omit<ExpenseBreakdown, "total">>({
    asc: 0,
    gds: 0,
    oneToOne: 0,
    coachWages: 0,
    equipment: 0,
    venue: 0,
    marketing: 0,
    admin: 0,
    other: 0,
  });

  const [notes, setNotes] = useState("");
  const [copying, setCopying] = useState(false);

  // Load existing data
  useEffect(() => {
    if (existingData) {
      setIncome({
        asc: existingData.income.asc || 0,
        gds: existingData.income.gds || 0,
        oneToOne: existingData.income.oneToOne || 0,
        other: existingData.income.other || 0,
      });
      setExpenses({
        asc: existingData.expenses.asc || 0,
        gds: existingData.expenses.gds || 0,
        oneToOne: existingData.expenses.oneToOne || 0,
        coachWages: existingData.expenses.coachWages || 0,
        equipment: existingData.expenses.equipment || 0,
        venue: existingData.expenses.venue || 0,
        marketing: existingData.expenses.marketing || 0,
        admin: existingData.expenses.admin || 0,
        other: existingData.expenses.other || 0,
      });
      setNotes(existingData.notes || "");
    }
  }, [existingData]);

  // Calculate totals
  const incomeTotal = calculateIncomeTotal(income);
  const expenseTotal = calculateExpenseTotal(expenses);
  const grossProfit = calculateGrossProfit(incomeTotal, expenseTotal);

  // Handle income field change
  const handleIncomeChange = useCallback(
    (field: keyof Omit<IncomeBreakdown, "total">, value: string) => {
      setIncome((prev) => ({
        ...prev,
        [field]: poundsToPence(value),
      }));
    },
    []
  );

  // Handle expense field change
  const handleExpenseChange = useCallback(
    (field: keyof Omit<ExpenseBreakdown, "total">, value: string) => {
      setExpenses((prev) => ({
        ...prev,
        [field]: poundsToPence(value),
      }));
    },
    []
  );

  // Handle copy from previous
  const handleCopyFromPrevious = async () => {
    if (!onCopyFromPrevious) return;
    setCopying(true);
    try {
      const previousData = await onCopyFromPrevious();
      if (previousData) {
        setIncome({
          asc: previousData.income.asc || 0,
          gds: previousData.income.gds || 0,
          oneToOne: previousData.income.oneToOne || 0,
          other: previousData.income.other || 0,
        });
        setExpenses({
          asc: previousData.expenses.asc || 0,
          gds: previousData.expenses.gds || 0,
          oneToOne: previousData.expenses.oneToOne || 0,
          coachWages: previousData.expenses.coachWages || 0,
          equipment: previousData.expenses.equipment || 0,
          venue: previousData.expenses.venue || 0,
          marketing: previousData.expenses.marketing || 0,
          admin: previousData.expenses.admin || 0,
          other: previousData.expenses.other || 0,
        });
        setNotes(previousData.notes || "");
      }
    } finally {
      setCopying(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    await onSave({ income, expenses, notes: notes || undefined });
  };

  return (
    <div className="space-y-6">
      {/* Date Display */}
      <div className="text-center py-3 bg-neutral-50 rounded-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
          Entry Date
        </p>
        <p className="text-lg font-semibold text-neutral-900">
          {new Date(date).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income Section */}
        <AdminCard hover={false}>
          <h3 className="text-[15px] font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50">
              <span className="text-emerald-600 text-xs font-bold">+</span>
            </span>
            Income
          </h3>
          <div className="space-y-4">
            {(
              Object.keys(INCOME_CATEGORY_LABELS) as Array<
                keyof Omit<IncomeBreakdown, "total">
              >
            ).map((key) => (
              <AdminInput
                key={key}
                label={INCOME_CATEGORY_LABELS[key]}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={income[key] ? penceToPounds(income[key] || 0) : ""}
                onChange={(e) => handleIncomeChange(key, e.target.value)}
                leftIcon={<span className="text-sm font-medium">£</span>}
              />
            ))}
            <div className="pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-600">
                  Total Income
                </span>
                <span className="text-lg font-semibold text-emerald-600">
                  {formatFinancialAmount(incomeTotal)}
                </span>
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Expenses Section */}
        <AdminCard hover={false}>
          <h3 className="text-[15px] font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-50">
              <span className="text-red-600 text-xs font-bold">-</span>
            </span>
            Expenses
          </h3>
          <div className="space-y-4">
            {(
              Object.keys(EXPENSE_CATEGORY_LABELS) as Array<
                keyof Omit<ExpenseBreakdown, "total">
              >
            ).map((key) => (
              <AdminInput
                key={key}
                label={EXPENSE_CATEGORY_LABELS[key]}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={expenses[key] ? penceToPounds(expenses[key] || 0) : ""}
                onChange={(e) => handleExpenseChange(key, e.target.value)}
                leftIcon={<span className="text-sm font-medium">£</span>}
              />
            ))}
            <div className="pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-600">
                  Total Expenses
                </span>
                <span className="text-lg font-semibold text-red-600">
                  {formatFinancialAmount(expenseTotal)}
                </span>
              </div>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Summary Section */}
      <AdminCard hover={false} className="bg-gradient-to-br from-neutral-50 to-white">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="text-center p-4 rounded-xl bg-white border border-neutral-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              Total Income
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatFinancialAmount(incomeTotal)}
            </p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white border border-neutral-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              Total Expenses
            </p>
            <p className="text-2xl font-bold text-red-600">
              {formatFinancialAmount(expenseTotal)}
            </p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white border border-neutral-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              Gross Profit
            </p>
            <p
              className={`text-2xl font-bold ${
                grossProfit >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {formatFinancialAmount(grossProfit)}
            </p>
          </div>
        </div>
      </AdminCard>

      {/* Notes */}
      <AdminCard hover={false}>
        <h3 className="text-[15px] font-semibold text-neutral-900 mb-4">
          Notes
        </h3>
        <textarea
          className="flex min-h-[100px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 resize-none focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-500/20"
          placeholder="Add any notes for this day..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </AdminCard>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        {onCopyFromPrevious && (
          <Button
            variant="outline"
            onClick={handleCopyFromPrevious}
            disabled={copying || loading}
            className="w-full sm:w-auto"
          >
            {copying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Copy from Previous Day
          </Button>
        )}
        <Button
          variant="adminPrimary"
          onClick={handleSave}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {existingData ? "Update Entry" : "Save Entry"}
        </Button>
      </div>
    </div>
  );
}
