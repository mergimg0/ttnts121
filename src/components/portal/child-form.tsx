"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { ChildFormData } from "@/types/user";
import { UserChild } from "@/types/user";
import { Timestamp } from "firebase/firestore";

interface ChildFormProps {
  child?: UserChild;
  onSubmit: (data: ChildFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

function formatDateForInput(date: Date | Timestamp | undefined): string {
  if (!date) return "";
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return d.toISOString().split("T")[0];
}

export function ChildForm({
  child,
  onSubmit,
  onCancel,
  isLoading = false,
}: ChildFormProps) {
  const [formData, setFormData] = useState<ChildFormData>({
    firstName: child?.firstName || "",
    lastName: child?.lastName || "",
    dob: formatDateForInput(child?.dob),
    medicalConditions: child?.medicalConditions || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      if (dobDate > today) {
        newErrors.dob = "Date of birth cannot be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(formData);
  };

  return (
    <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">
          {child ? "Edit Child" : "Add Child"}
        </h3>
        <button
          onClick={onCancel}
          className="p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              placeholder="Enter first name"
              disabled={isLoading}
              error={errors.firstName}
            />
          </div>
          <div>
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Enter last name"
              disabled={isLoading}
              error={errors.lastName}
            />
          </div>
        </div>

        <div>
          <Input
            label="Date of Birth"
            type="date"
            value={formData.dob}
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            disabled={isLoading}
            error={errors.dob}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Medical Conditions (Optional)
          </label>
          <textarea
            value={formData.medicalConditions || ""}
            onChange={(e) =>
              setFormData({ ...formData, medicalConditions: e.target.value })
            }
            placeholder="List any allergies, conditions, or special requirements"
            disabled={isLoading}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="adminPrimary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : child ? (
              "Save Changes"
            ) : (
              "Add Child"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
