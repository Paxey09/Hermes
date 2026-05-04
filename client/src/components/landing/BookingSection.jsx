import { useState } from 'react';
import { timeSlots, platforms } from './data/bookingOptions.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const INITIAL_FORM = {
  name: '',
  company: '',
  email: '',
  phone: '',
  platform: '',
  date: '',
  time: '',
  message: '',
};

function BookingSection() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const convertTo24Hour = (timeStr) => {
    const [time, meridiem] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError('');

    try {
      const payload = {
        full_name: form.name.trim(),
        company: form.company.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        preferred_date: form.date,
        preferred_time: convertTo24Hour(form.time),
        platform: form.platform,
        message: form.message.trim() || null,
      };

      const res = await fetch(`${API_BASE_URL}/api/zoom/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const result = text ? JSON.parse(text) : {};

      if (!res.ok) {
        console.error('FULL ERROR:', result);
        throw new Error(result.error || 'Request failed');
      }

      setSubmittedEmail(form.email.trim());
      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch (error) {
      console.error('Booking error:', error);
      setSubmitError(error.message || 'Failed to submit booking.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <section className="ep-section ep-booking-section" id="booking">
      <div className="ep-section-inner">
        <p className="ep-section-eyebrow">Get Started</p>
        <h2 className="ep-section-title">
          Book a <span className="ep-gold">Demo</span>
        </h2>
        <p className="ep-section-sub">
          Reserve your preferred date and time. We&apos;ll connect via your chosen
          platform and come fully prepared for a meaningful conversation.
        </p>

        {submitted ? (
          <div className="ep-success">
            <div className="ep-success-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>Booking Request Received!</h3>
            <p>
              Thank you for your interest! A confirmation email has been sent to{' '}
              <strong>{submittedEmail}</strong>.
            </p>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              ⏳ Please wait while our admin reviews and confirms your demo schedule.
              You will receive another email with your meeting link once approved.
            </p>
            <button
              type="button"
              className="ep-btn-primary"
              style={{ marginTop: '1.5rem' }}
              onClick={() => {
                setSubmitted(false);
                setSubmittedEmail('');
              }}
            >
              Book Another Demo
            </button>
          </div>
        ) : (
          <form className="ep-form" onSubmit={handleSubmit}>
            <div className="ep-form-grid">
              <div className="ep-field">
                <label>Full Name <span className="ep-req">*</span></label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Juan dela Cruz" required />
              </div>

              <div className="ep-field">
                <label>Company / Business</label>
                <input name="company" value={form.company} onChange={handleChange} placeholder="Your Company, Inc." />
              </div>

              <div className="ep-field">
                <label>Email Address <span className="ep-req">*</span></label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@company.com" required />
              </div>

              <div className="ep-field">
                <label>Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+63 9XX XXX XXXX" />
              </div>

              <div className="ep-field">
                <label>Preferred Date <span className="ep-req">*</span></label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="ep-field">
                <label>Preferred Time <span className="ep-req">*</span></label>
                <select className="ep-time-select" name="time" value={form.time} onChange={handleChange} required>
                  <option value="">Select a time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div className="ep-field">
                <label>Preferred Platform <span className="ep-req">*</span></label>
                <div className="ep-platform-group">
                  {platforms.map((platform) => (
                    <label
                      key={platform.id}
                      className={`ep-platform-pill ${form.platform === platform.id ? 'ep-platform-active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="platform"
                        value={platform.id}
                        checked={form.platform === platform.id}
                        onChange={handleChange}
                        required
                      />
                      {platform.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="ep-field ep-field-full">
                <label>Message / Additional Details</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your business and what you'd like to achieve…"
                  rows={4}
                />
              </div>
            </div>

            {submitError && (
              <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{submitError}</div>
            )}

            <button type="submit" className="ep-btn-primary ep-submit" disabled={submitLoading}>
              {submitLoading ? 'Submitting...' : 'Confirm Booking'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default BookingSection;
