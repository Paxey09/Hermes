const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();

const express = require('express');
const router = express.Router();
const axios = require('axios');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { supabase } = require('../config/supabase');

// ─── GENERATE ICS CONTENT ────────────────────────────────────────
function generateICS({ summary, description, location, startDateTime, endDateTime, organizer_email, attendee_email }) {
  const format = (dt) => dt.toISOString().replace(/-|:|\.\d{3}/g, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ExphonifyPH//Demo Booking//EN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@exphonifyph.com`,
    `DTSTAMP:${format(new Date())}`,
    `DTSTART:${format(startDateTime)}`,
    `DTEND:${format(endDateTime)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location || ''}`,
    `ORGANIZER;CN=ExphonifyPH:mailto:${organizer_email}`,
    `ATTENDEE;CN=${attendee_email};RSVP=TRUE:mailto:${attendee_email}`,
    `ATTENDEE;CN=${organizer_email};RSVP=FALSE:mailto:${organizer_email}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

// ─── EMAIL TRANSPORTER ───────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── GOOGLE CALENDAR AUTH ────────────────────────────────────────
function getGoogleCalendarClient() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const key = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

// ─── ZOOM TOKEN ──────────────────────────────────────────────────
async function getZoomToken() {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  const res = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {},
    { headers: { Authorization: `Basic ${credentials}` } }
  );

  return res.data.access_token;
}

// ─── CREATE ZOOM MEETING ─────────────────────────────────────────
async function createZoomMeeting(full_name, company, startDateTime, message) {
  const token = await getZoomToken();

  const zoomRes = await axios.post(
    `https://api.zoom.us/v2/users/${process.env.ZOOM_USER_EMAIL}/meetings`,
    {
      topic: `Demo Call with ${full_name}${company ? ` (${company})` : ''}`,
      type: 2,
      start_time: startDateTime.toISOString(),
      duration: 30,
      timezone: 'Asia/Manila',
      agenda: message || 'Demo booking via website',
      settings: { host_video: true, participant_video: true, waiting_room: true },
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return {
    zoom_meeting_id: String(zoomRes.data.id),
    zoom_join_url: zoomRes.data.join_url,
    zoom_start_url: zoomRes.data.start_url,
  };
}

// ─── CREATE GOOGLE MEET VIA CALENDAR ────────────────────────────
async function createGoogleMeet(full_name, company, startDateTime, message) {
  const calendar = getGoogleCalendarClient();
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);
  const meet_link = process.env.GOOGLE_MEET_LINK;

  const event = {
    summary: `Demo Call with ${full_name}${company ? ` (${company})` : ''}`,
    description: `${message || 'Demo booking via website'}\n\nGoogle Meet Link: ${meet_link}`,
    start: { dateTime: startDateTime.toISOString(), timeZone: 'Asia/Manila' },
    end: { dateTime: endDateTime.toISOString(), timeZone: 'Asia/Manila' },
    location: meet_link,
  };

  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    resource: event,
  });

  return {
    meet_link,
    calendar_event_id: response.data.id,
    calendar_event_link: response.data.htmlLink,
  };
}

// ─── ADD TO GOOGLE CALENDAR ──────────────────────────────────────
async function addToGoogleCalendar(full_name, company, startDateTime, message, zoom_join_url) {
  const calendar = getGoogleCalendarClient();
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

  const event = {
    summary: `Demo Call with ${full_name}${company ? ` (${company})` : ''}`,
    description: `${message || 'Demo booking via website'}\n\nZoom Link: ${zoom_join_url}`,
    start: { dateTime: startDateTime.toISOString(), timeZone: 'Asia/Manila' },
    end: { dateTime: endDateTime.toISOString(), timeZone: 'Asia/Manila' },
    location: zoom_join_url,
  };

  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    resource: event,
  });

  return {
    calendar_event_id: response.data.id,
    calendar_event_link: response.data.htmlLink,
  };
}

