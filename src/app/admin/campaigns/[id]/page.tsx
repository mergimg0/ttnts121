"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { toast } from "@/components/ui/toast";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import {
  ArrowLeft,
  Loader2,
  Send,
  Trash2,
  Users,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Campaign, Contact } from "@/types/contact";
import { LOCATIONS } from "@/lib/constants";

const statusConfig = {
  draft: { label: "Draft", variant: "neutral" as const, icon: Clock },
  sending: { label: "Sending", variant: "warning" as const, icon: Send },
  sent: { label: "Sent", variant: "success" as const, icon: CheckCircle },
  failed: { label: "Failed", variant: "error" as const, icon: XCircle },
};

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    targetType: "all" as "all" | "location" | "custom",
    targetLocations: [] as string[],
    targetContactIds: [] as string[],
  });

  useEffect(() => {
    fetchCampaign();
    fetchContacts();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/admin/campaigns/${id}`);
      const data = await response.json();
      if (data.success) {
        setCampaign(data.data);
        setFormData({
          name: data.data.name,
          subject: data.data.subject,
          body: data.data.body,
          targetType: data.data.targetType,
          targetLocations: data.data.targetLocations || [],
          targetContactIds: data.data.targetContactIds || [],
        });
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast("Failed to load campaign", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/admin/contacts?marketingConsent=true");
      const data = await response.json();
      if (data.success) {
        setContacts(data.data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
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
    if (campaign?.status !== "draft") return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast("Campaign updated successfully", "success");
        setCampaign(data.data);
      } else {
        setError(data.error || "Failed to update campaign");
        toast(data.error || "Failed to update campaign", "error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${id}/send`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast(data.message || "Campaign sent successfully!", "success");
        fetchCampaign(); // Refresh to get updated status
      } else {
        toast(data.error || "Failed to send campaign", "error");
      }
    } catch (err) {
      toast("Failed to send campaign", "error");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/campaigns/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast("Campaign deleted", "success");
        router.push("/admin/campaigns");
      } else {
        toast(data.error || "Failed to delete campaign", "error");
      }
    } catch (err) {
      toast("Failed to delete campaign", "error");
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

  if (!campaign) {
    return (
      <AdminCard hover={false}>
        <div className="text-center py-12">
          <div className="mx-auto h-14 w-14 rounded-full bg-neutral-50 flex items-center justify-center">
            <XCircle className="h-7 w-7 text-neutral-400" />
          </div>
          <h3 className="mt-4 text-sm font-medium text-neutral-900">Campaign not found</h3>
          <p className="mt-1 text-sm text-neutral-500">
            The campaign you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Button variant="adminSecondary" className="mt-4" asChild>
            <Link href="/admin/campaigns">Back to Campaigns</Link>
          </Button>
        </div>
      </AdminCard>
    );
  }

  const isDraft = campaign.status === "draft";
  const config = statusConfig[campaign.status];
  const StatusIcon = config.icon;
  const recipientCount = getRecipientCount();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/campaigns"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                {isDraft ? "Edit Campaign" : "Campaign Details"}
              </h1>
              <AdminBadge variant={config.variant}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </AdminBadge>
            </div>
            <p className="text-neutral-500 text-sm mt-1">{formData.name}</p>
          </div>
        </div>

        {isDraft && (
          <div className="flex gap-3">
            <ConfirmDialog
              trigger={
                <Button variant="adminPrimary" disabled={sending || recipientCount === 0}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Campaign
                </Button>
              }
              title="Send Campaign?"
              description={`This will send the campaign to ${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}. This action cannot be undone.`}
              confirmText="Send Now"
              cancelText="Cancel"
              variant="default"
              onConfirm={handleSend}
            />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form / Content */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
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
                label="Campaign Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={!isDraft}
              />

              <AdminInput
                label="Email Subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                required
                disabled={!isDraft}
              />

              <AdminTextarea
                label="Email Body"
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                required
                disabled={!isDraft}
                rows={10}
              />
            </div>
          </AdminCard>

          {/* Recipients - only editable for drafts */}
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
                disabled={!isDraft}
              >
                <option value="all">All consented contacts</option>
                <option value="location">By location</option>
                <option value="custom">Custom selection</option>
              </AdminSelect>

              {formData.targetType === "location" && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                    Selected Locations
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LOCATIONS.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => isDraft && handleLocationToggle(loc.name)}
                        disabled={!isDraft}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          formData.targetLocations.includes(loc.name)
                            ? "bg-sky-100 text-sky-700 border border-sky-200"
                            : "bg-neutral-100 text-neutral-600 border border-transparent"
                        } ${isDraft ? "hover:bg-neutral-200" : "cursor-default opacity-75"}`}
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AdminCard>

          {/* Actions for draft */}
          {isDraft && (
            <div className="flex gap-3">
              <Button type="submit" variant="adminSecondary" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>

              <ConfirmDialog
                trigger={
                  <Button type="button" variant="adminDanger">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Campaign
                  </Button>
                }
                title="Delete Campaign?"
                description="This will permanently delete this campaign. This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                onConfirm={handleDelete}
              />
            </div>
          )}
        </form>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <AdminCard hover={false}>
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Campaign Stats
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
                  <Users className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {campaign.status === "sent"
                      ? campaign.sentCount || 0
                      : recipientCount}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {campaign.status === "sent" ? "Emails Sent" : "Recipients"}
                  </p>
                </div>
              </div>

              {campaign.status === "sent" && (
                <>
                  <div className="pt-4 border-t border-neutral-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Sent At
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {formatDate(campaign.sentAt)}
                    </p>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-neutral-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Created
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {formatDate(campaign.createdAt)}
                </p>
              </div>
            </div>
          </AdminCard>

          {/* Preview */}
          <AdminCard hover={false}>
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Email Preview
            </h2>
            <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50">
              <p className="font-medium text-sm text-neutral-900 mb-2">
                Subject: {formData.subject}
              </p>
              <hr className="my-2" />
              <div
                className="text-sm text-neutral-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.body }}
              />
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
