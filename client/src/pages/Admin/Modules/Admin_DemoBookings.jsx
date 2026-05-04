import Admin_Layout from '../../Components/Admin_Components/Admin_Layout.jsx';
import '../../../styles/Admin_styles/Admin_Style.css';
import { useEffect, useState, useCallback } from 'react';
import { db, supabase } from '../../../config/supabaseClient';

const EMPTY_PROCEED_FORM = {
    companyName: '',
    projectName: '',
    modulesIncluded: '',
    saleValue: '',
    assignedMember: '',
    projectNotes: ''
};

const EMPTY_SCHEDULE_FORM = {
    date: '',
    startTime: '',
    endTime: '',
    adminEmail: ''
};

function Admin_DemoBookings() {
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [updatingBookingId, setUpdatingBookingId] = useState(null);

    const [showProceedModal, setShowProceedModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [proceedForm, setProceedForm] = useState(EMPTY_PROCEED_FORM);
    const [submittingProceed, setSubmittingProceed] = useState(false);

    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedBookingForSchedule, setSelectedBookingForSchedule] = useState(null);
    const [submittingSchedule, setSubmittingSchedule] = useState(false);
    const [scheduleForm, setScheduleForm] = useState(EMPTY_SCHEDULE_FORM);

    // ── Action Modal (Approve / Reject / Notes) ──
    const [actionModal, setActionModal] = useState({
        open: false,
        type: null, // 'approve' | 'reject' | 'notes'
        booking: null,
        notes: '',
        submitting: false,
    });

    const [bookingFilters, setBookingFilters] = useState({
        status: 'all',
        search: ''
    });

    const isDemoDoneStatus = (status) => status === 'demo_done' || status === 'converted';

    const formatBookingStatus = (status) => {
        if (status === 'approved') return 'Approved';
        if (status === 'rejected') return 'Rejected';
        if (isDemoDoneStatus(status)) return 'Demo Done';
        if (status === 'did_not_proceed') return 'Did Not Proceed';
        if (status === 'cancelled') return 'Cancelled';
        if (status === 'scheduled') return 'Scheduled';
        return 'New';
    };

    const loadBookings = useCallback(async () => {
        setLoadingBookings(true);
        setBookingError('');
        try {
            const { data, error } = await db.getDemoBookings(bookingFilters);
            if (error) throw error;
            setBookings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading demo bookings:', error);
            setBookingError(error.message || 'Failed to load demo bookings.');
        } finally {
            setLoadingBookings(false);
        }
    }, [bookingFilters]);

    useEffect(() => { loadBookings(); }, [loadBookings]);

    useEffect(() => {
        const bookingSubscription = db.subscribeToDemoBookings(() => { loadBookings(); });
        return () => { supabase.removeChannel(bookingSubscription); };
    }, [loadBookings]);

    // ── Open / Close Action Modal ────────────────────────────────
    const openActionModal = (type, booking) => {
        setActionModal({
            open: true,
            type,
            booking,
            notes: booking.admin_notes || '',
            submitting: false,
        });
    };

    const closeActionModal = () => {
        setActionModal({ open: false, type: null, booking: null, notes: '', submitting: false });
    };

    // ── Submit Approve / Reject / Notes ─────────────────────────
    const handleActionSubmit = async () => {
        const { type, booking, notes } = actionModal;

        if ((type === 'approve' || type === 'reject') && !notes.trim()) {
            alert('Please add a note before submitting.');
            return;
        }

        setActionModal((prev) => ({ ...prev, submitting: true }));

        try {
            if (type === 'approve') {
                // ─────────────────────────────────────────────────────────
                // The backend /approve route is the single source of truth.
                // It handles ALL of the following in one transaction:
                //   ✅ Creates Zoom meeting OR Google Meet calendar event
                //   ✅ Writes zoom_meeting_id, zoom_join_url, zoom_start_url
                //      (Zoom) or meet_link, calendar_event_id,
                //      calendar_event_link (Google Meet) to Supabase
                //   ✅ Sets status = 'approved' and admin_message
                //   ✅ Sends the confirmation email with meeting link to client
                //
                // ⚠️  DO NOT call db.updateDemoBooking with status/zoom
                //     fields here — a second partial update would race the
                //     backend write and could null out the zoom columns.
                //     Only update admin_notes (a UI-only field) separately.
                // ─────────────────────────────────────────────────────────
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/zoom/approve/${booking.id}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ admin_message: notes.trim() }),
                    }
                );
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Failed to approve booking.');

                // Safe: only touches admin_notes, not status or zoom fields
                await db.updateDemoBooking(booking.id, { admin_notes: notes.trim() });

            } else if (type === 'reject') {
                // ─────────────────────────────────────────────────────────
                // The backend /reject route handles ALL of the following:
                //   ✅ Nulls zoom_meeting_id, zoom_join_url, zoom_start_url,
                //      meet_link, calendar_event_id, calendar_event_link
                //   ✅ Sets status = 'rejected' and admin_message
                //   ✅ Sends the rejection email to the client
                //
                // ⚠️  Same rule — do NOT set status here.
                // ─────────────────────────────────────────────────────────
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/zoom/reject/${booking.id}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ admin_message: notes.trim() }),
                    }
                );
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Failed to reject booking.');

                // Safe: only touches admin_notes
                await db.updateDemoBooking(booking.id, { admin_notes: notes.trim() });

            } else if (type === 'notes') {
                // Notes-only — no status or zoom fields involved, always safe
                await db.updateDemoBooking(booking.id, { admin_notes: notes.trim() });
            }

            closeActionModal();
            await loadBookings();
        } catch (error) {
            console.error('Action error:', error);
            alert('Error: ' + error.message);
            setActionModal((prev) => ({ ...prev, submitting: false }));
        }
    };

    // ── Original helpers ─────────────────────────────────────────
    const handleUpdateBookingStatus = async (bookingId, status) => {
        setUpdatingBookingId(bookingId);
        try {
            const { error } = await db.updateDemoBooking(bookingId, { status });
            if (error) throw error;
            await loadBookings();
        } catch (error) {
            console.error('Error updating booking status:', error);
            alert('Failed to update booking status: ' + error.message);
        } finally {
            setUpdatingBookingId(null);
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) return;
        try {
            const { error } = await db.deleteDemoBooking(bookingId);
            if (error) throw error;
            await loadBookings();
        } catch (error) {
            console.error('Error deleting booking:', error);
            alert('Failed to delete booking: ' + error.message);
        }
    };

    const openScheduleModal = (booking) => {
        if (booking.status !== 'new' && booking.status !== 'pending') {
            alert('Only new bookings can be scheduled.');
            return;
        }
        setSelectedBookingForSchedule(booking);
        setScheduleForm({ date: booking.preferred_date || '', startTime: '', endTime: '', adminEmail: '' });
        setShowScheduleModal(true);
    };

    const closeScheduleModal = () => {
        setShowScheduleModal(false);
        setSelectedBookingForSchedule(null);
        setScheduleForm(EMPTY_SCHEDULE_FORM);
    };

    const handleScheduleSubmit = async () => {
        if (!selectedBookingForSchedule) return;
        const { date, startTime, endTime, adminEmail } = scheduleForm;
        if (!date || !startTime || !endTime || !adminEmail.trim()) {
            alert('Date, start time, end time, and admin email are required.');
            return;
        }
        const startDateTime = `${date}T${startTime}:00+08:00`;
        const endDateTime = `${date}T${endTime}:00+08:00`;
        setSubmittingSchedule(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/demo-bookings/${selectedBookingForSchedule.id}/schedule`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startDateTime, endDateTime, adminEmail: adminEmail.trim() })
                }
            );
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to schedule booking.');
            closeScheduleModal();
            await loadBookings();
        } catch (error) {
            console.error('Error scheduling booking:', error);
            alert('Failed to schedule booking: ' + error.message);
        } finally {
            setSubmittingSchedule(false);
        }
    };

    const openProceedModal = (booking) => {
        if (booking.status !== 'scheduled') {
            alert('Only scheduled bookings can proceed.');
            return;
        }
        setSelectedBooking(booking);
        setProceedForm({
            companyName: booking.company || '',
            projectName: '',
            modulesIncluded: '',
            saleValue: '',
            assignedMember: '',
            projectNotes: booking.message || ''
        });
        setShowProceedModal(true);
    };

    const closeProceedModal = () => {
        setShowProceedModal(false);
        setSelectedBooking(null);
        setProceedForm(EMPTY_PROCEED_FORM);
    };

    const handleProceedSubmit = async () => {
        if (!selectedBooking) return;
        const companyName = proceedForm.companyName.trim();
        const projectName = proceedForm.projectName.trim();
        const modulesIncluded = proceedForm.modulesIncluded.trim();
        const assignedMember = proceedForm.assignedMember.trim();
        const projectNotes = proceedForm.projectNotes.trim();
        const saleValue = Number(proceedForm.saleValue) || 0;
        if (!projectName) { alert('Project name is required.'); return; }
        setSubmittingProceed(true);
        try {
            const customerNotes = [
                'Created after demo completion',
                `Contact Person: ${selectedBooking.full_name || '-'}`,
                `Company: ${companyName || selectedBooking.company || '-'}`,
                `Phone: ${selectedBooking.phone || '-'}`,
                `Preferred Date: ${selectedBooking.preferred_date || '-'}`,
                `Preferred Time: ${selectedBooking.preferred_time || '-'}`,
                `Platform: ${selectedBooking.platform || '-'}`,
                `Booking Message: ${selectedBooking.message || '-'}`
            ].join('\n');

            const customerPayload = {
                name: selectedBooking.full_name || companyName || 'N/A',
                company: companyName || selectedBooking.company || null,
                phone: selectedBooking.phone || null,
                email: (selectedBooking.email || '').trim(),
                status: 'active',
                value: saleValue,
                notes: customerNotes
            };
            const { data: createdCustomer, error: customerError } = await db.createCustomer(customerPayload);
            if (customerError) throw customerError;

            const projectPayload = {
                booking_id: selectedBooking.id,
                customer_id: createdCustomer.id,
                project_name: projectName,
                modules_included: modulesIncluded || null,
                sale_value: saleValue,
                assigned_member: assignedMember || null,
                progress: 0,
                status: 'not_started',
                notes: projectNotes || null
            };
            const { error: projectError } = await db.createProject(projectPayload);
            if (projectError) throw projectError;

            const { error: bookingUpdateError } = await db.updateDemoBooking(selectedBooking.id, { status: 'demo_done' });
            if (bookingUpdateError) throw bookingUpdateError;

            closeProceedModal();
            await loadBookings();
            window.location.href = '/AdminProjects';
        } catch (error) {
            console.error('Error proceeding booking:', error);
            alert('Failed to complete booking: ' + error.message);
        } finally {
            setSubmittingProceed(false);
        }
    };

    const getBookingStatusColor = (status) => {
        if (status === 'approved') return '#26a69a';
        if (status === 'rejected') return '#ef5350';
        if (status === 'new' || status === 'pending' || !status) return '#ffa726';
        if (status === 'scheduled') return '#7e57c2';
        if (isDemoDoneStatus(status)) return '#26a69a';
        if (status === 'did_not_proceed') return '#ef5350';
        if (status === 'cancelled') return '#78909c';
        return '#78909c';
    };

    // ── Resolve meeting link from booking row ─────────────────────
    const getMeetingLink = (booking) => {
        if (booking.platform === 'zoom') return booking.zoom_join_url || null;
        if (booking.platform === 'google_meet') return booking.meet_link || null;
        return null;
    };

    // ── Render Actions ────────────────────────────────────────────
    const renderBookingActions = (booking) => {
        const isBusy =
            updatingBookingId === booking.id ||
            submittingProceed ||
            (submittingSchedule && selectedBookingForSchedule?.id === booking.id);

        const isPending = booking.status === 'new' || booking.status === 'pending' || !booking.status;

        return (
            <div className="table-actions">

                {/* ✅ Approve — green check (action-btn edit style) */}
                {isPending && (
                    <button
                        className="action-btn edit"
                        title="Approve"
                        disabled={isBusy}
                        onClick={() => openActionModal('approve', booking)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </button>
                )}

                {/* 🚫 Reject — stop circle (action-btn delete style) */}
                {isPending && (
                    <button
                        className="action-btn delete"
                        title="Reject"
                        disabled={isBusy}
                        onClick={() => openActionModal('reject', booking)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                    </button>
                )}

                {/* 📝 Notes — paper icon (action-btn edit style) */}
                <button
                    className="action-btn edit"
                    title="Notes"
                    disabled={isBusy}
                    onClick={() => openActionModal('notes', booking)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                </button>

                {/* 🗑 Delete — trash icon (action-btn delete style) */}
                <button
                    className="action-btn delete"
                    title="Delete"
                    disabled={isBusy}
                    onClick={() => handleDeleteBooking(booking.id)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                </button>

            </div>
        );
    };

    // ── Modal Config ─────────────────────────────────────────────
    const modalConfig = {
        approve: {
            title: 'Approve Booking',
            subtitle: 'Add a message for the client. A meeting link will be sent via email.',
            label: 'Message to Client',
            placeholder: 'e.g. We are pleased to confirm your demo. Please check your email for the meeting link.',
            btnLabel: 'Approve & Send',
            btnColor: '#26a69a',
            required: true,
        },
        reject: {
            title: 'Reject Booking',
            subtitle: 'Please provide a reason. The client will be notified via email.',
            label: 'Reason for Rejection',
            placeholder: 'e.g. The requested time slot is unavailable. Please rebook at a different time.',
            btnLabel: 'Reject & Notify',
            btnColor: '#ef5350',
            required: true,
        },
        notes: {
            title: 'Booking Notes',
            subtitle: null,
            label: 'Admin Notes',
            placeholder: 'Add internal notes about this booking...',
            btnLabel: 'Save Notes',
            btnColor: null,
            required: false,
        },
    };

    const mc = actionModal.type ? modalConfig[actionModal.type] : null;

    // ── Stats ────────────────────────────────────────────────────
    const totalBookings = bookings.length;
    const newBookingsCount = bookings.filter((b) => b.status === 'new' || b.status === 'pending' || !b.status).length;
    const scheduledCount = bookings.filter((b) => b.status === 'scheduled').length;
    const demoDoneCount = bookings.filter((b) => isDemoDoneStatus(b.status)).length;

    return (
        <Admin_Layout title="Demo Bookings">
            <div className="crm-header">
                <h1>Demo Bookings</h1>
                <p>Manage intake, scheduling, and demo completion workflow.</p>
            </div>

            <div className="crm-stats">
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{totalBookings}</div>
                        <div className="stat-label">Total Bookings</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{newBookingsCount}</div>
                        <div className="stat-label">New</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{scheduledCount}</div>
                        <div className="stat-label">Scheduled</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{demoDoneCount}</div>
                        <div className="stat-label">Demo Done</div>
                    </div>
                </div>
            </div>

            <div className="account-actions">
                <div className="search-filter">
                    <input
                        type="text"
                        placeholder="Search demo bookings..."
                        value={bookingFilters.search}
                        onChange={(e) => setBookingFilters((prev) => ({ ...prev, search: e.target.value }))}
                        className="search-input"
                    />
                    <select
                        value={bookingFilters.status}
                        onChange={(e) => setBookingFilters((prev) => ({ ...prev, status: e.target.value }))}
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        <option value="new">New</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="demo_done">Demo Done</option>
                        <option value="did_not_proceed">Did Not Proceed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {bookingError && (
                <div style={{ marginBottom: '16px', color: '#ff6b6b' }}>{bookingError}</div>
            )}

            {/* ── Table ── */}
            <div className="customers-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Full Name</th>
                            <th>Company</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Platform</th>
                            <th>Meeting Link</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingBookings ? (
                            <tr><td colSpan="10">Loading demo bookings...</td></tr>
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan="10">No demo bookings found.</td></tr>
                        ) : (
                            bookings.map((booking) => {
                                const meetingLink = getMeetingLink(booking);
                                return (
                                    <tr key={booking.id}>
                                        <td>{booking.full_name}</td>
                                        <td>{booking.company || '—'}</td>
                                        <td>{booking.email}</td>
                                        <td>{booking.phone || '—'}</td>
                                        <td>{booking.preferred_date || '—'}</td>
                                        <td>{booking.preferred_time || '—'}</td>
                                        <td>
                                            {booking.platform === 'google_meet'
                                                ? 'Google Meet'
                                                : booking.platform
                                                    ? booking.platform.charAt(0).toUpperCase() + booking.platform.slice(1)
                                                    : '—'}
                                        </td>

                                        {/* ── Meeting Link cell ── */}
                                        <td>
                                            {meetingLink ? (
                                                <a
                                                    href={meetingLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title={meetingLink}
                                                    style={{
                                                        color: '#26a69a',
                                                        textDecoration: 'none',
                                                        fontSize: '0.8rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                    </svg>
                                                    Join
                                                </a>
                                            ) : (
                                                <span style={{ color: '#546e7a', fontSize: '0.8rem' }}>—</span>
                                            )}
                                        </td>

                                        <td>
                                            <span
                                                className="status-badge"
                                                style={{ backgroundColor: getBookingStatusColor(booking.status) }}
                                            >
                                                {formatBookingStatus(booking.status)}
                                            </span>
                                        </td>
                                        <td>{renderBookingActions(booking)}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Proceed Modal ── */}
            {showProceedModal && selectedBooking && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Mark Demo Done</h2>
                        <p style={{ marginBottom: '16px', color: '#9fb0d0' }}>
                            Complete this scheduled booking, create the client record, and create the project.
                        </p>
                        <form onSubmit={(e) => { e.preventDefault(); handleProceedSubmit(); }}>
                            <div className="form-group">
                                <label>Company Name</label>
                                <input type="text" value={proceedForm.companyName} onChange={(e) => setProceedForm({ ...proceedForm, companyName: e.target.value })} placeholder="Company name (optional if individual)" />
                            </div>
                            <div className="form-group">
                                <label>Project Name</label>
                                <input type="text" value={proceedForm.projectName} onChange={(e) => setProceedForm({ ...proceedForm, projectName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Modules Included</label>
                                <input type="text" value={proceedForm.modulesIncluded} onChange={(e) => setProceedForm({ ...proceedForm, modulesIncluded: e.target.value })} placeholder="CRM, ERP, Analytics" />
                            </div>
                            <div className="form-group">
                                <label>Sale Value ($)</label>
                                <input type="number" value={proceedForm.saleValue} onChange={(e) => setProceedForm({ ...proceedForm, saleValue: e.target.value })} placeholder="0" />
                            </div>
                            <div className="form-group">
                                <label>Assigned Member</label>
                                <input type="text" value={proceedForm.assignedMember} onChange={(e) => setProceedForm({ ...proceedForm, assignedMember: e.target.value })} placeholder="Team member name" />
                            </div>
                            <div className="form-group">
                                <label>Project Notes</label>
                                <textarea value={proceedForm.projectNotes} onChange={(e) => setProceedForm({ ...proceedForm, projectNotes: e.target.value })} rows="4" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={closeProceedModal} disabled={submittingProceed}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={submittingProceed}>
                                    {submittingProceed ? 'Processing...' : 'Complete Demo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Schedule Modal ── */}
            {showScheduleModal && selectedBookingForSchedule && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Schedule Demo</h2>
                        <p style={{ marginBottom: '16px', color: '#9fb0d0' }}>
                            Schedule this booking and trigger the MVP email flow.
                        </p>
                        <form onSubmit={(e) => { e.preventDefault(); handleScheduleSubmit(); }}>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Start Time</label>
                                <input type="time" value={scheduleForm.startTime} onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>End Time</label>
                                <input type="time" value={scheduleForm.endTime} onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Admin Email</label>
                                <input type="email" value={scheduleForm.adminEmail} onChange={(e) => setScheduleForm({ ...scheduleForm, adminEmail: e.target.value })} placeholder="admin@company.com" required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={closeScheduleModal} disabled={submittingSchedule}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={submittingSchedule}>
                                    {submittingSchedule ? 'Scheduling...' : 'Schedule Booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Approve / Reject / Notes Modal ── */}
            {actionModal.open && mc && actionModal.booking && (
                <div className="modal-overlay" onClick={closeActionModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>

                        <button className="close-btn" onClick={closeActionModal}>×</button>

                        <h2>{mc.title}</h2>
                        {mc.subtitle && (
                            <p style={{ marginBottom: '16px', color: '#9fb0d0' }}>{mc.subtitle}</p>
                        )}

                        {/* Booking Summary */}
                        <div style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            marginBottom: '20px',
                            fontSize: '0.875rem',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px 16px',
                        }}>
                            <div><span style={{ color: '#9fb0d0' }}>Name: </span>{actionModal.booking.full_name}</div>
                            <div><span style={{ color: '#9fb0d0' }}>Email: </span>{actionModal.booking.email}</div>
                            <div><span style={{ color: '#9fb0d0' }}>Date: </span>{actionModal.booking.preferred_date || '—'}</div>
                            <div><span style={{ color: '#9fb0d0' }}>Time: </span>{actionModal.booking.preferred_time || '—'}</div>
                            <div>
                                <span style={{ color: '#9fb0d0' }}>Platform: </span>
                                {actionModal.booking.platform === 'google_meet' ? 'Google Meet' : actionModal.booking.platform || '—'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#9fb0d0' }}>Status: </span>
                                <span
                                    className="status-badge"
                                    style={{ backgroundColor: getBookingStatusColor(actionModal.booking.status), fontSize: '0.75rem' }}
                                >
                                    {formatBookingStatus(actionModal.booking.status)}
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>
                                {mc.label}
                                {mc.required && <span style={{ color: '#ef5350' }}> *</span>}
                            </label>
                            <textarea
                                rows={4}
                                value={actionModal.notes}
                                onChange={(e) => setActionModal((prev) => ({ ...prev, notes: e.target.value }))}
                                placeholder={mc.placeholder}
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="button" onClick={closeActionModal} disabled={actionModal.submitting}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleActionSubmit}
                                disabled={actionModal.submitting}
                                style={mc.btnColor ? { backgroundColor: mc.btnColor } : {}}
                            >
                                {actionModal.submitting ? 'Processing...' : mc.btnLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Admin_Layout>
    );
}

export default Admin_DemoBookings;