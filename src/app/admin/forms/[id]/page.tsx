"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { FormBuilder } from "@/components/admin/form-builder";
import { toast } from "@/components/ui/toast";
import { ArrowLeft, Loader2, Save, FileText, Users } from "lucide-react";
import { FormQuestion, FormTemplate, UpdateFormTemplateInput } from "@/types/form";
import { Session } from "@/types/booking";

interface EditFormPageProps {
  params: Promise<{ id: string }>;
}

export default function EditFormPage({ params }: EditFormPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [responseCount, setResponseCount] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [applyToAll, setApplyToAll] = useState(true);

  useEffect(() => {
    fetchForm();
    fetchSessions();
  }, [id]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/admin/forms/${id}`);
      const data = await response.json();

      if (data.success) {
        const formData = data.data as FormTemplate & { responseCount: number };
        setForm(formData);
        setResponseCount(formData.responseCount || 0);
        setFormData({
          name: formData.name,
          description: formData.description || "",
          isActive: formData.isActive,
        });
        setQuestions(formData.questions || []);
        setSelectedSessions(formData.sessionIds || []);
        setApplyToAll(
          !formData.sessionIds || formData.sessionIds.length === 0
        );
      } else {
        setError(data.error || "Form not found");
        toast(data.error || "Form not found", "error");
      }
    } catch (error) {
      console.error("Error fetching form:", error);
      setError("Failed to load form");
      toast("Failed to load form", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/admin/sessions?active=true");
      const data = await response.json();
      if (data.success) {
        setSessions(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSessionToggle = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Form name is required");
      return;
    }

    if (questions.length === 0) {
      setError("At least one question is required");
      return;
    }

    // Validate all questions have labels
    const emptyLabels = questions.filter((q) => !q.label.trim());
    if (emptyLabels.length > 0) {
      setError("All questions must have a label");
      return;
    }

    setSaving(true);

    try {
      const payload: UpdateFormTemplateInput = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        questions: questions,
        sessionIds: applyToAll ? [] : selectedSessions,
        isActive: formData.isActive,
      };

      const response = await fetch(`/api/admin/forms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast("Form updated successfully", "success");
        router.push("/admin/forms");
      } else {
        setError(data.error || "Failed to update form");
        toast(data.error || "Failed to update form", "error");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-neutral-300" />
        <h3 className="mt-4 text-lg font-medium text-neutral-900">
          Form not found
        </h3>
        <p className="mt-1 text-neutral-500">
          The form you are looking for does not exist
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/forms">Back to Forms</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/forms"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Edit Form
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Update form settings and questions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminBadge variant={formData.isActive ? "success" : "neutral"}>
            {formData.isActive ? "Active" : "Inactive"}
          </AdminBadge>
          {responseCount > 0 && (
            <AdminBadge variant="info">
              <Users className="h-3 w-3 mr-1" />
              {responseCount} responses
            </AdminBadge>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Details */}
        <AdminCard hover={false}>
          <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
            Form Details
          </h2>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <AdminInput
              label="Form Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Medical Information Form"
              required
            />

            <AdminTextarea
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description for this form"
            />

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
              <span className="text-sm text-neutral-700">
                Form is active and will be shown during checkout
              </span>
            </div>
          </div>
        </AdminCard>

        {/* Session Assignment */}
        <AdminCard hover={false}>
          <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
            Apply to Sessions
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToAll}
                  onChange={(e) => setApplyToAll(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
              <span className="text-sm text-neutral-700">
                Apply to all sessions
              </span>
            </div>

            {!applyToAll && (
              <div className="space-y-2">
                <p className="text-xs text-neutral-500">
                  Select which sessions this form should appear for:
                </p>
                {loadingSessions ? (
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading sessions...</span>
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    No active sessions found
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-neutral-200 rounded-xl p-3">
                    {sessions.map((session) => (
                      <label
                        key={session.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSessions.includes(session.id)}
                          onChange={() => handleSessionToggle(session.id)}
                          className="h-4 w-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-sm text-neutral-700">
                          {session.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </AdminCard>

        {/* Form Builder */}
        <div>
          <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
            Form Questions
          </h2>
          <FormBuilder questions={questions} onChange={setQuestions} />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/forms">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
