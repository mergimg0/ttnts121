"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, RefreshCw, Loader2 } from "lucide-react";

interface QRCodeDisplayProps {
  bookingId: string;
  childName?: string;
  childIndex?: number;
  showControls?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

interface QRCodeData {
  bookingId: string;
  sessionId: string;
  childName: string;
  validDate: string;
  qrCodeDataUrl: string;
}

export function QRCodeDisplay({
  bookingId,
  childName,
  childIndex = 0,
  showControls = true,
  size = "md",
  className = "",
}: QRCodeDisplayProps) {
  const [qrData, setQRData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-64 h-64",
  };

  useEffect(() => {
    fetchQRCode();
  }, [bookingId, childIndex]);

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/bookings/${bookingId}/qr-code?childIndex=${childIndex}&format=json`
      );
      const data = await response.json();

      if (data.success) {
        setQRData(data.data);
      } else {
        setError(data.error || "Failed to load QR code");
      }
    } catch (err) {
      setError("Failed to load QR code");
      console.error("Error fetching QR code:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrData?.qrCodeDataUrl) return;

    const link = document.createElement("a");
    link.href = qrData.qrCodeDataUrl;
    link.download = `qr-code-${qrData.childName.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!qrData?.qrCodeDataUrl) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${qrData.childName}</title>
        <style>
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .container {
            text-align: center;
            padding: 20px;
          }
          img {
            width: 300px;
            height: 300px;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 10px;
          }
          p {
            color: #666;
            margin: 5px 0;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>TTNTS121</h1>
          <img src="${qrData.qrCodeDataUrl}" alt="QR Code" />
          <h2>${qrData.childName}</h2>
          <p>Booking: ${qrData.bookingId.slice(0, 8).toUpperCase()}</p>
          <p>Valid: ${qrData.validDate}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 ${sizeClasses[size]} ${className}`}>
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchQRCode}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!qrData) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
        <img
          src={qrData.qrCodeDataUrl}
          alt={`QR Code for ${qrData.childName}`}
          className={sizeClasses[size]}
        />
      </div>

      {childName && (
        <p className="text-sm font-medium text-neutral-700">{childName}</p>
      )}

      {showControls && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      )}
    </div>
  );
}

// Compact version for admin lists
export function QRCodeThumbnail({
  bookingId,
  onClick,
}: {
  bookingId: string;
  onClick?: () => void;
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}/qr-code?format=json`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setQrUrl(data.data.qrCodeDataUrl);
        }
      })
      .catch(console.error);
  }, [bookingId]);

  if (!qrUrl) {
    return (
      <div className="w-10 h-10 bg-neutral-100 rounded animate-pulse" />
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded border border-neutral-200 overflow-hidden hover:ring-2 hover:ring-neutral-300 transition-all"
    >
      <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
    </button>
  );
}
