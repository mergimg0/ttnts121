"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import {
  Loader2,
  Database,
  Mail,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface TestResult {
  name: string;
  status: "pending" | "running" | "success" | "error";
  message?: string;
  duration?: number;
}

export default function DebugPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Firebase Read", status: "pending" },
    { name: "Firebase Write", status: "pending" },
    { name: "Firebase Delete", status: "pending" },
    { name: "Email Config", status: "pending" },
  ]);
  const [running, setRunning] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const updateTest = (name: string, update: Partial<TestResult>) => {
    setTests((prev) =>
      prev.map((t) => (t.name === name ? { ...t, ...update } : t))
    );
  };

  const runAllTests = async () => {
    setRunning(true);
    setTests((prev) => prev.map((t) => ({ ...t, status: "pending" as const })));

    // Test 1: Firebase Read
    updateTest("Firebase Read", { status: "running" });
    const readStart = Date.now();
    try {
      const res = await fetch("/api/admin/debug/firebase-read");
      const data = await res.json();
      updateTest("Firebase Read", {
        status: data.success ? "success" : "error",
        message: data.message,
        duration: Date.now() - readStart,
      });
    } catch (error) {
      updateTest("Firebase Read", {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - readStart,
      });
    }

    // Test 2: Firebase Write
    updateTest("Firebase Write", { status: "running" });
    const writeStart = Date.now();
    try {
      const res = await fetch("/api/admin/debug/firebase-write", {
        method: "POST",
      });
      const data = await res.json();
      updateTest("Firebase Write", {
        status: data.success ? "success" : "error",
        message: data.message,
        duration: Date.now() - writeStart,
      });
    } catch (error) {
      updateTest("Firebase Write", {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - writeStart,
      });
    }

    // Test 3: Firebase Delete (cleanup)
    updateTest("Firebase Delete", { status: "running" });
    const deleteStart = Date.now();
    try {
      const res = await fetch("/api/admin/debug/firebase-delete", {
        method: "DELETE",
      });
      const data = await res.json();
      updateTest("Firebase Delete", {
        status: data.success ? "success" : "error",
        message: data.message,
        duration: Date.now() - deleteStart,
      });
    } catch (error) {
      updateTest("Firebase Delete", {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - deleteStart,
      });
    }

    // Test 4: Email Config
    updateTest("Email Config", { status: "running" });
    const emailStart = Date.now();
    try {
      const res = await fetch("/api/admin/debug/email-config");
      const data = await res.json();
      updateTest("Email Config", {
        status: data.success ? "success" : "error",
        message: data.message,
        duration: Date.now() - emailStart,
      });
    } catch (error) {
      updateTest("Email Config", {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - emailStart,
      });
    }

    setRunning(false);
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <AlertTriangle className="h-5 w-5 text-neutral-400" />;
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-sky-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <AdminBadge variant="neutral">Pending</AdminBadge>;
      case "running":
        return <AdminBadge variant="info">Running</AdminBadge>;
      case "success":
        return <AdminBadge variant="success">Passed</AdminBadge>;
      case "error":
        return <AdminBadge variant="error">Failed</AdminBadge>;
    }
  };

  const allPassed = tests.every((t) => t.status === "success");
  const anyFailed = tests.some((t) => t.status === "error");

  const sendTestEmail = async () => {
    if (!testEmail) return;
    setSendingEmail(true);
    setEmailResult(null);
    try {
      const res = await fetch("/api/admin/debug/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      });
      const data = await res.json();
      setEmailResult({ success: data.success, message: data.message });
    } catch (error) {
      setEmailResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to send",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            System Diagnostics
          </h1>
          <p className="text-[13px] text-neutral-500">
            Test Firebase and email service connections
          </p>
        </div>
        <Button
          variant="adminPrimary"
          onClick={runAllTests}
          disabled={running}
        >
          {running ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Run All Tests
        </Button>
      </div>

      {/* Summary */}
      {(allPassed || anyFailed) && (
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            {allPassed ? (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-emerald-700">All Systems Operational</p>
                  <p className="text-sm text-neutral-500">
                    Firebase and email services are working correctly
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-700">Issues Detected</p>
                  <p className="text-sm text-neutral-500">
                    Some services are not working correctly. Check the details below.
                  </p>
                </div>
              </>
            )}
          </div>
        </AdminCard>
      )}

      {/* Test Results */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Firebase Tests */}
        <AdminCard hover={false}>
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5 text-neutral-700" />
            <h2 className="font-semibold text-neutral-900">Firebase</h2>
          </div>
          <div className="space-y-3">
            {tests
              .filter((t) => t.name.startsWith("Firebase"))
              .map((test) => (
                <div
                  key={test.name}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <p className="font-medium text-sm">{test.name}</p>
                      {test.message && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {test.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.duration && (
                      <span className="text-xs text-neutral-400">
                        {test.duration}ms
                      </span>
                    )}
                    {getStatusBadge(test.status)}
                  </div>
                </div>
              ))}
          </div>
        </AdminCard>

        {/* Email Tests */}
        <AdminCard hover={false}>
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-neutral-700" />
            <h2 className="font-semibold text-neutral-900">Email (Resend)</h2>
          </div>
          <div className="space-y-3">
            {tests
              .filter((t) => t.name.startsWith("Email"))
              .map((test) => (
                <div
                  key={test.name}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <p className="font-medium text-sm">{test.name}</p>
                      {test.message && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {test.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.duration && (
                      <span className="text-xs text-neutral-400">
                        {test.duration}ms
                      </span>
                    )}
                    {getStatusBadge(test.status)}
                  </div>
                </div>
              ))}
          </div>
        </AdminCard>
      </div>

      {/* Send Test Email */}
      <AdminCard hover={false}>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-neutral-700" />
          <h2 className="font-semibold text-neutral-900">Send Test Email</h2>
        </div>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="Enter email address"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <Button
            variant="adminPrimary"
            onClick={sendTestEmail}
            disabled={sendingEmail || !testEmail}
          >
            {sendingEmail ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Send Test
          </Button>
        </div>
        {emailResult && (
          <div
            className={`mt-3 p-3 rounded-lg text-sm ${
              emailResult.success
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {emailResult.success ? (
              <CheckCircle className="inline h-4 w-4 mr-2" />
            ) : (
              <XCircle className="inline h-4 w-4 mr-2" />
            )}
            {emailResult.message}
          </div>
        )}
      </AdminCard>

      {/* Info */}
      <AdminCard hover={false}>
        <h3 className="font-medium text-neutral-900 mb-2">About These Tests</h3>
        <ul className="text-sm text-neutral-600 space-y-1">
          <li>
            <strong>Firebase Read:</strong> Attempts to read from the sessions collection
          </li>
          <li>
            <strong>Firebase Write:</strong> Creates a temporary test document
          </li>
          <li>
            <strong>Firebase Delete:</strong> Removes the test document (cleanup)
          </li>
          <li>
            <strong>Email Config:</strong> Verifies Resend API key is configured
          </li>
        </ul>
      </AdminCard>
    </div>
  );
}
