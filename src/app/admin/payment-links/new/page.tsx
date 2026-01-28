"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PaymentLinkForm } from "@/components/admin/payment-link-form";

export default function NewPaymentLinkPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/payment-links"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            Create Payment Link
          </h1>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            Generate a custom payment link for any amount
          </p>
        </div>
      </div>

      {/* Form */}
      <PaymentLinkForm
        onSuccess={() => {
          // Stay on page to show success state
        }}
        onCancel={() => router.push("/admin/payment-links")}
      />
    </div>
  );
}
