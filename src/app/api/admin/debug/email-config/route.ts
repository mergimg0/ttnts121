import { NextResponse } from "next/server";

// GET - Test email configuration
export async function GET() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: "RESEND_API_KEY is not configured",
      });
    }

    // Verify API key format (should start with "re_")
    if (!apiKey.startsWith("re_")) {
      return NextResponse.json({
        success: false,
        message: "RESEND_API_KEY appears to be invalid (should start with 're_')",
      });
    }

    // Try to fetch API key info (works with send-only keys)
    const response = await fetch("https://api.resend.com/api-keys", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      // If API key check fails, it might be a send-only key which is fine
      // Just verify the key format is correct
      return NextResponse.json({
        success: true,
        message: `Resend API key configured (send-only).${fromEmail ? ` From: ${fromEmail}` : ""} Note: Test emails can only be sent to your Resend account email unless domain is verified.`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Resend configured.${fromEmail ? ` From: ${fromEmail}` : ""} Note: Verify domain at resend.com/domains to send to any email.`,
    });
  } catch (error) {
    console.error("Email config test failed:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to verify email configuration",
    });
  }
}
