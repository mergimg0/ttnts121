"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChildForm } from "@/components/portal/child-form";
import { UserChild, ChildFormData } from "@/types/user";
import { toast } from "@/components/ui/toast";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Check,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

function formatChildDob(dob: Date | Timestamp): string {
  const date = dob instanceof Timestamp ? dob.toDate() : new Date(dob);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calculateAge(dob: Date | Timestamp): number {
  const date = dob instanceof Timestamp ? dob.toDate() : new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

export default function PortalSettingsPage() {
  const { user, firebaseUser, refreshUser } = useAuth();

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Children state
  const [children, setChildren] = useState<UserChild[]>([]);
  const [showChildForm, setShowChildForm] = useState(false);
  const [editingChild, setEditingChild] = useState<UserChild | null>(null);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Communication preferences
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      setChildren(user.children || []);
      setMarketingConsent(user.marketingConsent || false);
    }
  }, [user]);

  // Save profile
  const handleSaveProfile = async () => {
    if (!firebaseUser) return;

    setProfileLoading(true);
    setProfileSaved(false);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch("/api/portal/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          marketingConsent,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await refreshUser();
        setProfileSaved(true);
        toast("Profile updated successfully", "success");
        setTimeout(() => setProfileSaved(false), 3000);
      } else {
        toast(data.error || "Failed to update profile", "error");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast("Failed to update profile", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  // Add/Edit child
  const handleChildSubmit = async (data: ChildFormData) => {
    if (!firebaseUser) return;

    setChildrenLoading(true);

    try {
      const token = await firebaseUser.getIdToken();
      const isEditing = editingChild !== null;
      const url = isEditing
        ? `/api/portal/children/${editingChild.id}`
        : "/api/portal/children";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        await refreshUser();
        setShowChildForm(false);
        setEditingChild(null);
        toast(
          isEditing ? "Child updated successfully" : "Child added successfully",
          "success"
        );
      } else {
        toast(result.error || "Failed to save child", "error");
      }
    } catch (error) {
      console.error("Error saving child:", error);
      toast("Failed to save child", "error");
    } finally {
      setChildrenLoading(false);
    }
  };

  // Delete child
  const handleDeleteChild = async (childId: string) => {
    if (!firebaseUser) return;
    if (!confirm("Are you sure you want to remove this child?")) return;

    setDeletingChildId(childId);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/portal/children/${childId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        await refreshUser();
        toast("Child removed successfully", "success");
      } else {
        toast(data.error || "Failed to remove child", "error");
      }
    } catch (error) {
      console.error("Error deleting child:", error);
      toast("Failed to remove child", "error");
    } finally {
      setDeletingChildId(null);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!firebaseUser || !firebaseUser.email) return;

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordLoading(true);

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(firebaseUser, credential);

      // Update password
      await updatePassword(firebaseUser, newPassword);

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Password changed successfully", "success");
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect");
      } else if (firebaseError.code === "auth/too-many-requests") {
        setPasswordError("Too many attempts. Please try again later.");
      } else {
        setPasswordError("Failed to change password. Please try again.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Account Settings</h1>
        <p className="text-neutral-500 mt-1">
          Manage your profile, children, and preferences
        </p>
      </div>

      {/* Profile Section */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
            <User className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
            <p className="text-sm text-neutral-500">Your personal information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
            <Mail className="h-5 w-5 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-400">Email (cannot be changed)</p>
              <p className="text-sm font-medium text-neutral-700">{user?.email}</p>
            </div>
          </div>

          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
          />

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="marketing"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="marketing" className="text-sm text-neutral-600">
              I want to receive promotional emails and updates
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveProfile}
              variant="adminPrimary"
              disabled={profileLoading}
            >
              {profileLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : profileSaved ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Saved
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Children Section */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <User className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Children</h2>
              <p className="text-sm text-neutral-500">Manage your children's profiles</p>
            </div>
          </div>
          {!showChildForm && !editingChild && (
            <Button
              onClick={() => setShowChildForm(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Child
            </Button>
          )}
        </div>

        {/* Child Form */}
        {(showChildForm || editingChild) && (
          <div className="mb-6">
            <ChildForm
              child={editingChild || undefined}
              onSubmit={handleChildSubmit}
              onCancel={() => {
                setShowChildForm(false);
                setEditingChild(null);
              }}
              isLoading={childrenLoading}
            />
          </div>
        )}

        {/* Children List */}
        {user?.children && user.children.length > 0 ? (
          <div className="space-y-3">
            {user.children.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900">
                    {child.firstName} {child.lastName}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {formatChildDob(child.dob)} ({calculateAge(child.dob)} years old)
                  </p>
                  {child.medicalConditions && (
                    <p className="text-xs text-amber-600 mt-1">
                      Medical notes: {child.medicalConditions}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setEditingChild(child)}
                    className="p-2 text-neutral-400 hover:text-sky-600 transition-colors"
                    disabled={deletingChildId === child.id}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteChild(child.id)}
                    className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                    disabled={deletingChildId === child.id}
                  >
                    {deletingChildId === child.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !showChildForm && !editingChild ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 mb-4">No children added yet</p>
            <Button onClick={() => setShowChildForm(true)} variant="outline">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Your First Child
            </Button>
          </div>
        ) : null}
      </div>

      {/* Password Section */}
      <div className="rounded-xl lg:rounded-2xl bg-white border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Key className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Password</h2>
            <p className="text-sm text-neutral-500">Change your account password</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{passwordError}</p>
            </div>
          )}

          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            required
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min 6 characters)"
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="outline"
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
