"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  User,
  UserPlus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Shield,
  Bell,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { UserChild, AuthorizedContact } from "@/types/user";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  relationship: string;
  canPickup: boolean;
  receiveEmails: boolean;
}

const emptyContactForm: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  relationship: "",
  canPickup: true,
  receiveEmails: true,
};

export default function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: childId } = use(params);
  const { user, getIdToken } = useAuth();
  const [child, setChild] = useState<UserChild | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Contact form state
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<ContactFormData>(emptyContactForm);

  const fetchChild = useCallback(async () => {
    try {
      const token = await getIdToken();
      const response = await fetch(`/api/portal/children/${childId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setChild(data.data);
      } else {
        setError(data.error || "Failed to load child details");
      }
    } catch {
      setError("Failed to load child details");
    } finally {
      setLoading(false);
    }
  }, [childId, getIdToken]);

  useEffect(() => {
    if (user) {
      fetchChild();
    }
  }, [user, fetchChild]);

  const handleAddContact = () => {
    setContactForm(emptyContactForm);
    setEditingContactId(null);
    setShowContactForm(true);
    setError(null);
  };

  const handleEditContact = (contact: AuthorizedContact) => {
    setContactForm({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone,
      relationship: contact.relationship,
      canPickup: contact.canPickup,
      receiveEmails: contact.receiveEmails,
    });
    setEditingContactId(contact.id);
    setShowContactForm(true);
    setError(null);
  };

  const handleCancelForm = () => {
    setShowContactForm(false);
    setEditingContactId(null);
    setContactForm(emptyContactForm);
    setError(null);
  };

  const handleSaveContact = async () => {
    // Validation
    if (!contactForm.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!contactForm.phone.trim()) {
      setError("Phone number is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = await getIdToken();
      const endpoint = `/api/portal/children/${childId}/contacts`;
      const method = editingContactId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactId: editingContactId,
          ...contactForm,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(editingContactId ? "Contact updated" : "Contact added");
        setTimeout(() => setSuccessMessage(null), 3000);
        handleCancelForm();
        fetchChild(); // Refresh data
      } else {
        setError(data.error || "Failed to save contact");
      }
    } catch {
      setError("Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to remove this authorized contact?")) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = await getIdToken();
      const response = await fetch(`/api/portal/children/${childId}/contacts`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contactId }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Contact removed");
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchChild(); // Refresh data
      } else {
        setError(data.error || "Failed to remove contact");
      }
    } catch {
      setError("Failed to remove contact");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date | { _seconds: number } | { seconds: number } | null | undefined): string => {
    if (!date) return "-";
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === "object" && "_seconds" in date) {
      d = new Date((date as { _seconds: number })._seconds * 1000);
    } else if (typeof date === "object" && "seconds" in date) {
      d = new Date((date as { seconds: number }).seconds * 1000);
    } else {
      d = new Date(date as unknown as string | number);
    }
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/portal"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-semibold text-neutral-900">Child Not Found</h1>
        </div>
      </div>
    );
  }

  const contacts = child.authorizedContacts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/portal"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            {child.firstName} {child.lastName}
          </h1>
          <p className="text-sm text-neutral-500">
            Born {formatDate(child.dob)}
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Authorized Contacts Section */}
      <div className="bg-white border border-neutral-200 rounded-xl">
        <div className="p-6 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-neutral-400" />
              <div>
                <h2 className="font-semibold text-neutral-900">Authorized Contacts</h2>
                <p className="text-sm text-neutral-500">
                  People authorized to pick up {child.firstName} or receive notifications
                </p>
              </div>
            </div>
            {!showContactForm && (
              <Button onClick={handleAddContact} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            )}
          </div>
        </div>

        {/* Contact Form */}
        {showContactForm && (
          <div className="p-6 bg-neutral-50 border-b border-neutral-100">
            <h3 className="font-medium text-neutral-900 mb-4">
              {editingContactId ? "Edit Contact" : "Add New Contact"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2">
                  Full Name *
                </label>
                <Input
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="e.g., John Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2">
                  Phone *
                </label>
                <Input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2">
                  Relationship
                </label>
                <select
                  value={contactForm.relationship}
                  onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                  className="w-full h-10 px-3 border border-neutral-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select relationship...</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Step-parent">Step-parent</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Aunt/Uncle">Aunt/Uncle</option>
                  <option value="Sibling">Sibling (18+)</option>
                  <option value="Nanny/Au Pair">Nanny/Au Pair</option>
                  <option value="Family Friend">Family Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="canPickup"
                    checked={contactForm.canPickup}
                    onChange={(e) => setContactForm({ ...contactForm, canPickup: e.target.checked })}
                    className="mt-1 h-4 w-4"
                  />
                  <label htmlFor="canPickup" className="text-sm text-neutral-600">
                    <span className="font-medium text-neutral-900">Authorized for pickup</span>
                    <br />
                    <span className="text-xs">This person can collect {child.firstName} from sessions</span>
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="receiveEmails"
                    checked={contactForm.receiveEmails}
                    onChange={(e) => setContactForm({ ...contactForm, receiveEmails: e.target.checked })}
                    className="mt-1 h-4 w-4"
                  />
                  <label htmlFor="receiveEmails" className="text-sm text-neutral-600">
                    <span className="font-medium text-neutral-900">Receive email notifications</span>
                    <br />
                    <span className="text-xs">Copy this person on booking confirmations and reminders</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSaveContact} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingContactId ? (
                  "Update Contact"
                ) : (
                  "Add Contact"
                )}
              </Button>
              <Button variant="outline" onClick={handleCancelForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Contact List */}
        <div className="divide-y divide-neutral-100">
          {contacts.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <UserPlus className="h-8 w-8 mx-auto mb-3 text-neutral-300" />
              <p>No authorized contacts added yet</p>
              <p className="text-sm mt-1">
                Add contacts who can pick up {child.firstName} or receive notifications
              </p>
            </div>
          ) : (
            contacts.map((contact) => (
              <div key={contact.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                      <User className="h-5 w-5 text-neutral-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900">{contact.name}</h3>
                      <p className="text-sm text-neutral-500">{contact.relationship || "Contact"}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {contact.phone}
                        </span>
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {contact.email}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {contact.canPickup && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                            <Shield className="h-3 w-3" />
                            Authorized Pickup
                          </span>
                        )}
                        {contact.receiveEmails && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            <Bell className="h-3 w-3" />
                            Receives Emails
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditContact(contact)}
                      className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                      disabled={saving}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Medical Information */}
      {child.medicalConditions && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="font-semibold text-neutral-900 mb-3">Medical Information</h2>
          <p className="text-sm text-neutral-600">{child.medicalConditions}</p>
        </div>
      )}
    </div>
  );
}
