/**
 * Hermes Email Template Generator
 * Layout inspired by clean transactional email style (Alfima)
 * Color palette: warm gold/yellow on white background
 */

const getEmailTemplate = (type, data) => {
  const {
    companyName, fullName, email, phone,
    date, time, platform, meetingLink,
    adminMessage, customContent
  } = data;

  // ── Hero config per type ──────────────────────────────────────────────────
  const heroMap = {
    confirmation: {
      icon: '✓',
      title: 'Demo Booking Confirmed',
      subtitle: `Your demo session has been scheduled for <strong>${date}</strong> at <strong>${time}</strong>.`,
    },
    rejection: {
      icon: '✕',
      title: 'Booking Status Update',
      subtitle: 'Your booking request has been reviewed by our team.',
    },
    'admin-notification': {
      icon: '📋',
      title: 'New Demo Booking Request',
      subtitle: `<strong>${fullName}</strong> has submitted a demo request that requires your attention.`,
    },
    custom: {
      icon: '📩',
      title: 'Booking Update',
      subtitle: 'Please review the details below.',
    },
  };

  const hero = heroMap[type] || heroMap.custom;

  // ── Main body content ─────────────────────────────────────────────────────
  const greeting = type !== 'admin-notification'
    ? `<p class="greeting">Hi <strong>${fullName}</strong>,</p>`
    : `<p class="greeting">Hello Admin,</p>`;

  const introText = {
    confirmation: `Thank you for booking a demo with us! We've received your details and confirmed your session. You'll find everything you need below.`,
    rejection: `Thank you for your interest in Hermes. After reviewing your request, we're unfortunately unable to accommodate the selected time slot at this time.`,
    'admin-notification': `A new demo booking request has been submitted and requires your review. Client details and the requested schedule are listed below.`,
    custom: '',
  }[type] || '';

  // ── Details card rows ─────────────────────────────────────────────────────
  const row = (label, value) =>
    value
      ? `<tr>
           <td class="row-label">${label}</td>
           <td class="row-value">${value}</td>
         </tr>`
      : '';

  const confirmationCard = `
    <table class="detail-table" cellpadding="0" cellspacing="0">
      ${row('DATE', date)}
      ${row('TIME', time)}
      ${row('PLATFORM', platform === 'zoom' ? 'Zoom Meeting' : 'Google Meet')}
      ${meetingLink ? row('MEETING LINK', `<a href="${meetingLink}" class="inline-link">${meetingLink}</a>`) : ''}
    </table>
    ${meetingLink ? `<div class="btn-wrap"><a href="${meetingLink}" class="cta-btn">Join Meeting</a></div>` : ''}`;

  const rejectionCard = `
    <div class="status-badge rejected">Booking Not Confirmed</div>
    <p style="color:#6b7280;font-size:15px;margin:16px 0 0;">
      We apologize for the inconvenience. Please feel free to submit a new request for a different date or time, and we will do our best to accommodate you.
    </p>`;

  const adminCard = `
    <h3 class="card-section-title">Client Details</h3>
    <table class="detail-table" cellpadding="0" cellspacing="0">
      ${row('FULL NAME', fullName)}
      ${row('EMAIL', email)}
      ${row('COMPANY', companyName || 'Not specified')}
      ${row('PHONE', phone || 'Not provided')}
    </table>

    <h3 class="card-section-title" style="margin-top:28px;">Requested Schedule</h3>
    <table class="detail-table" cellpadding="0" cellspacing="0">
      ${row('DATE', date)}
      ${row('TIME', time)}
      ${row('PLATFORM', platform === 'zoom' ? 'Zoom Meeting' : 'Google Meet')}
    </table>

    <div class="btn-wrap">
      <a href="http://localhost:3000/Admin/Booking" class="cta-btn">Review &amp; Respond</a>
    </div>`;

  const cardContent = {
    confirmation: confirmationCard,
    rejection: rejectionCard,
    'admin-notification': adminCard,
    custom: '',
  }[type] || '';

  const adminNote = adminMessage
    ? `<div class="note-box">
         <p class="note-label">${type === 'admin-notification' ? 'Admin Notes' : 'Message from Team'}</p>
         <p class="note-body">${adminMessage}</p>
       </div>`
    : '';

  const customBlock = customContent
    ? `<div style="color:#6b7280;font-size:14px;line-height:1.7;margin-bottom:24px;">${customContent}</div>`
    : '';

  const helpSection = type !== 'admin-notification'
    ? `<div class="help-section">
         <p>If you need to reschedule or have questions, feel free to reply to this email or reach out directly.</p>
         <p>We look forward to connecting with you!</p>
       </div>`
    : '';

  // ── Full HTML ─────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${hero.title}</title>
  <style>
    /* Reset */
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: #f5f5f5;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      -webkit-font-smoothing: antialiased;
    }

    /* Wrapper */
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }

    /* Hero / Header banner */
    .hero {
      background-color: #d4a017;   /* warm gold */
      padding: 40px 48px;
      text-align: center;
    }
    .hero-icon {
      display: inline-block;
      width: 48px;
      height: 48px;
      line-height: 48px;
      border-radius: 50%;
      background: rgba(255,255,255,0.25);
      font-size: 22px;
      margin-bottom: 14px;
      color: #fff;
    }
    .hero h1 {
      font-size: 26px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.3px;
      margin-bottom: 6px;
    }
    .hero .brand {
      font-size: 13px;
      color: rgba(255,255,255,0.75);
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    /* Body */
    .body {
      padding: 40px 48px;
    }

    .greeting {
      font-size: 16px;
      color: #1f2937;
      margin-bottom: 12px;
    }

    .intro {
      font-size: 15px;
      color: #6b7280;
      line-height: 1.7;
      margin-bottom: 32px;
    }

    /* Detail table */
    .detail-table {
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
      background: #fffbf0;
      border: 1px solid #f0e0a0;
      margin-bottom: 28px;
    }
    .detail-table tr {
      border-bottom: 1px solid #f0e0a0;
    }
    .detail-table tr:last-child {
      border-bottom: none;
    }
    .row-label {
      padding: 14px 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #9ca3af;
      width: 38%;
      vertical-align: middle;
    }
    .row-value {
      padding: 14px 20px;
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      vertical-align: middle;
    }

    /* Card section titles (admin) */
    .card-section-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #9ca3af;
      margin-bottom: 12px;
    }

    /* Status badge */
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
    }
    .status-badge.rejected {
      background: #fef2f2;
      color: #dc2626;
    }

    /* CTA button */
    .btn-wrap {
      text-align: center;
      margin: 28px 0 8px;
    }
    .cta-btn {
      display: inline-block;
      background-color: #d4a017;
      color: #ffffff;
      text-decoration: none;
      padding: 13px 32px;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }

    /* Inline link */
    .inline-link {
      color: #d4a017;
      text-decoration: underline;
      font-weight: 500;
    }

    /* Admin note box */
    .note-box {
      background: #fffbf0;
      border-left: 4px solid #d4a017;
      border-radius: 4px;
      padding: 18px 20px;
      margin-bottom: 28px;
    }
    .note-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: #d4a017;
      margin-bottom: 8px;
    }
    .note-body {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.6;
    }

    /* Help section */
    .help-section {
      border-top: 1px solid #f3f4f6;
      padding-top: 24px;
      margin-top: 8px;
    }
    .help-section p {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.7;
    }

    /* Footer */
    .footer {
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
      padding: 28px 48px;
      text-align: center;
    }
    .footer-links {
      margin-bottom: 12px;
    }
    .footer-links a {
      color: #9ca3af;
      font-size: 12px;
      text-decoration: none;
      margin: 0 10px;
    }
    .footer-copy {
      font-size: 12px;
      color: #9ca3af;
    }
    .footer-copy a {
      color: #d4a017;
      text-decoration: none;
      font-weight: 500;
    }

    /* Mobile */
    @media (max-width: 620px) {
      .wrapper { margin: 0; border-radius: 0; }
      .hero, .body, .footer { padding-left: 24px; padding-right: 24px; }
      .hero h1 { font-size: 22px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- Hero Banner -->
    <div class="hero">
      <div class="hero-icon">${hero.icon}</div>
      <h1>${hero.title}</h1>
      <p class="brand">Hermes</p>
    </div>

    <!-- Body -->
    <div class="body">
      ${greeting}
      ${introText ? `<p class="intro">${introText}</p>` : ''}

      ${cardContent}
      ${adminNote}
      ${customBlock}
      ${helpSection}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Contact Us</a>
      </div>
      <p class="footer-copy">
        © 2026 <a href="#">Hermes</a>. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>`;
};

module.exports = {
  getEmailTemplate,
  getBookingConfirmationEmail: (data) => getEmailTemplate('confirmation', data),
  getBookingRejectionEmail:    (data) => getEmailTemplate('rejection', data),
  getAdminNotificationEmail:   (data) => getEmailTemplate('admin-notification', data),
  getCustomEmail:              (data) => getEmailTemplate('custom', data),
};