"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { toast } from "@/components/ui/toast";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { ArrowLeft, Loader2, Users, Eye } from "lucide-react";
import { LOCATIONS } from "@/lib/constants";
import { Contact } from "@/types/contact";

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    targetType: "all" as "all" | "location" | "custom",
    targetLocations: [] as string[],
    targetContactIds: [] as string[],
    createdBy: "",
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/admin/contacts?marketingConsent=true");
      const data = await response.json();
      if (data.success) {
        setContacts(data.data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const getRecipientCount = () => {
    if (formData.targetType === "all") {
      return contacts.length;
    } else if (formData.targetType === "location") {
      return contacts.filter((c) =>
        formData.targetLocations.includes(c.location || "")
      ).length;
    } else {
      return formData.targetContactIds.length;
    }
  };

  const handleLocationToggle = (location: string) => {
    const current = formData.targetLocations;
    if (current.includes(location)) {
      setFormData({
        ...formData,
        targetLocations: current.filter((l) => l !== location),
      });
    } else {
      setFormData({
        ...formData,
        targetLocations: [...current, location],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (getRecipientCount() === 0) {
      setError("No recipients selected");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast("Campaign created successfully", "success");
        router.push(`/admin/campaigns/${data.data.id}`);
      } else {
        setError(data.error || "Failed to create campaign");
        toast(data.error || "Failed to create campaign", "error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const recipientCount = getRecipientCount();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/campaigns"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            New Campaign
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Create an email campaign to send to your contacts
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Campaign Details */}
          <AdminCard hover={false}>
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Campaign Details
            </h2>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <AdminInput
                label="Campaign Name *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., Spring 2024 Newsletter"
                hint="Internal name, not shown to recipients"
              />

              <AdminInput
                label="Email Subject *"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                required
                placeholder="e.g., Exciting new sessions coming soon!"
              />

              <AdminTextarea
                label="Email Body *"
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                required
                rows={10}
                placeholder="Write your email content here. HTML is supported."
                hint="You can use HTML for formatting"
              />
            </div>
          </AdminCard>

          {/* Recipients */}
          <AdminCard hover={false}>
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Recipients
            </h2>

            <div className="space-y-4">
              <AdminSelect
                label="Target Audience"
                value={formData.targetType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetType: e.target.value as "all" | "location" | "custom",
                  })
                }
              >
                <option value="all">All consented contacts</option>
                <option value="location">By location</option>
                <option value="custom">Custom selection</option>
              </AdminSelect>

              {formData.targetType === "location" && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                    Select Locations
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LOCATIONS.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleLocationToggle(loc.name)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          formData.targetLocations.includes(loc.name)
                            ? "bg-sky-100 text-sky-700 border border-sky-200"
                            : "bg-neutral-100 text-neutral-600 border border-transparent hover:bg-neutral-200"
                        }`}
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formData.targetType === "custom" && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                    Select Contacts
                  </label>
                  {loadingContacts ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-xl p-2 space-y-1">
                      {contacts.map((contact) => (
                        <label
                          key={contact.id}
                          className="flex items-center gap-2 p-2 hover:bg-neutral-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.targetContactIds.includes(contact.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  targetContactIds: [
                                    ...formData.targetContactIds,
                                    contact.id,
                                  ],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  targetContactIds: formData.targetContactIds.filter(
                                    (id) => id !== contact.id
                                  ),
                                });
                              }
                            }}
                            className="h-4 w-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                          />
                          <span className="text-sm">
                            {contact.firstName} {contact.lastName}
                          </span>
                          <span className="text-xs text-neutral-500">
                            ({contact.email})
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </AdminCard>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" variant="adminPrimary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Save as Draft"
              )}
            </Button>
            <Button type="button" variant="adminSecondary" asChild>
              <Link href="/admin/campaigns">Discard</Link>
            </Button>
          </div>
        </form>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recipient Preview */}
          <AdminCard hover={false}>
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Preview
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
                <Users className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {recipientCount}
                </p>
                <p className="text-xs text-neutral-500">Recipients</p>
              </div>
            </div>
            {recipientCount === 0 && (
              <p className="text-sm text-amber-600">
                No contacts match your targeting criteria
              </p>
            )}
          </AdminCard>

          {/* Email Preview */}
          {formData.subject && formData.body && (
            <AdminCard hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-neutral-900">
                  Email Preview
                </h2>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-sky-600 hover:text-sky-700 transition-colors"
                >
                  <Eye className="h-4 w-4 inline mr-1" />
                  {showPreview ? "Hide" : "Show"}
                </button>
              </div>
              {showPreview && (
                <div className="border border-neutral-200 rounded-xl p-4 bg-white">
                  <p className="font-medium text-sm text-neutral-900 mb-2">
                    Subject: {formData.subject}
                  </p>
                  <hr className="my-2" />
                  <div
                    className="text-sm text-neutral-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.body }}
                  />
                </div>
              )}
            </AdminCard>
          )}
        </div>
      </div>
    </div>
  );
}
