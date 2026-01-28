import QRCode from 'qrcode';

export interface QRCodeData {
  bookingId: string;
  sessionId: string;
  childName: string;
  validDate: string;
}

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
}

const DEFAULT_OPTIONS: QRCodeOptions = {
  width: 300,
  margin: 2,
  errorCorrectionLevel: 'M',
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
};

/**
 * Generate a QR code as a base64 data URL
 * @param data - The QR code payload data
 * @param options - Optional customization options
 * @returns Base64 encoded data URL of the QR code image
 */
export async function generateBookingQRCode(
  data: QRCodeData,
  options: QRCodeOptions = {}
): Promise<string> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const payload = JSON.stringify(data);

  return await QRCode.toDataURL(payload, {
    errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    margin: mergedOptions.margin,
    width: mergedOptions.width,
    color: mergedOptions.color,
  });
}

/**
 * Generate a QR code as a PNG buffer
 * @param data - The QR code payload data
 * @param options - Optional customization options
 * @returns Buffer containing PNG image data
 */
export async function generateBookingQRCodeBuffer(
  data: QRCodeData,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const payload = JSON.stringify(data);

  return await QRCode.toBuffer(payload, {
    errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    margin: mergedOptions.margin,
    width: mergedOptions.width,
    color: mergedOptions.color,
    type: 'png',
  });
}

/**
 * Parse QR code payload back to structured data
 * @param payload - JSON string from QR code
 * @returns Parsed QRCodeData object
 * @throws Error if payload is not valid JSON or missing required fields
 */
export function parseQRCodeData(payload: string): QRCodeData {
  try {
    const data = JSON.parse(payload);

    // Validate required fields
    if (!data.bookingId || !data.sessionId || !data.childName || !data.validDate) {
      throw new Error('Missing required fields in QR code data');
    }

    return {
      bookingId: data.bookingId,
      sessionId: data.sessionId,
      childName: data.childName,
      validDate: data.validDate,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid QR code data: not valid JSON');
    }
    throw error;
  }
}

/**
 * Generate QR codes for all children in a booking
 * @param bookingId - The booking ID
 * @param sessionId - The session ID
 * @param children - Array of child names
 * @param validDate - The valid date for the booking (ISO string)
 * @returns Array of QR code data URLs with child info
 */
export async function generateBookingQRCodesForChildren(
  bookingId: string,
  sessionId: string,
  children: string[],
  validDate: string
): Promise<Array<{ childName: string; qrCodeDataUrl: string }>> {
  const results: Array<{ childName: string; qrCodeDataUrl: string }> = [];

  for (const childName of children) {
    const qrData: QRCodeData = {
      bookingId,
      sessionId,
      childName,
      validDate,
    };

    const qrCodeDataUrl = await generateBookingQRCode(qrData);
    results.push({ childName, qrCodeDataUrl });
  }

  return results;
}

/**
 * Validate that a QR code payload is valid for a specific booking
 * @param payload - The QR code payload string
 * @param expectedBookingId - The expected booking ID
 * @param expectedSessionId - The expected session ID (optional)
 * @returns True if valid, false otherwise
 */
export function validateQRCodeForBooking(
  payload: string,
  expectedBookingId: string,
  expectedSessionId?: string
): boolean {
  try {
    const data = parseQRCodeData(payload);

    if (data.bookingId !== expectedBookingId) {
      return false;
    }

    if (expectedSessionId && data.sessionId !== expectedSessionId) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
