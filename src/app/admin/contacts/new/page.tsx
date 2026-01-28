"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminInput } from "@/components/admin/ui/admin-input";
import { toast } from "@/components/ui/toast";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { LOCATIONS } from "@/lib/constants";

export default function NewContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
    marketingConsent: false,
    source: "manual" as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast("Contact created successfully", "success");
        router.push("/admin/contacts");
      } else {
        setError(data.error || "Failed to create contact");
        toast(data.error || "Failed to create contact", "error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/contacts"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Add Contact
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Add a new contact to your mailing list
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <AdminCard hover={false}>
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <AdminInput
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder="email@example.com"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <AdminInput
                label="First Name *"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />

              <AdminInput
                label="Last Name *"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <AdminInput
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Optional"
              />

              <AdminSelect
                label="Location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              >
                <option value="">Select location...</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </AdminSelect>
            </div>

            <div className="pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="marketingConsent"
                  checked={formData.marketingConsent}
                  onChange={(e) =>
                    setFormData({ ...formData, marketingConsent: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="marketingConsent" className="text-[13px] text-neutral-600">
                  Contact has consented to receive marketing emails
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-neutral-100">
              <Button type="submit" variant="adminPrimary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Contact"
                )}
              </Button>
              <Button type="button" variant="adminSecondary" asChild>
                <Link href="/admin/contacts">Discard</Link>
              </Button>
            </div>
          </div>
        </AdminCard>
      </form>
    </div>
  );
}
