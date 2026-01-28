"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminInput } from "@/components/admin/ui/admin-input";
import { toast } from "@/components/ui/toast";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { Contact, ConsentLog } from "@/types/contact";
import { LOCATIONS } from "@/lib/constants";

interface ContactWithLogs extends Contact {
  consentLogs: ConsentLog[];
}

export default function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactWithLogs | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    marketingConsent: false,
  });

  useEffect(() => {
    fetchContact();
  }, [id]);

  const fetchContact = async () => {
    try {
      const response = await fetch(`/api/admin/contacts/${id}`);
      const data = await response.json();
      if (data.success) {
        setContact(data.data);
        setFormData({
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          email: data.data.email,
          phone: data.data.phone || "",
          location: data.data.location || "",
          marketingConsent: data.data.marketingConsent,
        });
      }
    } catch (error) {
      console.error("Error fetching contact:", error);
      toast("Failed to load contact", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast("Contact updated successfully", "success");
        // Refresh to get updated consent logs if consent changed
        fetchContact();
      } else {
        setError(data.error || "Failed to update contact");
        toast(data.error || "Failed to update contact", "error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/contacts/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast("Contact deleted", "success");
        router.push("/admin/contacts");
      } else {
        toast(data.error || "Failed to delete contact", "error");
      }
    } catch (err) {
      toast("Failed to delete contact", "error");
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "—";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!contact) {
    return (
      <AdminCard hover={false}>
        <div className="text-center py-12">
          <div className="mx-auto h-14 w-14 rounded-full bg-neutral-50 flex items-center justify-center">
            <User className="h-7 w-7 text-neutral-400" />
          </div>
          <h3 className="mt-4 text-sm font-medium text-neutral-900">Contact not found</h3>
          <p className="mt-1 text-sm text-neutral-500">
            The contact you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Button variant="adminSecondary" className="mt-4" asChild>
            <Link href="/admin/contacts">Back to Contacts</Link>
          </Button>
        </div>
      </AdminCard>
    );
  }

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
            Edit Contact
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {formData.firstName} {formData.lastName}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2">
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
                {formData.marketingConsent !== contact.marketingConsent && (
                  <p className="mt-2 text-xs text-amber-600">
                    Consent status will be changed and logged
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-neutral-100">
                <Button type="submit" variant="adminPrimary" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button type="button" variant="adminSecondary" asChild>
                  <Link href="/admin/contacts">Discard Changes</Link>
                </Button>

                <div className="ml-auto">
                  <ConfirmDialog
                    trigger={
                      <Button type="button" variant="adminDanger">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Contact
                      </Button>
                    }
                    title="Delete Contact?"
                    description="This will permanently delete this contact and their consent history. This action cannot be undone."
                    confirmText="Delete Contact"
                    cancelText="Keep Contact"
                    variant="danger"
                    onConfirm={handleDelete}
                  />
                </div>
              </div>
            </div>
          </AdminCard>
        </form>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <AdminCard hover={false}>
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Contact Info
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Source
                </p>
                <p className="mt-1">
                  <AdminBadge variant="neutral">{contact.source}</AdminBadge>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Added
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {formatDate(contact.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Last Updated
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {formatDate(contact.updatedAt)}
                </p>
              </div>
            </div>
          </AdminCard>

          {/* Consent Status */}
          <AdminCard hover={false}>
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Marketing Consent
            </h2>
            <div className="flex items-center gap-2 mb-4">
              {contact.marketingConsent ? (
                <>
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700">Opted In</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-600">Opted Out</span>
                </>
              )}
            </div>
            {contact.consentTimestamp && (
              <p className="text-xs text-neutral-500">
                Last changed: {formatDate(contact.consentTimestamp)}
              </p>
            )}
          </AdminCard>

          {/* Consent History */}
          <AdminCard hover={false}>
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Consent History
            </h2>
            {contact.consentLogs && contact.consentLogs.length > 0 ? (
              <div className="space-y-3">
                {contact.consentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <div className="mt-0.5">
                      {log.action === "granted" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-neutral-700">
                        {log.action === "granted" ? "Opted in" : "Opted out"}
                        <span className="text-neutral-400"> via {log.method}</span>
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No consent changes recorded</p>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
