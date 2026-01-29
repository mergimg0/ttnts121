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
  guardianDeclaration?: {
    signature: string;
    acceptedAt: string;
  };
}): { subject: string; html: string } {
  const { parentFirstName, childFirstName, bookingRef, sessions, totalAmount, guardianDeclaration } = data;

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

  const guardianDeclarationSection = guardianDeclaration
    ? `
      <div class="highlight" style="background: #f0f9ff; border-left: 4px solid #0369a1; margin: 20px 0;">
        <p style="margin: 0 0 5px 0;"><strong>Guardian Declaration</strong></p>
        <p style="margin: 0; font-size: 13px; color: #4b5563;">
          Signed by <strong>${guardianDeclaration.signature}</strong> on ${guardianDeclaration.acceptedAt}
        </p>
      </div>
    `
    : "";

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

        ${guardianDeclarationSection}

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

// Payment failure - sent when payment is declined
export function paymentFailureEmail(data: {
  parentFirstName: string;
  childFirstName: string;
  bookingRef: string;
  sessions: Array<{
    name: string;
    dayOfWeek: string;
    startTime: string;
  }>;
  totalAmount: string;
  retryUrl: string;
  failureReason?: string;
}): { subject: string; html: string } {
  const { parentFirstName, childFirstName, bookingRef, sessions, totalAmount, retryUrl, failureReason } = data;

  const sessionsList = sessions
    .map((s) => `<li>${s.name} - ${s.dayOfWeek}, ${s.startTime}</li>`)
    .join("");

  return {
    subject: `Payment Issue - ${bookingRef}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Payment Unsuccessful</h2>
        <p>Hi ${parentFirstName},</p>
        <p>Unfortunately, we were unable to process your payment for ${childFirstName}'s booking.</p>

        <div class="highlight" style="background: #ffebee;">
          <p><strong>Booking Reference:</strong> ${bookingRef}</p>
          <p><strong>Amount:</strong> ${totalAmount}</p>
          ${failureReason ? `<p><strong>Reason:</strong> ${failureReason}</p>` : ""}
        </div>

        <h3>Sessions:</h3>
        <ul>${sessionsList}</ul>

        <p>Don't worry - your spot is still reserved! Please try again with a different payment method:</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${retryUrl}" class="button">Complete Payment</a>
        </p>

        <p>If you continue to experience issues, please get in touch and we'll help sort it out.</p>

        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Refund confirmation - sent when a refund is processed
export function refundConfirmationEmail(data: {
  parentFirstName: string;
  childFirstName: string;
  bookingRef: string;
  refundAmount: string;
  originalAmount: string;
  isPartialRefund: boolean;
  reason?: string;
}): { subject: string; html: string } {
  const { parentFirstName, childFirstName, bookingRef, refundAmount, originalAmount, isPartialRefund, reason } = data;

  return {
    subject: `Refund Processed - ${bookingRef}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Refund Confirmed</h2>
        <p>Hi ${parentFirstName},</p>
        <p>We've processed a ${isPartialRefund ? "partial " : ""}refund for ${childFirstName}'s booking.</p>

        <div class="highlight" style="background: #e3f2fd;">
          <p><strong>Booking Reference:</strong> ${bookingRef}</p>
          <p><strong>Refund Amount:</strong> ${refundAmount}</p>
          ${isPartialRefund ? `<p><strong>Original Amount:</strong> ${originalAmount}</p>` : ""}
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        </div>

        <p>The refund will be credited back to your original payment method within 5-10 business days, depending on your bank.</p>

        <p>We're sorry to see you go! If you'd like to book again in the future, we'd love to have ${childFirstName} back on the pitch.</p>

        <p>If you have any questions about this refund, please don't hesitate to get in touch.</p>

        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Cancellation confirmation - sent when a booking is cancelled by customer
export function cancellationConfirmationEmail(data: {
  parentName: string;
  childNames: string[];
  sessionName: string;
  sessionDate: Date | string;
  refundAmount?: number; // in pence
  refundPercentage?: number;
  refundExplanation?: string;
}): string {
  const { parentName, childNames, sessionName, sessionDate: rawSessionDate, refundAmount, refundPercentage, refundExplanation } = data;

  // Format session date
  const sessionDate = rawSessionDate instanceof Date
    ? rawSessionDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : rawSessionDate;

  const childrenList = childNames.join(", ");
  const formattedRefund = refundAmount ? `£${(refundAmount / 100).toFixed(2)}` : null;

  const refundSection = refundAmount && refundAmount > 0
    ? `
      <div class="highlight" style="background: #e3f2fd;">
        <p><strong>Refund Amount:</strong> ${formattedRefund}${refundPercentage ? ` (${refundPercentage}% refund)` : ""}</p>
        ${refundExplanation ? `<p style="font-size: 13px; color: #666;">${refundExplanation}</p>` : ""}
        <p style="font-size: 13px; color: #666;">The refund will be credited to your original payment method within 5-10 business days.</p>
      </div>
    `
    : `
      <div class="highlight" style="background: #fff3cd;">
        <p><strong>Refund:</strong> ${refundExplanation || "Not eligible for refund based on cancellation policy."}</p>
      </div>
    `;

  return wrapTemplate(`
    <div class="content">
      <h2>Cancellation Confirmed</h2>
      <p>Hi ${parentName},</p>
      <p>We've received your cancellation request and your booking has been cancelled.</p>

      <div class="highlight">
        <p><strong>Session:</strong> ${sessionName}</p>
        <p><strong>Date:</strong> ${sessionDate}</p>
        <p><strong>Player(s):</strong> ${childrenList}</p>
      </div>

      ${refundSection}

      <p>We're sorry to see you go! If your plans change, we'd love to have ${childrenList} back on the pitch. Feel free to book again anytime.</p>

      <p>If you have any questions about this cancellation, please don't hesitate to get in touch.</p>

      <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
    </div>
  `);
}

// Checkout abandoned - sent when checkout session expires
export function checkoutAbandonedEmail(data: {
  parentFirstName: string;
  childFirstName: string;
  sessions: Array<{
    name: string;
    dayOfWeek: string;
  }>;
  totalAmount: string;
  checkoutUrl: string;
}): { subject: string; html: string } {
  const { parentFirstName, childFirstName, sessions, totalAmount, checkoutUrl } = data;

  const sessionsList = sessions
    .map((s) => `<li>${s.name} - ${s.dayOfWeek}</li>`)
    .join("");

  return {
    subject: `Complete Your Booking for ${childFirstName}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Finish Your Booking</h2>
        <p>Hi ${parentFirstName},</p>
        <p>We noticed you didn't complete your booking for ${childFirstName}. No worries - we've saved your spot!</p>

        <div class="highlight">
          <p><strong>Sessions:</strong></p>
          <ul>${sessionsList}</ul>
          <p><strong>Total:</strong> ${totalAmount}</p>
        </div>

        <p>Spots are filling up fast. Complete your booking now to secure ${childFirstName}'s place:</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${checkoutUrl}" class="button">Complete Booking</a>
        </p>

        <p>If you had any issues during checkout or have questions, just reply to this email and we'll help you out.</p>

        <p>See you on the pitch!</p>
        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Welcome email - sent when a new user registers
export function welcomeEmail(data: {
  firstName: string;
  verificationLink: string;
}): { subject: string; html: string } {
  const { firstName, verificationLink } = data;

  return {
    subject: `Welcome to ${SITE_CONFIG.shortName}!`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Welcome to ${SITE_CONFIG.shortName}!</h2>
        <p>Hi ${firstName},</p>
        <p>Thanks for creating an account with us! We're excited to have you join our football family.</p>

        <p>To get started, please verify your email address by clicking the button below:</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" class="button">Verify Email</a>
        </p>

        <p>Once verified, you'll be able to:</p>
        <ul>
          <li>Book sessions for your children</li>
          <li>Manage your bookings online</li>
          <li>Save your children's details for faster booking</li>
          <li>View your booking history</li>
        </ul>

        <p>If you didn't create this account, you can safely ignore this email.</p>

        <p>See you on the pitch!</p>
        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Password reset email - sent when a user requests a password reset
export function passwordResetEmail(data: {
  firstName: string;
  resetLink: string;
}): { subject: string; html: string } {
  const { firstName, resetLink } = data;

  return {
    subject: `Reset your ${SITE_CONFIG.shortName} password`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Reset Your Password</h2>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your password. Click the button below to choose a new one:</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" class="button">Reset Password</a>
        </p>

        <p>This link will expire in 1 hour for security reasons.</p>

        <p>If you didn't request this password reset, you can safely ignore this email. Your password won't be changed.</p>

        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Email verification reminder - sent to remind users to verify their email
export function emailVerificationReminderEmail(data: {
  firstName: string;
  verificationLink: string;
}): { subject: string; html: string } {
  const { firstName, verificationLink } = data;

  return {
    subject: `Please verify your ${SITE_CONFIG.shortName} email`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Verify Your Email</h2>
        <p>Hi ${firstName},</p>
        <p>We noticed you haven't verified your email address yet. Please verify to unlock all features:</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" class="button">Verify Email</a>
        </p>

        <p>Verifying your email helps us keep your account secure and ensures you receive important updates about your bookings.</p>

        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Payment link email - sent when admin creates a custom payment link
export function paymentLinkEmail(data: {
  customerEmail: string;
  customerName: string;
  amount: number; // in pence
  description: string;
  paymentLinkUrl: string;
  expiryDate: string;
}): { subject: string; html: string } {
  const { customerName, amount, description, paymentLinkUrl, expiryDate } = data;

  // Format amount from pence to pounds
  const formattedAmount = `£${(amount / 100).toFixed(2)}`;

  return {
    subject: `Payment Request - ${description}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Payment Request</h2>
        <p>Hi ${customerName},</p>
        <p>We've created a secure payment link for you:</p>

        <div class="highlight">
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Amount:</strong> ${formattedAmount}</p>
        </div>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${paymentLinkUrl}" class="button">Pay Now</a>
        </p>

        <p><strong>Important:</strong> This payment link will expire on <strong>${expiryDate}</strong>. Please complete your payment before then.</p>

        <p>If you have any questions about this payment, please don't hesitate to get in touch.</p>

        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Payment received confirmation - sent when a manual payment is recorded
export function manualPaymentReceivedEmail(data: {
  customerName: string;
  amount: number; // in pence
  method: 'cash' | 'bank_transfer';
  bookingRef: string;
  childFirstName: string;
  sessionName?: string;
}): { subject: string; html: string } {
  const { customerName, amount, method, bookingRef, childFirstName, sessionName } = data;

  const formattedAmount = `£${(amount / 100).toFixed(2)}`;
  const methodDisplay = method === 'cash' ? 'Cash' : 'Bank Transfer';

  return {
    subject: `Payment Received - ${bookingRef}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Payment Received</h2>
        <p>Hi ${customerName},</p>
        <p>We've received your payment for ${childFirstName}'s booking. Thank you!</p>

        <div class="highlight" style="background: #e8f5e9;">
          <p><strong>Booking Reference:</strong> ${bookingRef}</p>
          ${sessionName ? `<p><strong>Session:</strong> ${sessionName}</p>` : ''}
          <p><strong>Amount:</strong> ${formattedAmount}</p>
          <p><strong>Payment Method:</strong> ${methodDisplay}</p>
        </div>

        <p>Your booking is now confirmed. We look forward to seeing ${childFirstName} on the pitch!</p>

        <h3>What to Bring:</h3>
        <ul>
          <li>Football boots or trainers</li>
          <li>Shin pads (recommended)</li>
          <li>Water bottle</li>
          <li>Weather-appropriate clothing</li>
        </ul>

        <p>If you have any questions, please get in touch.</p>

        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Cart abandonment recovery - sent when cart is abandoned (1 hour after last update)
export function cartAbandonmentRecoveryEmail(data: {
  customerName?: string;
  items: Array<{
    sessionName: string;
    programName: string;
    dayOfWeek: string;
    startTime: string;
    price: string;
  }>;
  totalAmount: string;
  recoveryLink: string;
  expiresAt: string;
}): { subject: string; html: string } {
  const { customerName, items, totalAmount, recoveryLink, expiresAt } = data;

  const greeting = customerName ? `Hi ${customerName}` : "Hi there";

  const itemsList = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${item.sessionName}</strong><br>
          <span style="color: #666; font-size: 13px;">${item.programName}</span><br>
          <span style="color: #666; font-size: 13px;">${item.dayOfWeek} at ${item.startTime}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
          ${item.price}
        </td>
      </tr>
    `
    )
    .join("");

  return {
    subject: `Don't forget your football sessions!`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Your Cart is Waiting!</h2>
        <p>${greeting},</p>
        <p>We noticed you left some sessions in your cart. Don't miss out - spaces fill up fast!</p>

        <div style="margin: 25px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Session</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr style="background: #f5f5f5;">
                <td style="padding: 12px; font-weight: bold;">Total</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">${totalAmount}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${recoveryLink}" class="button">Complete Your Booking</a>
        </p>

        <div class="highlight" style="background: #fff3cd; border-left: 4px solid #ffc107;">
          <p style="margin: 0;"><strong>Act fast!</strong> This link expires on <strong>${expiresAt}</strong>. After that, you'll need to add the sessions to your cart again.</p>
        </div>

        <p>If you have any questions about our sessions or need help booking, just reply to this email - we're happy to help!</p>

        <p>See you on the pitch!</p>
        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Booking confirmation with QR code - sent after successful payment
export function bookingConfirmationWithQREmail(data: {
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
  qrCodeDataUrl: string;
  guardianDeclaration?: {
    signature: string;
    acceptedAt: string;
  };
}): { subject: string; html: string } {
  const { parentFirstName, childFirstName, bookingRef, sessions, totalAmount, qrCodeDataUrl, guardianDeclaration } = data;

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

  const guardianDeclarationSection = guardianDeclaration
    ? `
      <div class="highlight" style="background: #f0f9ff; border-left: 4px solid #0369a1; margin: 20px 0;">
        <p style="margin: 0 0 5px 0;"><strong>Guardian Declaration</strong></p>
        <p style="margin: 0; font-size: 13px; color: #4b5563;">
          Signed by <strong>${guardianDeclaration.signature}</strong> on ${guardianDeclaration.acceptedAt}
        </p>
      </div>
    `
    : "";

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

        ${guardianDeclarationSection}

        <h3>Your Check-in QR Code</h3>
        <p>Show this QR code when you arrive for quick check-in:</p>
        <div style="text-align: center; margin: 20px 0; padding: 20px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;">
          <img src="${qrCodeDataUrl}" alt="Check-in QR Code" style="width: 200px; height: 200px;" />
          <p style="margin-top: 10px; font-size: 12px; color: #666;">Save or screenshot this QR code for easy access</p>
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

// Transfer confirmation email - sent when a booking is transferred to a new session
export function transferConfirmationEmail(data: {
  parentFirstName: string;
  childFirstName: string;
  bookingRef: string;
  oldSession: {
    name: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    location: string;
    price: string;
  };
  newSession: {
    name: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    location: string;
    price: string;
  };
  priceDifference?: string; // e.g., "£10.00 charged" or "£5.00 refunded"
}): { subject: string; html: string } {
  const { parentFirstName, childFirstName, bookingRef, oldSession, newSession, priceDifference } = data;

  const priceAdjustmentSection = priceDifference
    ? `
      <div class="highlight" style="background: #e3f2fd; border-left: 4px solid #2196f3; margin: 20px 0;">
        <p style="margin: 0;"><strong>Price Adjustment:</strong> ${priceDifference}</p>
      </div>
    `
    : "";

  return {
    subject: `Session Transfer Confirmed - ${bookingRef}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Transfer Confirmed!</h2>
        <p>Hi ${parentFirstName},</p>
        <p>Great news! ${childFirstName}'s session transfer has been completed successfully.</p>

        <div class="highlight" style="background: #e8f5e9;">
          <p><strong>Booking Reference:</strong> ${bookingRef}</p>
        </div>

        <h3>Previous Session (Cancelled)</h3>
        <div class="highlight" style="background: #ffebee; border-left: 4px solid #ef5350;">
          <p><strong>${oldSession.name}</strong></p>
          <p>${oldSession.dayOfWeek}, ${oldSession.startTime} - ${oldSession.endTime}</p>
          <p>Location: ${oldSession.location}</p>
          <p>Price: ${oldSession.price}</p>
        </div>

        <h3>New Session</h3>
        <div class="highlight" style="background: #e8f5e9; border-left: 4px solid #4caf50;">
          <p><strong>${newSession.name}</strong></p>
          <p>${newSession.dayOfWeek}, ${newSession.startTime} - ${newSession.endTime}</p>
          <p>Location: ${newSession.location}</p>
          <p>Price: ${newSession.price}</p>
        </div>

        ${priceAdjustmentSection}

        <h3>What to Bring:</h3>
        <ul>
          <li>Football boots or trainers</li>
          <li>Shin pads (recommended)</li>
          <li>Water bottle</li>
          <li>Weather-appropriate clothing</li>
        </ul>

        <p>If you have any questions about your transfer, please don't hesitate to get in touch.</p>

        <p>See you on the pitch!</p>
        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Scheduled report email - sent when automated report is generated
export function scheduledReportEmail(data: {
  reportName: string;
  reportType: string;
  dateRange: string;
  rowCount: number;
  filename: string;
  generatedAt: string;
}): { subject: string; html: string } {
  const { reportName, reportType, dateRange, rowCount, filename, generatedAt } = data;

  const reportTypeDisplay: Record<string, string> = {
    bookings: "Bookings",
    attendance: "Attendance",
    revenue: "Revenue",
    sessions: "Sessions",
  };

  return {
    subject: `Scheduled Report: ${reportName}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Your Scheduled Report</h2>
        <p>Hi,</p>
        <p>Your scheduled report has been generated and is attached to this email.</p>

        <div class="highlight">
          <p><strong>Report Name:</strong> ${reportName}</p>
          <p><strong>Report Type:</strong> ${reportTypeDisplay[reportType] || reportType}</p>
          <p><strong>Date Range:</strong> ${dateRange}</p>
          <p><strong>Records:</strong> ${rowCount} row${rowCount !== 1 ? "s" : ""}</p>
          <p><strong>Generated:</strong> ${generatedAt}</p>
        </div>

        <p>The report is attached as <strong>${filename}</strong>.</p>

        <p>If you have any questions about this report or need to adjust the schedule, please log in to the admin dashboard.</p>

        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// QR code resend email - sent when admin resends QR codes
export function qrCodeResendEmail(data: {
  parentFirstName: string;
  childFirstName: string;
  bookingRef: string;
  sessionName: string;
  qrCodeDataUrl: string;
}): { subject: string; html: string } {
  const { parentFirstName, childFirstName, bookingRef, sessionName, qrCodeDataUrl } = data;

  return {
    subject: `Your QR Code - ${bookingRef}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Your Check-in QR Code</h2>
        <p>Hi ${parentFirstName},</p>
        <p>As requested, here is ${childFirstName}'s check-in QR code for:</p>

        <div class="highlight">
          <p><strong>Session:</strong> ${sessionName}</p>
          <p><strong>Booking Reference:</strong> ${bookingRef}</p>
        </div>

        <div style="text-align: center; margin: 20px 0; padding: 20px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;">
          <img src="${qrCodeDataUrl}" alt="Check-in QR Code" style="width: 200px; height: 200px;" />
          <p style="margin-top: 10px; font-size: 12px; color: #666;">Save or screenshot this QR code</p>
        </div>

        <p>Show this QR code when you arrive for quick check-in.</p>

        <p>See you on the pitch!</p>
        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}

// Deposit confirmation email - sent when a deposit payment is completed
export function depositConfirmationEmail(data: {
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
  depositAmount: string;
  balanceDue: string;
  balanceDueDate: string;
  payBalanceUrl: string;
}): { subject: string; html: string } {
  const {
    parentFirstName,
    childFirstName,
    bookingRef,
    sessions,
    depositAmount,
    balanceDue,
    balanceDueDate,
    payBalanceUrl,
  } = data;

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
    subject: `Deposit Received - ${bookingRef}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Deposit Confirmed!</h2>
        <p>Hi ${parentFirstName},</p>
        <p>Great news! We've received your deposit for ${childFirstName}'s booking. Your spot is now secured!</p>

        <div class="highlight" style="background: #e8f5e9;">
          <p><strong>Booking Reference:</strong> ${bookingRef}</p>
          <p><strong>Deposit Paid:</strong> ${depositAmount}</p>
        </div>

        <h3>Session Details:</h3>
        ${sessionsList}

        <div class="highlight" style="background: #fff3cd; border-left: 4px solid #ffc107;">
          <p style="margin: 0 0 10px 0;"><strong>Balance Due</strong></p>
          <p style="margin: 0;"><strong>Amount:</strong> ${balanceDue}</p>
          <p style="margin: 0;"><strong>Due Date:</strong> ${balanceDueDate}</p>
        </div>

        <p>Please complete your payment before the due date to avoid losing your spot.</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${payBalanceUrl}" class="button">Pay Balance Now</a>
        </p>

        <p>We'll send you a reminder before the due date.</p>

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

// Balance paid confirmation email - sent when the remaining balance is paid
export function balancePaidConfirmationEmail(data: {
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
  qrCodeDataUrl?: string;
}): { subject: string; html: string } {
  const { parentFirstName, childFirstName, bookingRef, sessions, totalAmount, qrCodeDataUrl } = data;

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

  const qrCodeSection = qrCodeDataUrl
    ? `
      <h3>Your Check-in QR Code</h3>
      <p>Show this QR code when you arrive for quick check-in:</p>
      <div style="text-align: center; margin: 20px 0; padding: 20px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;">
        <img src="${qrCodeDataUrl}" alt="Check-in QR Code" style="width: 200px; height: 200px;" />
        <p style="margin-top: 10px; font-size: 12px; color: #666;">Save or screenshot this QR code for easy access</p>
      </div>
    `
    : "";

  return {
    subject: `Payment Complete - ${bookingRef}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Payment Complete!</h2>
        <p>Hi ${parentFirstName},</p>
        <p>Excellent! Your full payment for ${childFirstName}'s booking has been completed. You're all set!</p>

        <div class="highlight" style="background: #e8f5e9;">
          <p><strong>Booking Reference:</strong> ${bookingRef}</p>
          <p><strong>Total Paid:</strong> ${totalAmount}</p>
          <p><strong>Status:</strong> Fully Paid</p>
        </div>

        ${qrCodeSection}

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

// Balance reminder email - sent when balance due date is approaching
export function balanceReminderEmail(data: {
  parentFirstName: string;
  childFirstName: string;
  bookingRef: string;
  sessions: Array<{
    name: string;
    dayOfWeek: string;
  }>;
  balanceDue: string;
  balanceDueDate: string;
  daysUntilDue: number;
  payBalanceUrl: string;
}): { subject: string; html: string } {
  const {
    parentFirstName,
    childFirstName,
    bookingRef,
    sessions,
    balanceDue,
    balanceDueDate,
    daysUntilDue,
    payBalanceUrl,
  } = data;

  const sessionsList = sessions
    .map((s) => `<li>${s.name} - ${s.dayOfWeek}</li>`)
    .join("");

  const urgencyText = daysUntilDue <= 1
    ? "Your balance is due tomorrow!"
    : daysUntilDue <= 3
      ? `Your balance is due in ${daysUntilDue} days!`
      : `Your balance is due on ${balanceDueDate}.`;

  const urgencyStyle = daysUntilDue <= 3
    ? "background: #ffebee; border-left: 4px solid #f44336;"
    : "background: #fff3cd; border-left: 4px solid #ffc107;";

  return {
    subject: daysUntilDue <= 3
      ? `REMINDER: Balance Due Soon - ${bookingRef}`
      : `Balance Reminder - ${bookingRef}`,
    html: wrapTemplate(`
      <div class="content">
        <h2>Balance Payment Reminder</h2>
        <p>Hi ${parentFirstName},</p>
        <p>This is a friendly reminder about the outstanding balance for ${childFirstName}'s booking.</p>

        <div class="highlight" style="${urgencyStyle}">
          <p style="margin: 0 0 10px 0;"><strong>${urgencyText}</strong></p>
          <p style="margin: 0;"><strong>Balance Due:</strong> ${balanceDue}</p>
          <p style="margin: 0;"><strong>Due Date:</strong> ${balanceDueDate}</p>
        </div>

        <div class="highlight">
          <p><strong>Booking Reference:</strong> ${bookingRef}</p>
          <p><strong>Sessions:</strong></p>
          <ul style="margin: 5px 0 0 0; padding-left: 20px;">${sessionsList}</ul>
        </div>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${payBalanceUrl}" class="button">Pay Balance Now</a>
        </p>

        <p><strong>Important:</strong> Please complete your payment by ${balanceDueDate} to keep your spot. If you're having trouble with payment, please get in touch and we'll do our best to help.</p>

        <p>See you on the pitch!</p>
        <p><strong>The ${SITE_CONFIG.shortName} Team</strong></p>
      </div>
    `),
  };
}
