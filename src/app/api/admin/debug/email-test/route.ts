import { NextRequest, NextResponse } from "next/server";
import { SITE_CONFIG } from "@/lib/constants";
import { verifySuperAdmin } from "@/lib/admin-auth";

// POST - Send a test email
// SECURITY: Only available in development AND requires super-admin auth
export async function POST(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Debug endpoints disabled in production" },
      { status: 403 }
    );
  }

  // Require super-admin authentication
  const auth = await verifySuperAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({
        success: false,
        message: "Email address is required",
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: "RESEND_API_KEY is not configured",
      });
    }

    // Use Resend's test domain if no verified domain is set
    const fromEmail =
      process.env.EMAIL_FROM || "TTNTS <onboarding@resend.dev>";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
    .content { padding: 30px; background: #fff; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background: #f5f5f5; }
    .success { background: #e8f5e9; padding: 20px; border-radius: 8px; text-align: center; }
    .success h2 { color: #2e7d32; margin: 0 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${SITE_CONFIG.shortName}</h1>
    </div>
    <div class="content">
      <div class="success">
        <h2>Email Test Successful!</h2>
        <p>If you're reading this, your email configuration is working correctly.</p>
      </div>
      <p style="margin-top: 20px; text-align: center; color: #666;">
        Sent at: ${new Date().toISOString()}
      </p>
    </div>
    <div class="footer">
      <p>${SITE_CONFIG.name}</p>
      <p>This is a test email from the admin debug panel.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: `[TEST] ${SITE_CONFIG.shortName} Email Configuration Test`,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: data.message || "Failed to send test email",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
      emailId: data.id,
    });
  } catch (error) {
    console.error("Email test failed:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to send test email",
    });
  }
}
