import { SITE_CONFIG } from "@/lib/constants";

interface SessionReminderData {
  childFirstName: string;
  parentFirstName: string;
  sessionName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
  sessionDate: string;
}

export function generateSessionReminderEmail(data: SessionReminderData): string {
  const {
    childFirstName,
    parentFirstName,
    sessionName,
    dayOfWeek,
    startTime,
    endTime,
    location,
    sessionDate,
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #000; padding: 30px; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px;">
      TAKE THE NEXT STEP 121
    </h1>
  </div>

  <div style="padding: 30px; background-color: #f9f9f9;">
    <h2 style="color: #000; margin-top: 0; font-weight: 800;">
      Reminder: ${childFirstName}'s Session Tomorrow!
    </h2>

    <p>Hi ${parentFirstName},</p>

    <p>
      This is a friendly reminder that <strong>${childFirstName}</strong> has a football coaching session tomorrow!
    </p>

    <div style="background-color: #fff; border: 2px solid #000; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #000; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">
        Session Details
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; width: 120px;">Session:</td>
          <td style="padding: 8px 0; font-weight: 600;">${sessionName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date:</td>
          <td style="padding: 8px 0; font-weight: 600;">${sessionDate} (${dayOfWeek})</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Time:</td>
          <td style="padding: 8px 0; font-weight: 600;">${startTime} - ${endTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Location:</td>
          <td style="padding: 8px 0; font-weight: 600;">${location}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
      <strong style="color: #92400e;">What to bring:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #92400e;">
        <li>Football boots or trainers</li>
        <li>Shin pads</li>
        <li>Water bottle</li>
        <li>Weather-appropriate clothing</li>
      </ul>
    </div>

    <p>
      If you need to make any changes or have questions, please contact us at
      <a href="mailto:${SITE_CONFIG.email}" style="color: #000; font-weight: 600;">${SITE_CONFIG.email}</a>
      or call <a href="tel:${SITE_CONFIG.phone}" style="color: #000; font-weight: 600;">${SITE_CONFIG.phone}</a>.
    </p>

    <p>We look forward to seeing ${childFirstName} tomorrow!</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>The Take The Next Step 121 Team</strong>
    </p>
  </div>

  <div style="padding: 20px; background-color: #000; text-align: center;">
    <p style="color: #999; margin: 0; font-size: 12px;">
      ${SITE_CONFIG.name}<br>
      Luton, Bedfordshire
    </p>
  </div>
</body>
</html>
  `.trim();
}
