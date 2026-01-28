"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Tag, X, CheckCircle, AlertCircle } from "lucide-react";
import { AppliedCoupon } from "@/types/coupon";
import { formatPrice } from "@/lib/booking-utils";

interface CouponInputProps {
  cartTotal: number;
  sessionIds: string[];
  appliedCoupon: AppliedCoupon | null;
  onApplyCoupon: (coupon: AppliedCoupon) => void;
  onRemoveCoupon: () => void;
}

export function CouponInput({
  cartTotal,
  sessionIds,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}: CouponInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          cartTotal,
          sessionIds,
        }),
      });

      const data = await response.json();

      if (data.valid && data.coupon) {
        onApplyCoupon({
          code: data.coupon.code,
          couponId: data.coupon.id,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue,
          discountAmount: data.discount,
        });
        setCode("");
      } else {
        setError(data.error || "Invalid coupon code");
      }
    } catch (err) {
      setError("Failed to validate coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    }
  };

  // If a coupon is already applied, show the applied state
  if (appliedCoupon) {
    return (
      <div className="border border-green-200 bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">
                Coupon applied:{" "}
                <code className="font-mono bg-green-100 px-1.5 py-0.5 rounded">
                  {appliedCoupon.code}
                </code>
              </p>
              <p className="text-sm text-green-700">
                {appliedCoupon.discountType === "percentage"
                  ? `${appliedCoupon.discountValue}% off`
                  : `${formatPrice(appliedCoupon.discountValue)} off`}{" "}
                - You save {formatPrice(appliedCoupon.discountAmount)}
              </p>
            </div>
          </div>
          <button
            onClick={onRemoveCoupon}
            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
            title="Remove coupon"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 bg-white p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="h-4 w-4 text-neutral-500" />
        <span className="text-sm font-medium text-neutral-700">
          Have a coupon code?
        </span>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter code"
            className={`font-mono uppercase ${error ? "border-red-300 focus:ring-red-500" : ""}`}
            disabled={loading}
          />
        </div>
        <Button
          type="button"
          onClick={handleApply}
          disabled={loading || !code.trim()}
          variant="outline"
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
