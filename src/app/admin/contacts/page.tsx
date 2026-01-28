"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminInput } from "@/components/admin/ui/admin-input";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminSelect } from "@/components/admin/ui/admin-select";
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
  Search,
  Users,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";
import { Contact } from "@/types/contact";
import { LOCATIONS } from "@/lib/constants";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [consentFilter, setConsentFilter] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchContacts();
  }, [locationFilter, consentFilter]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (locationFilter) params.set("location", locationFilter);
      if (consentFilter) params.set("marketingConsent", consentFilter);

      const response = await fetch(`/api/admin/contacts?${params}`);
      const data = await response.json();
      if (data.success) {
        setContacts(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast("Failed to fetch contacts", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/contacts/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        toast("Contact deleted", "success");
        setContacts(contacts.filter((c) => c.id !== id));
        setTotal((prev) => prev - 1);
      } else {
        toast(data.error || "Failed to delete contact", "error");
      }
    } catch (error) {
      toast("Failed to delete contact", "error");
    }
  };

  const filteredContacts = search
    ? contacts.filter(
        (c) =>
          c.email.toLowerCase().includes(search.toLowerCase()) ||
          c.firstName.toLowerCase().includes(search.toLowerCase()) ||
          c.lastName.toLowerCase().includes(search.toLowerCase())
      )
    : contacts;

  const consentedCount = contacts.filter((c) => c.marketingConsent).length;
  const consentRate = total > 0 ? Math.round((consentedCount / total) * 100) : 0;

  // Desktop table content
  const tableContent = (
    <div className="overflow-x-auto">
      <table className="w-full">
        <AdminTableHead>
          <tr>
            <AdminTableHeader>Name</AdminTableHeader>
            <AdminTableHeader>Email</AdminTableHeader>
            <AdminTableHeader>Location</AdminTableHeader>
            <AdminTableHeader>Consent</AdminTableHeader>
            <AdminTableHeader>Source</AdminTableHeader>
            <AdminTableHeader className="text-right">Actions</AdminTableHeader>
          </tr>
        </AdminTableHead>
        <AdminTableBody>
          {filteredContacts.map((contact) => (
            <AdminTableRow key={contact.id}>
              <AdminTableCell>
                <Link
                  href={`/admin/contacts/${contact.id}`}
                  className="font-medium text-neutral-900 hover:text-sky-600 transition-colors"
                >
                  {contact.firstName} {contact.lastName}
                </Link>
              </AdminTableCell>
              <AdminTableCell className="text-sm text-neutral-600">
                {contact.email}
              </AdminTableCell>
              <AdminTableCell>
                {contact.location ? (
                  <span className="flex items-center gap-1 text-sm text-neutral-600">
                    <MapPin className="h-3.5 w-3.5" />
                    {contact.location}
                  </span>
                ) : (
                  <span className="text-sm text-neutral-400">—</span>
                )}
              </AdminTableCell>
              <AdminTableCell>
                {contact.marketingConsent ? (
                  <AdminBadge variant="success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Opted In
                  </AdminBadge>
                ) : (
                  <AdminBadge variant="neutral">
                    <XCircle className="h-3 w-3 mr-1" />
                    Opted Out
                  </AdminBadge>
                )}
              </AdminTableCell>
              <AdminTableCell>
                <AdminBadge variant="neutral">{contact.source}</AdminBadge>
              </AdminTableCell>
              <AdminTableCell className="text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="adminSecondary" size="sm" asChild>
                    <Link href={`/admin/contacts/${contact.id}`}>Edit</Link>
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-neutral-400 hover:text-red-500" />
                      </Button>
                    }
                    title="Delete Contact?"
                    description="This will permanently delete this contact and their consent history. This action cannot be undone."
                    confirmText="Delete"
                    variant="danger"
                    onConfirm={() => handleDelete(contact.id)}
                  />
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTableBody>
      </table>
    </div>
  );

  // Mobile cards content
  const mobileContent = filteredContacts.map((contact) => (
    <MobileCard key={contact.id}>
      <div className="flex items-start justify-between gap-3">
        <Link href={`/admin/contacts/${contact.id}`} className="flex-1 min-w-0">
          <p className="font-medium text-neutral-900">
            {contact.firstName} {contact.lastName}
          </p>
          <p className="text-sm text-neutral-500 truncate">{contact.email}</p>
        </Link>
        {contact.marketingConsent ? (
          <AdminBadge variant="success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Opted In
          </AdminBadge>
        ) : (
          <AdminBadge variant="neutral">
            <XCircle className="h-3 w-3 mr-1" />
            Opted Out
          </AdminBadge>
        )}
      </div>
      <div className="pt-2 border-t border-neutral-100 space-y-1">
        <MobileCardRow label="Location">
          {contact.location ? (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {contact.location}
            </span>
          ) : (
            "—"
          )}
        </MobileCardRow>
        <MobileCardRow label="Source">{contact.source}</MobileCardRow>
      </div>
      <div className="pt-2 flex gap-2">
        <Button variant="adminSecondary" size="sm" className="flex-1" asChild>
          <Link href={`/admin/contacts/${contact.id}`}>Edit</Link>
        </Button>
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 text-neutral-400" />
            </Button>
          }
          title="Delete Contact?"
          description="This will permanently delete this contact and their consent history. This action cannot be undone."
          confirmText="Delete"
          variant="danger"
          onConfirm={() => handleDelete(contact.id)}
        />
      </div>
    </MobileCard>
  ));

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Contacts"
        subtitle="Manage your email subscribers and marketing contacts"
      >
        <Button variant="adminPrimary" asChild>
          <Link href="/admin/contacts/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Link>
        </Button>
      </AdminPageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
              <Users className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{total}</p>
              <p className="text-xs text-neutral-500">Total Contacts</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Mail className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{consentedCount}</p>
              <p className="text-xs text-neutral-500">Opted In</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <CheckCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{consentRate}%</p>
              <p className="text-xs text-neutral-500">Consent Rate</p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard hover={false}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <AdminInput
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex gap-3">
            <AdminSelect
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-40"
            >
              <option value="">All Locations</option>
              {LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </AdminSelect>

            <AdminSelect
              value={consentFilter}
              onChange={(e) => setConsentFilter(e.target.value)}
              className="w-36"
            >
              <option value="">All Consent</option>
              <option value="true">Opted In</option>
              <option value="false">Opted Out</option>
            </AdminSelect>
          </div>
        </div>
      </AdminCard>

      {/* Contacts Table */}
      {loading ? (
        <AdminCard hover={false}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        </AdminCard>
      ) : filteredContacts.length === 0 ? (
        <AdminCard hover={false}>
          <div className="text-center py-12">
            <div className="mx-auto h-14 w-14 rounded-full bg-neutral-50 flex items-center justify-center">
              <Users className="h-7 w-7 text-neutral-400" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-neutral-900">No contacts</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {search ? "No contacts match your search" : "Add your first contact to get started"}
            </p>
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
