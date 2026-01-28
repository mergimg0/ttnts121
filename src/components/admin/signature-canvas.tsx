"use client";

import { useRef, useEffect, useCallback } from "react";
import SignaturePad from "signature_pad";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

interface SignatureCanvasProps {
  onSignatureChange: (signatureData: string | null) => void;
  width?: number;
  height?: number;
  className?: string;
  disabled?: boolean;
}

export function SignatureCanvas({
  onSignatureChange,
  width = 400,
  height = 150,
  className = "",
  disabled = false,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  // Initialize signature pad
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const signaturePad = new SignaturePad(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(0, 0, 0)",
    });

    signaturePadRef.current = signaturePad;

    // Handle signature changes
    signaturePad.addEventListener("endStroke", () => {
      if (signaturePad.isEmpty()) {
        onSignatureChange(null);
      } else {
        onSignatureChange(signaturePad.toDataURL("image/png"));
      }
    });

    // Handle resize
    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
      }

      // Clear on resize to avoid distortion
      signaturePad.clear();
      onSignatureChange(null);
    };

    // Initial setup
    resizeCanvas();

    // Listen for window resize
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      signaturePad.off();
    };
  }, [onSignatureChange]);

  // Handle disabled state
  useEffect(() => {
    if (signaturePadRef.current) {
      if (disabled) {
        signaturePadRef.current.off();
      } else {
        signaturePadRef.current.on();
      }
    }
  }, [disabled]);

  const handleClear = useCallback(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      onSignatureChange(null);
    }
  }, [onSignatureChange]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative border border-neutral-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: `${height}px` }}
          className={`touch-none ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-crosshair"}`}
        />
        {!disabled && (
          <div className="absolute bottom-2 right-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="bg-white/80 backdrop-blur-sm"
            >
              <Eraser className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs text-neutral-500 text-center">
        Draw your signature above using your mouse or finger
      </p>
    </div>
  );
}
