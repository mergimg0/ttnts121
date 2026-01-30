"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { toast } from "@/components/ui/toast";
import { ArrowLeft, Loader2, Save, Eye } from "lucide-react";
import { Session } from "@/types/booking";
import { sanitizeHtml } from "@/lib/sanitize";

export default function NewWaiverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    content: "",
    sessionIds: [] as string[],
    isRequired: true,
    isActive: true,
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/admin/sessions");
      const data = await response.json();
      if (data.success) {
        setSessions(data.data.filter((s: Session) => s.isActive));
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast("Please enter a waiver name", "error");
      return;
    }

    if (!formData.content.trim()) {
      toast("Please enter waiver content", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/waivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast("Waiver created successfully", "success");
        router.push("/admin/waivers");
      } else {
        toast(data.error || "Failed to create waiver", "error");
      }
    } catch (error) {
      console.error("Error creating waiver:", error);
      toast("Failed to create waiver", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionToggle = (sessionId: string) => {
    setFormData((prev) => ({
      ...prev,
      sessionIds: prev.sessionIds.includes(sessionId)
        ? prev.sessionIds.filter((id) => id !== sessionId)
        : [...prev.sessionIds, sessionId],
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="New Waiver"
        subtitle="Create a new waiver template for bookings"
      >
        <Button variant="adminSecondary" asChild>
          <Link href="/admin/waivers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </AdminPageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <AdminCard hover={false}>
          <h3 className="font-semibold text-neutral-900 mb-4">
            Waiver Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Waiver Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Liability Waiver, Photo Consent"
                className="max-w-md"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-neutral-700">
                  Waiver Content (HTML supported) *
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPreview ? "Edit" : "Preview"}
                </Button>
              </div>

              {showPreview ? (
                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 min-h-[200px]">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.content) }}
                  />
                </div>
              ) : (
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Enter the waiver content here. You can use HTML for formatting..."
                  rows={10}
                  className="font-mono text-sm"
                />
              )}
              <p className="text-xs text-neutral-500 mt-1">
                Tip: Use &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt; tags
                for formatting
              </p>
            </div>
          </div>
        </AdminCard>

        {/* Settings */}
        <AdminCard hover={false}>
          <h3 className="font-semibold text-neutral-900 mb-4">Settings</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isRequired"
                checked={formData.isRequired}
                onChange={(e) =>
                  setFormData({ ...formData, isRequired: e.target.checked })
                }
                className="h-4 w-4 rounded border-neutral-300"
              />
              <label htmlFor="isRequired" className="text-sm text-neutral-700">
                <strong>Required</strong> - Customers must sign this waiver to
                complete checkout
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4 rounded border-neutral-300"
              />
              <label htmlFor="isActive" className="text-sm text-neutral-700">
                <strong>Active</strong> - Show this waiver during checkout
              </label>
            </div>
          </div>
        </AdminCard>

        {/* Session Assignment */}
        <AdminCard hover={false}>
          <h3 className="font-semibold text-neutral-900 mb-2">
            Session Assignment
          </h3>
          <p className="text-sm text-neutral-500 mb-4">
            Select specific sessions this waiver applies to, or leave empty to
            apply to all sessions.
          </p>

          {sessions.length === 0 ? (
            <p className="text-sm text-neutral-500 italic">
              No active sessions found
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto border border-neutral-200 rounded-lg p-3">
              <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
                <input
                  type="checkbox"
                  id="allSessions"
                  checked={formData.sessionIds.length === 0}
                  onChange={() => setFormData({ ...formData, sessionIds: [] })}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <label
                  htmlFor="allSessions"
                  className="text-sm font-medium text-neutral-700"
                >
                  All Sessions (default)
                </label>
              </div>

              {sessions.map((session) => (
                <div key={session.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`session-${session.id}`}
                    checked={formData.sessionIds.includes(session.id)}
                    onChange={() => handleSessionToggle(session.id)}
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                  <label
                    htmlFor={`session-${session.id}`}
                    className="text-sm text-neutral-700"
                  >
                    {session.name}
                    <span className="text-neutral-400 ml-1">
                      ({session.location})
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {formData.sessionIds.length > 0 && (
            <p className="text-sm text-neutral-500 mt-2">
              {formData.sessionIds.length} session(s) selected
            </p>
          )}
        </AdminCard>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button variant="adminSecondary" type="button" asChild>
            <Link href="/admin/waivers">Cancel</Link>
          </Button>
          <Button variant="adminPrimary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Waiver
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
