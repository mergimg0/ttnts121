"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import {
  AdminTable,
  AdminTableHead,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/ui/admin-table";
import {
  ResponsiveTable,
  MobileCard,
  MobileCardRow,
} from "@/components/admin/mobile-table";
import { toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import {
  Loader2,
  Plus,
  Mail,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Users,
  Eye,
  BarChart3,
  MousePointerClick,
} from "lucide-react";
import { Campaign } from "@/types/contact";

const statusConfig = {
  draft: { label: "Draft", variant: "neutral" as const, icon: Clock },
  sending: { label: "Sending", variant: "warning" as const, icon: Send },
  sent: { label: "Sent", variant: "success" as const, icon: CheckCircle },
  failed: { label: "Failed", variant: "error" as const, icon: XCircle },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    recipients: 0,
    openRate: "0.0%",
    clickRate: "0.0%",
  });

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/campaigns");
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast("Failed to fetch campaigns", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/campaigns/stats");
      const data = await response.json();

      if (data.success) {
        setStats({
          total: data.data.totalCampaigns,
          sent: data.data.sentCampaigns,
          recipients: data.data.totalEmailsSent,
          openRate: data.data.openRate,
          clickRate: data.data.clickRate,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/campaigns/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        toast("Campaign deleted", "success");
        setCampaigns(campaigns.filter((c) => c.id !== id));
      } else {
        toast(data.error || "Failed to delete campaign", "error");
      }
    } catch (error) {
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
    });
  };

  // Desktop table content
  const tableContent = (
    <div className="overflow-x-auto">
      <table className="w-full">
        <AdminTableHead>
          <tr>
            <AdminTableHeader>Campaign</AdminTableHeader>
            <AdminTableHeader>Status</AdminTableHeader>
            <AdminTableHeader>Recipients</AdminTableHeader>
            <AdminTableHeader>Created</AdminTableHeader>
            <AdminTableHeader className="text-right">Actions</AdminTableHeader>
          </tr>
        </AdminTableHead>
        <AdminTableBody>
          {campaigns.map((campaign) => {
            const config = statusConfig[campaign.status];
            const StatusIcon = config.icon;
            return (
              <AdminTableRow key={campaign.id}>
                <AdminTableCell>
                  <Link
                    href={`/admin/campaigns/${campaign.id}`}
                    className="hover:text-sky-600 transition-colors"
                  >
                    <p className="font-medium text-neutral-900">
                      {campaign.name}
                    </p>
                    <p className="text-sm text-neutral-500 truncate max-w-xs">
                      {campaign.subject}
                    </p>
                  </Link>
                </AdminTableCell>
                <AdminTableCell>
                  <AdminBadge variant={config.variant}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </AdminBadge>
                </AdminTableCell>
                <AdminTableCell className="text-sm text-neutral-600 tabular-nums">
                  {campaign.status === "sent"
                    ? `${campaign.sentCount || 0} sent`
                    : `${campaign.recipientCount} targeted`}
                </AdminTableCell>
                <AdminTableCell className="text-sm text-neutral-500">
                  {formatDate(campaign.createdAt)}
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="adminSecondary" size="sm" asChild>
                      <Link href={`/admin/campaigns/${campaign.id}`}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        {campaign.status === "draft" ? "Edit" : "View"}
                      </Link>
                    </Button>
                    {campaign.status === "draft" && (
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-neutral-400 hover:text-red-500" />
                          </Button>
                        }
                        title="Delete Campaign?"
                        description="This will permanently delete this campaign draft. This action cannot be undone."
                        confirmText="Delete"
                        variant="danger"
                        onConfirm={() => handleDelete(campaign.id)}
                      />
                    )}
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            );
          })}
        </AdminTableBody>
      </table>
    </div>
  );

  // Mobile cards content
  const mobileContent = campaigns.map((campaign) => {
    const config = statusConfig[campaign.status];
    const StatusIcon = config.icon;
    return (
      <MobileCard key={campaign.id}>
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/admin/campaigns/${campaign.id}`}
            className="flex-1 min-w-0"
          >
            <p className="font-medium text-neutral-900 truncate">
              {campaign.name}
            </p>
            <p className="text-sm text-neutral-500 truncate">{campaign.subject}</p>
          </Link>
          <AdminBadge variant={config.variant}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </AdminBadge>
        </div>
        <div className="pt-2 border-t border-neutral-100 space-y-1">
          <MobileCardRow label="Recipients">
            {campaign.status === "sent"
              ? `${campaign.sentCount || 0} sent`
              : `${campaign.recipientCount} targeted`}
          </MobileCardRow>
          <MobileCardRow label="Created">{formatDate(campaign.createdAt)}</MobileCardRow>
        </div>
        <div className="pt-2 flex gap-2">
          <Button variant="adminSecondary" size="sm" className="flex-1" asChild>
            <Link href={`/admin/campaigns/${campaign.id}`}>
              <Eye className="h-3.5 w-3.5 mr-1" />
              {campaign.status === "draft" ? "Edit" : "View"}
            </Link>
          </Button>
          {campaign.status === "draft" && (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 text-neutral-400" />
                </Button>
              }
              title="Delete Campaign?"
              description="This will permanently delete this campaign draft. This action cannot be undone."
              confirmText="Delete"
              variant="danger"
              onConfirm={() => handleDelete(campaign.id)}
            />
          )}
        </div>
      </MobileCard>
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Campaigns"
        subtitle="Create and send email campaigns to your contacts"
      >
        <Button variant="adminPrimary" asChild>
          <Link href="/admin/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </AdminPageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
              <Mail className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{stats.total}</p>
              <p className="text-xs text-neutral-500">Total Campaigns</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Send className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{stats.sent}</p>
              <p className="text-xs text-neutral-500">Campaigns Sent</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{stats.recipients}</p>
              <p className="text-xs text-neutral-500">Emails Sent</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{stats.openRate}</p>
              <p className="text-xs text-neutral-500">Open Rate</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
              <MousePointerClick className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{stats.clickRate}</p>
              <p className="text-xs text-neutral-500">Click Rate</p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <AdminCard hover={false}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        </AdminCard>
      ) : campaigns.length === 0 ? (
        <AdminCard hover={false}>
          <div className="text-center py-12">
            <div className="mx-auto h-14 w-14 rounded-full bg-neutral-50 flex items-center justify-center">
              <Mail className="h-7 w-7 text-neutral-400" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-neutral-900">No campaigns</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Create your first email campaign to reach your contacts
            </p>
            <Button variant="adminPrimary" className="mt-4" asChild>
              <Link href="/admin/campaigns/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Link>
            </Button>
          </div>
        </AdminCard>
      ) : (
        <ResponsiveTable mobileView={mobileContent}>
          {tableContent}
        </ResponsiveTable>
      )}
    </div>
  );
}