// ─── SEND PENDING EMAIL (on initial booking) ─────────────────────
async function sendPendingEmails({ full_name, email, company, preferred_date, preferred_time, platform, message }) {
  const platformLabel = platform === 'zoom' ? 'Zoom' : 'Google Meet';

  // Email to admin
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `📋 New Demo Request — ${full_name}${company ? ` (${company})` : ''} (Pending Approval)`,
    html: `
      <h2>New Demo Booking Request</h2>
      <p>A new demo has been requested and is awaiting your approval.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Name</strong></td><td style="padding:8px;border:1px solid #ddd">${full_name}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Company</strong></td><td style="padding:8px;border:1px solid #ddd">${company || '—'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ddd">${preferred_date}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Time</strong></td><td style="padding:8px;border:1px solid #ddd">${preferred_time}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Platform</strong></td><td style="padding:8px;border:1px solid #ddd">${platformLabel}</td></tr>
        ${message ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Message</strong></td><td style="padding:8px;border:1px solid #ddd">${message}</td></tr>` : ''}
      </table>
      <p><strong>Please log in to the admin panel to approve or reject this booking.</strong></p>
    `,
  });

  // Email to client
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `⏳ Demo Request Received — Awaiting Confirmation`,
    html: `
      <h2>We've Received Your Demo Request!</h2>
      <p>Hi ${full_name},</p>
      <p>Thank you for your interest! We've received your demo request and our team is reviewing it. You'll receive another email with your meeting link once your booking is confirmed.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Requested Date</strong></td><td style="padding:8px;border:1px solid #ddd">${preferred_date}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Requested Time</strong></td><td style="padding:8px;border:1px solid #ddd">${preferred_time} (Asia/Manila)</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Platform</strong></td><td style="padding:8px;border:1px solid #ddd">${platformLabel}</td></tr>
      </table>
      <p style="color:#888;font-size:0.9em">If you have any questions, feel free to reply to this email.</p>
      <p>We look forward to speaking with you!</p>
    `,
  });
}

// ─── SEND APPROVAL EMAIL (with meeting link) ─────────────────────
// ─── SEND APPROVAL EMAIL (with meeting link) ─────────────────────
async function sendApprovalEmail({ full_name, email, company, preferred_date, preferred_time, platform, message, meet_link, zoom_join_url, calendar_event_link, startDateTime, admin_message }) {
  const platformLabel = platform === 'zoom' ? 'Zoom' : 'Google Meet';
  const meetingLink = platform === 'zoom' ? zoom_join_url : meet_link;
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

  const icsContent = generateICS({
    summary: `Demo Call with ${full_name}${company ? ` (${company})` : ''}`,
    description: `${message || 'Demo booking'}\n\nMeeting Link: ${meetingLink || ''}`,
    location: meetingLink || '',
    startDateTime,
    endDateTime,
    organizer_email: process.env.EMAIL_USER,
    attendee_email: email,
  });

  // 📧 Email to CLIENT (existing)
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `✅ Demo Confirmed — ${preferred_date} at ${preferred_time}`,
    attachments: [
      {
        filename: 'booking.ics',
        content: icsContent,
        contentType: 'text/calendar; method=REQUEST',
      },
    ],
    html: `
      <h2>Your Demo is Confirmed!</h2>
      <p>Hi ${full_name},</p>
      <p>Great news! Your demo has been approved. Here are your details:</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ddd">${preferred_date}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Time</strong></td><td style="padding:8px;border:1px solid #ddd">${preferred_time} (Asia/Manila)</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Platform</strong></td><td style="padding:8px;border:1px solid #ddd">${platformLabel}</td></tr>
        ${meetingLink ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Meeting Link</strong></td><td style="padding:8px;border:1px solid #ddd"><a href="${meetingLink}">${meetingLink}</a></td></tr>` : ''}
        ${calendar_event_link ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Calendar Event</strong></td><td style="padding:8px;border:1px solid #ddd"><a href="${calendar_event_link}">View in Google Calendar</a></td></tr>` : ''}
      </table>
      ${admin_message ? `<p><strong>Message from our team:</strong><br/>${admin_message}</p>` : ''}
      <p><strong>📅 A calendar invite is attached.</strong> Open <strong>booking.ics</strong> to add this to your calendar.</p>
      <p>We look forward to speaking with you!</p>
    `,
  });

  // 📧 Email to ADMIN (new)
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `✅ Demo Approved — ${full_name}${company ? ` (${company})` : ''} on ${preferred_date}`,
    html: `
      <h2>Demo Booking Approved</h2>
      <p>You have approved a demo booking. Here is a summary:</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Name</strong></td><td style="padding:8px;border:1px solid #ddd">${full_name}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Company</strong></td><td style="padding:8px;border:1px solid #ddd">${company || '—'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ddd">${preferred_date}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Time</strong></td><td style="padding:8px;border:1px solid #ddd">${preferred_time} (Asia/Manila)</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Platform</strong></td><td style="padding:8px;border:1px solid #ddd">${platformLabel}</td></tr>
        ${meetingLink ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Meeting Link</strong></td><td style="padding:8px;border:1px solid #ddd"><a href="${meetingLink}">${meetingLink}</a></td></tr>` : ''}
        ${calendar_event_link ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Calendar Event</strong></td><td style="padding:8px;border:1px solid #ddd"><a href="${calendar_event_link}">View in Google Calendar</a></td></tr>` : ''}
        ${message ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Client Message</strong></td><td style="padding:8px;border:1px solid #ddd">${message}</td></tr>` : ''}
        ${admin_message ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Your Note</strong></td><td style="padding:8px;border:1px solid #ddd">${admin_message}</td></tr>` : ''}
      </table>
      <p style="color:#888;font-size:0.9em">This is an automated confirmation sent to you as the admin.</p>
    `,
  });
}

// ─── SEND REJECTION EMAIL ─────────────────────────────────────────
async function sendRejectionEmail({ full_name, email, preferred_date, preferred_time, admin_message }) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `❌ Demo Request Update`,
    html: `
      <h2>Demo Request Update</h2>
      <p>Hi ${full_name},</p>
      <p>Unfortunately, we're unable to confirm your demo scheduled for <strong>${preferred_date} at ${preferred_time}</strong> at this time.</p>
      ${admin_message ? `<p><strong>Reason:</strong><br/>${admin_message}</p>` : ''}
      <p>Please feel free to submit a new booking request with a different date/time, and we'll do our best to accommodate you.</p>
      <p>We apologize for any inconvenience.</p>
    `,
  });
}





// ─── BOOK ROUTE (initial booking - no meeting created yet) ────────
// ─── BOOK ROUTE ────────────────────────────────────────────────
router.post('/book', async (req, res) => {
  console.log('➡️ HIT /api/zoom/book');

  const {
    full_name, company, email, phone,
    preferred_date, preferred_time, platform,
    message, recaptcha_token
  } = req.body;

  try {
    if (!full_name || !email || !preferred_date || !preferred_time || !platform) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // ✅ reCAPTCHA check (skip gracefully if no secret key configured)
    if (process.env.RECAPTCHA_SECRET_KEY && recaptcha_token) {
      const verifyRes = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        { params: {
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: recaptcha_token
        }}
      );
      if (!verifyRes.data.success) {
        return res.status(400).json({ success: false, error: 'reCAPTCHA verification failed.' });
      }
    }

    const startDateTime = new Date(`${preferred_date}T${preferred_time}:00`);
    if (isNaN(startDateTime)) {
      return res.status(400).json({ success: false, error: 'Invalid date/time format' });
    }

    // 💾 Save to Supabase with status 'pending'
    const { data, error } = await supabase
      .from('demo_bookings')
      .insert({
        full_name,
        company:        company || null,
        email,
        phone:          phone || null,
        preferred_date,
        preferred_time,
        platform,
        message:        message || null,
        source:         'website',
        status:         'pending',
        zoom_meeting_id: null,
        zoom_join_url:   null,
        zoom_start_url:  null,
      })
      .select()
      .single();

    if (error) {
      console.error('SUPABASE ERROR:', error);
      throw error;
    }

    // 📧 Send pending notification emails
    await sendPendingEmails({
      full_name, email, company,
      preferred_date, preferred_time,
      platform, message
    });

    res.json({ success: true, booking_id: data.id });

  } catch (err) {
    console.error('🔥 BOOK ERROR:', err.response?.data || err);
    res.status(err.response?.status || 500).json({
      success: false,
      error:   err.response?.data?.message || err.message,
      details: err.response?.data || null,
    });
  }
});

// ─── APPROVE ROUTE ────────────────────────────────────────────────
// Supports approving from any status (pending, rejected, etc.)
router.post('/approve/:id', async (req, res) => {
  console.log('➡️ HIT /api/zoom/approve/:id');

  const { id } = req.params;
  const { admin_message } = req.body;

  try {
    // Fetch booking from supabase
    const { data: booking, error: fetchError } = await supabase
      .from('demo_bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // ✅ REMOVED: hard block on already-approved status
    // This allows re-approving (e.g. after a reject → approve toggle)

    const { full_name, company, email, preferred_date, preferred_time, platform, message } = booking;
    const startDateTime = new Date(`${preferred_date}T${preferred_time}`);

    let zoom_meeting_id = null;
    let zoom_join_url = null;
    let zoom_start_url = null;
    let meet_link = null;
    let calendar_event_id = null;
    let calendar_event_link = null;

    // 🎥 Always create a fresh Zoom meeting on (re-)approval
    if (platform === 'zoom') {
      const zoomData = await createZoomMeeting(full_name, company, startDateTime, message);
      zoom_meeting_id = zoomData.zoom_meeting_id;
      zoom_join_url = zoomData.zoom_join_url;
      zoom_start_url = zoomData.zoom_start_url;

      const calData = await addToGoogleCalendar(full_name, company, startDateTime, message, zoom_join_url);
      calendar_event_id = calData.calendar_event_id;
      calendar_event_link = calData.calendar_event_link;
    }

    // 📹 Always create a fresh Google Meet on (re-)approval
    if (platform === 'google_meet') {
      const meetData = await createGoogleMeet(full_name, company, startDateTime, message);
      meet_link = meetData.meet_link;
      calendar_event_id = meetData.calendar_event_id;
      calendar_event_link = meetData.calendar_event_link;
    }

    // 💾 UPDATE SUPABASE — always write the new meeting data
    const { error: updateError } = await supabase
      .from('demo_bookings')
      .update({
        status: 'approved',
        zoom_meeting_id,
        zoom_join_url,
        zoom_start_url,
        calendar_event_id,
        calendar_event_link,
        meet_link,
        admin_message: admin_message || null,
        approved_at: new Date().toISOString(),
        // Clear rejected_at if previously rejected
        rejected_at: null,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 📧 SEND APPROVAL EMAIL
    await sendApprovalEmail({
      full_name, email, company, preferred_date, preferred_time, platform, message,
      meet_link, zoom_join_url, calendar_event_link, startDateTime, admin_message,
    });

    res.json({ success: true, zoom_join_url, meet_link, calendar_event_link });

  } catch (err) {
    console.error('🔥 APPROVE ERROR:', err.response?.data || err);
    res.status(500).json({
      success: false,
      error: err.response?.data?.message || err.message,
    });
  }
});

// ─── REJECT ROUTE ─────────────────────────────────────────────────
router.post('/reject/:id', async (req, res) => {
  console.log('➡️ HIT /api/zoom/reject/:id');

  const { id } = req.params;
  const { admin_message } = req.body;

  try {
    const { data: booking, error: fetchError } = await supabase
      .from('demo_bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // 🗑 DELETE GOOGLE CALENDAR EVENT (covers both Zoom and Google Meet bookings)
    // calendar_event_id is set for both platforms when a meeting was created
    await deleteGoogleCalendarEvent(booking.calendar_event_id);

    // 💾 UPDATE SUPABASE — clear all meeting data on rejection
    const { error: updateError } = await supabase
      .from('demo_bookings')
      .update({
        status: 'rejected',
        admin_message: admin_message || null,
        rejected_at: new Date().toISOString(),
        zoom_meeting_id: null,
        zoom_join_url: null,
        zoom_start_url: null,
        meet_link: null,
        calendar_event_id: null,
        calendar_event_link: null,
        approved_at: null,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    await sendRejectionEmail({
      full_name: booking.full_name,
      email: booking.email,
      preferred_date: booking.preferred_date,
      preferred_time: booking.preferred_time,
      admin_message,
    });

    res.json({ success: true });

  } catch (err) {
    console.error('🔥 REJECT ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE ROUTE ─────────────────────────────────────────────────
router.delete('/booking/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('demo_bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });

  } catch (err) {
    console.error('🔥 DELETE ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE GOOGLE CALENDAR EVENT ───────────────────────────────
async function deleteGoogleCalendarEvent(eventId) {
  if (!eventId) {
    console.warn('⚠️ deleteGoogleCalendarEvent: no eventId, skipping');
    return;
  }
  console.log(`🗑 Attempting to delete event: ${eventId} from calendar: ${process.env.GOOGLE_CALENDAR_ID}`);
  try {
    const calendar = getGoogleCalendarClient();
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId,
    });
    console.log(`✅ Deleted calendar event: ${eventId}`);
  } catch (err) {
    if (err.code === 410 || err?.response?.status === 410) {
      console.warn(`Calendar event ${eventId} already gone (410), skipping.`);
    } else {
      console.error('❌ Failed to delete calendar event:', err.message, err?.response?.data);
    }
  }
}

// ─── GET ALL BOOKINGS ─────────────────────────────────────────────
router.get('/bookings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('demo_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, bookings: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── TEST ROUTE ──────────────────────────────────────────────────
router.get('/test-zoom', async (req, res) => {
  try {
    const credentials = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');

    const result = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
      {},
      { headers: { Authorization: `Basic ${credentials}` } }
    );

    res.json({ success: true, token: result.data.access_token });
  } catch (err) {
    res.json({ success: false, error: err.message, details: err.response?.data });
  }
});

module.exports = router;