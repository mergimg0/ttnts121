"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, Camera, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { QRValidationResponse } from "@/types/attendance";

interface QRScannerProps {
  sessionId: string;
  date: string;
  onSuccess: (childName: string) => void;
}

export function QRScanner({ sessionId, date, onSuccess }: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<QRValidationResponse | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Start scanning interval
      scanIntervalRef.current = setInterval(scanQRCode, 500);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Please ensure camera permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    setResult(null);
    setScanning(false);
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Use BarcodeDetector API if available (modern browsers)
    if ("BarcodeDetector" in window) {
      try {
        // @ts-ignore - BarcodeDetector is not in TypeScript types yet
        const barcodeDetector = new BarcodeDetector({ formats: ["qr_code"] });
        const barcodes = await barcodeDetector.detect(canvas);

        if (barcodes.length > 0) {
          await handleQRPayload(barcodes[0].rawValue);
        }
      } catch (err) {
        // Silently continue scanning
      }
    }
  };

  const handleQRPayload = async (payload: string) => {
    if (scanning) return;

    setScanning(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/attendance/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          sessionId,
          date,
          autoCheckin: true,
        }),
      });

      const data = await response.json();

      if (data.success && data.valid) {
        setResult({
          valid: true,
          bookingId: data.bookingId,
          childName: data.childName,
          alreadyCheckedIn: data.alreadyCheckedIn,
        });

        // Notify parent and close after delay
        if (data.childName) {
          setTimeout(() => {
            onSuccess(data.childName);
            setIsOpen(false);
          }, 1500);
        }
      } else {
        setResult({
          valid: false,
          error: data.error || "Invalid QR code",
        });
      }
    } catch (err) {
      setResult({
        valid: false,
        error: "Network error",
      });
    } finally {
      // Reset scanning state after delay to prevent rapid re-scans
      setTimeout(() => setScanning(false), 2000);
    }
  };

  // Manual code entry fallback
  const [manualCode, setManualCode] = useState("");

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      await handleQRPayload(manualCode.trim());
    }
  };

  return (
    <>
      <Button
        variant="adminSecondary"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <QrCode className="h-4 w-4" />
        Scan QR
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h3 className="text-lg font-semibold">Scan QR Code</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Camera view */}
            <div className="relative aspect-square bg-black">
              {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                  <AlertCircle className="h-12 w-12 mb-4 text-red-400" />
                  <p className="text-sm">{error}</p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white/50 rounded-2xl relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
                    </div>
                  </div>

                  {/* Scanning indicator */}
                  {scanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Result display */}
            {result && (
              <div
                className={`p-4 ${
                  result.valid
                    ? result.alreadyCheckedIn
                      ? "bg-amber-50 border-amber-200"
                      : "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                } border-t`}
              >
                <div className="flex items-center gap-3">
                  {result.valid ? (
                    <CheckCircle
                      className={`h-6 w-6 ${
                        result.alreadyCheckedIn ? "text-amber-500" : "text-green-500"
                      }`}
                    />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  )}
                  <div>
                    {result.valid ? (
                      <>
                        <p className="font-medium text-neutral-900">
                          {result.childName}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {result.alreadyCheckedIn
                            ? "Already checked in"
                            : "Checked in successfully"}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-red-600">{result.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Manual entry fallback */}
            <div className="p-4 border-t border-neutral-100">
              <p className="text-[13px] text-neutral-500 mb-2">
                Or enter QR code data manually:
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Paste QR code data..."
                  className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Button type="submit" variant="adminPrimary" size="sm">
                  Submit
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
