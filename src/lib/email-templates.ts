// Email templates for the booking system
import { SITE_CONFIG } from "./constants";

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: #000; color: #fff; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
  .content { padding: 30px; background: #fff; }
  .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background: #f5f5f5; }
  .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff !important; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
  .highlight { background: #f5f5f5; padding: 15px; margin: 20px 0; }
  .highlight p { margin: 5px 0; }
`;

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${SITE_CONFIG.shortName}</h1>
    </div>
    ${content}
    <div class="footer">
      <p>${SITE_CONFIG.name}</p>
      <p>Email: ${SITE_CONFIG.email} | Phone: ${SITE_CONFIG.phone}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Waitlist confirmation - sent when someone joins the waitlist
export function waitlistConfirmationEmail(data: {
  parentFirstName: string;
  childFirstName: string;
  sessionName: string;
  position: number;
}): { subject: string; html: string } {
  const { parentFirstName, childFirstName, sessionName, position } = data;

  return {
    subject: `You're on the Waitlist - ${sessionName}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Hi ${parentFirstName},</h2>
        <p>Thanks for joining the waitlist! We've added ${childFirstName} to the waitlist for:</p>

        <div class="highlight">
          <p><strong>Session:</strong> ${sessionName}</p>
          <p><strong>Position:</strong> #${position}</p>
        </div>

        <p>We'll email you as soon as a spot becomes available. Spots are offered on a first-come, first-served basis, so keep an eye on your inbox!</p>

        <p>If you have any questions, don't hesitate to get in touch.</p>

        <p>See you on the pitch soon!</p>
        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Waitlist spot available - sent when a spot opens up
export function waitlistSpotAvailableEmail(data: {
  parentFirstName: string;
  childFirstName: string;
  sessionName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  price: string;
  bookingUrl: string;
  expiresAt: string;
}): { subject: string; html: string } {
  const {
    parentFirstName,
    childFirstName,
    sessionName,
    dayOfWeek,
    startTime,
    endTime,
    price,
    bookingUrl,
    expiresAt,
  } = data;

  return {
    subject: `SPOT AVAILABLE - ${sessionName}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Great news, ${parentFirstName}!</h2>
        <p>A spot has opened up for ${childFirstName} in:</p>

        <div class="highlight">
          <p><strong>Session:</strong> ${sessionName}</p>
          <p><strong>Day:</strong> ${dayOfWeek}</p>
          <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
          <p><strong>Price:</strong> ${price}</p>
        </div>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" class="button">Book Now</a>
        </p>

        <p><strong>Important:</strong> This spot is reserved for you until <strong>${expiresAt}</strong>. After that, it will be offered to the next person on the waitlist.</p>

        <p>Don't miss out - secure your spot today!</p>

        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Booking confirmation - sent after successful payment
export function bookingConfirmationEmail(data: {
  parentFirstName: string;
  childFirstName: string;
  bookingRef: string;
  sessions: Array<{
    name: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    location: string;
  }>;
  totalAmount: string;
}): { subject: string; html: string } {
  const { parentFirstName, childFirstName, bookingRef, sessions, totalAmount } = data;

  const sessionsList = sessions
    .map(
      (s) => `
      <div class="highlight">
        <p><strong>${s.name}</strong></p>
        <p>${s.dayOfWeek}, ${s.startTime} - ${s.endTime}</p>
        <p>Location: ${s.location}</p>
      </div>
    `
    )
    .join("");

  return {
    subject: `Booking Confirmed - ${bookingRef}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Booking Confirmed!</h2>
        <p>Hi ${parentFirstName},</p>
        <p>Great news! ${childFirstName}'s booking has been confirmed.</p>

        <div class="highlight" style="background: #e8f5e9;">
          <p><strong>Booking Reference:</strong> ${bookingRef}</p>
          <p><strong>Total Paid:</strong> ${totalAmount}</p>
        </div>

        <h3>Session Details:</h3>
        ${sessionsList}

        <h3>What to Bring:</h3>
        <ul>
          <li>Football boots or trainers</li>
          <li>Shin pads (recommended)</li>
          <li>Water bottle</li>
          <li>Weather-appropriate clothing</li>
        </ul>

        <p>If you need to make any changes or have questions, please get in touch.</p>

        <p>See you on the pitch!</p>
        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Session reminder - sent 24 hours before session
export function sessionReminderEmail(data: {
  parentFirstName: string;
  childFirstName: string;
  sessionName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  address: string;
}): { subject: string; html: string } {
  const { parentFirstName, childFirstName, sessionName, date, startTime, endTime, location, address } = data;

  return {
    subject: `Reminder: ${sessionName} Tomorrow`,
    html: wrapTemplate(`
      <div class="content">
        <h2>See You Tomorrow!</h2>
        <p>Hi ${parentFirstName},</p>
        <p>Just a quick reminder that ${childFirstName} has a session tomorrow:</p>

        <div class="highlight">
          <p><strong>Session:</strong> ${sessionName}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Address:</strong> ${address}</p>
        </div>

        <h3>Don't Forget:</h3>
        <ul>
          <li>Football boots or trainers</li>
          <li>Shin pads</li>
          <li>Water bottle</li>
          <li>Weather-appropriate clothing</li>
        </ul>

        <p>See you there!</p>
        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}
