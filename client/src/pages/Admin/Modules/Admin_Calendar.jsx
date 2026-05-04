import Admin_Layout from '../../Components/Admin_Components/Admin_Layout.jsx';
import '../../../styles/Admin_styles/Admin_Style.css';
import { useEffect, useState, useCallback } from 'react';
import { db, supabase } from '../../../config/supabaseClient.js';

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const pad2 = (n) => String(n).padStart(2, '0');

const formatDate = (year, month, day) =>
    `${year}-${pad2(month + 1)}-${pad2(day)}`;

const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const isDemoDoneStatus = (s) => s === 'demo_done' || s === 'converted';

const formatBookingStatus = (status) => {
    if (status === 'approved')        return 'Approved';
    if (status === 'rejected')        return 'Rejected';
    if (isDemoDoneStatus(status))     return 'Demo Done';
    if (status === 'did_not_proceed') return 'Did Not Proceed';
    if (status === 'cancelled')       return 'Cancelled';
    if (status === 'scheduled')       return 'Scheduled';
    return 'New';
};

const getStatusColor = (status) => {
    if (status === 'approved')        return '#26a69a';
    if (status === 'rejected')        return '#ef5350';
    if (status === 'scheduled')       return '#7e57c2';
    if (isDemoDoneStatus(status))     return '#26a69a';
    if (status === 'did_not_proceed') return '#ef5350';
    if (status === 'cancelled')       return '#78909c';
    return '#ffa726'; // new / pending
};

const getMeetingLink = (b) => {
    if (b.platform === 'zoom')        return b.zoom_join_url  || null;
    if (b.platform === 'google_meet') return b.meet_link      || null;
    return null;
};

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────────── */

/** Small pill shown inside a calendar cell */
function BookingPill({ booking, onClick }) {
    const color = getStatusColor(booking.status);
    const isPending = !booking.status || booking.status === 'new' || booking.status === 'pending';
    return (
        <div
            onClick={() => onClick(booking)}
            style={{
                background: color + '22',
                borderLeft: `3px solid ${color}`,
                borderRadius: '4px',
                padding: '2px 6px',
                marginBottom: '3px',
                cursor: 'pointer',
                fontSize: '0.72rem',
                color: '#e0e9f5',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'background 0.15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
            }}
            title={`${booking.full_name} — ${booking.preferred_time || ''}`}
        >
            {isPending && (
                <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: color, flexShrink: 0,
                }} />
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {booking.preferred_time
                    ? `${booking.preferred_time.slice(0, 5)} ${booking.full_name}`
                    : booking.full_name}
            </span>
        </div>
    );
}

/** Day-view time-slot card */
function DaySlotCard({ booking, onClick }) {
    const color = getStatusColor(booking.status);
    return (
        <div
            onClick={() => onClick(booking)}
            style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${color}55`,
                borderLeft: `4px solid ${color}`,
                borderRadius: '8px',
                padding: '10px 14px',
                cursor: 'pointer',
                transition: 'background 0.15s',
                marginBottom: '8px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e0e9f5' }}>
                    {booking.full_name}
                </span>
                <span className="status-badge" style={{ backgroundColor: color, fontSize: '0.72rem' }}>
                    {formatBookingStatus(booking.status)}
                </span>
            </div>
            <div style={{ color: '#9fb0d0', fontSize: '0.8rem', marginTop: '4px' }}>
                {booking.preferred_time && <span>⏰ {booking.preferred_time}</span>}
                {booking.platform && (
                    <span style={{ marginLeft: '10px' }}>
                        📹 {booking.platform === 'google_meet' ? 'Google Meet' : 'Zoom'}
                    </span>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────────────────────── */
function Admin_Calendar() {
    const today = new Date();

    // ── View state ────────────────────────────────────────────────
    const [view, setView]               = useState('month');   // 'month' | 'week' | 'day'
    const [currentDate, setCurrentDate] = useState(today);     // anchor date

    // ── Bookings ─────────────────────────────────────────────────
    const [bookings, setBookings]               = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [bookingError, setBookingError]       = useState('');

    // ── Detail modal ──────────────────────────────────────────────
    const [detailModal, setDetailModal] = useState({ open: false, booking: null });

    // ── Approve modal ─────────────────────────────────────────────
    const [approveModal, setApproveModal] = useState({
        open: false,
        booking: null,
        message: '',
        submitting: false,
    });

    /* ── Load bookings ─────────────────────────────────────────── */
    const loadBookings = useCallback(async () => {
        setLoadingBookings(true);
        setBookingError('');
        try {
            const { data, error } = await db.getDemoBookings({ status: 'all', search: '' });
            if (error) throw error;
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading bookings:', err);
            setBookingError(err.message || 'Failed to load bookings.');
        } finally {
            setLoadingBookings(false);
        }
    }, []);

    useEffect(() => { loadBookings(); }, [loadBookings]);

    useEffect(() => {
        const sub = db.subscribeToDemoBookings(() => loadBookings());
        return () => supabase.removeChannel(sub);
    }, [loadBookings]);

    /* ── Navigation ────────────────────────────────────────────── */
    const navigate = (dir) => {
        const d = new Date(currentDate);
        if (view === 'month') d.setMonth(d.getMonth() + dir);
        if (view === 'week')  d.setDate(d.getDate() + dir * 7);
        if (view === 'day')   d.setDate(d.getDate() + dir);
        setCurrentDate(d);
    };

    const goToday = () => setCurrentDate(today);

    /* ── Helpers to group bookings ─────────────────────────────── */
    const bookingsOnDate = (dateStr) =>
        bookings.filter((b) => b.preferred_date === dateStr);

    /* ── Month grid ────────────────────────────────────────────── */
    const renderMonth = () => {
        const year  = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay  = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

        const cells = [];
        // Leading empty cells
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

        return (
            <div style={{ overflowX: 'auto' }}>
                {/* Day-of-week header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '1px' }}>
                    {DAYS_OF_WEEK.map((day) => (
                        <div key={day} style={{
                            textAlign: 'center', padding: '8px 0',
                            color: '#9fb0d0', fontSize: '0.78rem', fontWeight: 600,
                            letterSpacing: '0.05em', textTransform: 'uppercase',
                        }}>
                            {day}
                        </div>
                    ))}
                </div>
                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                    {cells.map((day, idx) => {
                        if (!day) return (
                            <div key={`empty-${idx}`} style={{
                                minHeight: '100px',
                                background: 'rgba(255,255,255,0.01)',
                                borderRadius: '6px',
                            }} />
                        );
                        const dateStr = formatDate(year, month, day);
                        const dayBookings = bookingsOnDate(dateStr);
                        const isToday = dateStr === todayStr;

                        return (
                            <div
                                key={dateStr}
                                onClick={() => { setCurrentDate(parseLocalDate(dateStr)); setView('day'); }}
                                style={{
                                    minHeight: '100px',
                                    background: isToday
                                        ? 'rgba(38,166,154,0.1)'
                                        : 'rgba(255,255,255,0.02)',
                                    border: isToday
                                        ? '1px solid rgba(38,166,154,0.5)'
                                        : '1px solid rgba(255,255,255,0.04)',
                                    borderRadius: '6px',
                                    padding: '6px',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                }}
                            >
                                <div style={{
                                    fontWeight: isToday ? 700 : 500,
                                    fontSize: '0.85rem',
                                    color: isToday ? '#26a69a' : '#c5d5e8',
                                    marginBottom: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}>
                                    {day}
                                    {isToday && (
                                        <span style={{
                                            fontSize: '0.6rem', background: '#26a69a',
                                            color: '#fff', borderRadius: '3px', padding: '1px 4px',
                                        }}>TODAY</span>
                                    )}
                                </div>
                                {dayBookings.map((b) => (
                                    <BookingPill
                                        key={b.id}
                                        booking={b}
                                        onClick={(bk) => {
                                            setDetailModal({ open: true, booking: bk });
                                        }}
                                    />
                                ))}
                                {dayBookings.length > 3 && (
                                    <div style={{ fontSize: '0.7rem', color: '#9fb0d0', marginTop: '2px' }}>
                                        +{dayBookings.length - 3} more
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    /* ── Week view ─────────────────────────────────────────────── */
    const renderWeek = () => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay()); // Sunday
        const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                {days.map((d) => {
                    const dateStr = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
                    const dayBookings = bookingsOnDate(dateStr);
                    const isToday = dateStr === todayStr;

                    return (
                        <div key={dateStr} style={{
                            minHeight: '300px',
                            background: isToday
                                ? 'rgba(38,166,154,0.08)'
                                : 'rgba(255,255,255,0.02)',
                            border: isToday
                                ? '1px solid rgba(38,166,154,0.4)'
                                : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '8px',
                            padding: '8px',
                        }}>
                            {/* Header */}
                            <div
                                onClick={() => { setCurrentDate(d); setView('day'); }}
                                style={{
                                    textAlign: 'center',
                                    marginBottom: '8px',
                                    cursor: 'pointer',
                                    paddingBottom: '8px',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                <div style={{ fontSize: '0.72rem', color: '#9fb0d0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {DAYS_OF_WEEK[d.getDay()]}
                                </div>
                                <div style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    color: isToday ? '#26a69a' : '#e0e9f5',
                                    marginTop: '2px',
                                }}>
                                    {d.getDate()}
                                </div>
                                {dayBookings.length > 0 && (
                                    <div style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        background: '#26a69a', margin: '4px auto 0',
                                    }} />
                                )}
                            </div>

                            {/* Bookings */}
                            {dayBookings.length === 0 ? (
                                <div style={{ color: '#546e7a', fontSize: '0.75rem', textAlign: 'center', marginTop: '20px' }}>
                                    No bookings
                                </div>
                            ) : (
                                dayBookings.map((b) => (
                                    <BookingPill
                                        key={b.id}
                                        booking={b}
                                        onClick={(bk) => setDetailModal({ open: true, booking: bk })}
                                    />
                                ))
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    /* ── Day view ──────────────────────────────────────────────── */
    const renderDay = () => {
        const dateStr = formatDate(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
        );
        const dayBookings = bookingsOnDate(dateStr);

        return (
            <div>
                <div style={{ marginBottom: '16px', color: '#9fb0d0', fontSize: '0.9rem' }}>
                    {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''} on this day
                </div>
                {dayBookings.length === 0 ? (
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '48px',
                        textAlign: 'center',
                        color: '#546e7a',
                    }}>
                        No bookings scheduled for this day.
                    </div>
                ) : (
                    dayBookings.map((b) => (
                        <DaySlotCard
                            key={b.id}
                            booking={b}
                            onClick={(bk) => setDetailModal({ open: true, booking: bk })}
                        />
                    ))
                )}
            </div>
        );
    };

    /* ── Approve handler ───────────────────────────────────────── */
    const handleApproveSubmit = async () => {
        const { booking, message } = approveModal;
        if (!message.trim()) {
            alert('Please add a message before approving.');
            return;
        }
        setApproveModal((prev) => ({ ...prev, submitting: true }));
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/zoom/approve/${booking.id}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ admin_message: message.trim() }),
                }
            );
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to approve booking.');

            await db.updateDemoBooking(booking.id, { admin_notes: message.trim() });

            setApproveModal({ open: false, booking: null, message: '', submitting: false });
            setDetailModal({ open: false, booking: null });
            await loadBookings();
        } catch (err) {
            console.error('Approve error:', err);
            alert('Error: ' + err.message);
            setApproveModal((prev) => ({ ...prev, submitting: false }));
        }
    };

    /* ── Header label ──────────────────────────────────────────── */
    const headerLabel = () => {
        if (view === 'month') {
            return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }
        if (view === 'week') {
            const start = new Date(currentDate);
            start.setDate(start.getDate() - start.getDay());
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} – ${
                start.getMonth() !== end.getMonth() ? MONTH_NAMES[end.getMonth()] + ' ' : ''
            }${end.getDate()}, ${end.getFullYear()}`;
        }
        return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    };

    /* ── Render ────────────────────────────────────────────────── */
    return (
        <Admin_Layout title="Calendar">
            {/* Page header */}
            <div className="crm-header">
                <h1>Booking Calendar</h1>
                <p>Visualise and manage all demo bookings across month, week, and day views.</p>
            </div>

            {bookingError && (
                <div style={{ marginBottom: '16px', color: '#ff6b6b' }}>{bookingError}</div>
            )}

            {/* ── Calendar toolbar ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
                padding: '12px 16px',
            }}>
                {/* Left: nav arrows + today */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        className="action-btn edit"
                        title="Previous"
                        onClick={() => navigate(-1)}
                        style={{ minWidth: '36px' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <button
                        className="action-btn edit"
                        title="Next"
                        onClick={() => navigate(1)}
                        style={{ minWidth: '36px' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                    <button
                        onClick={goToday}
                        style={{
                            background: 'rgba(38,166,154,0.15)',
                            border: '1px solid rgba(38,166,154,0.4)',
                            color: '#26a69a',
                            borderRadius: '6px',
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Today
                    </button>
                    <span style={{ color: '#e0e9f5', fontWeight: 700, fontSize: '1rem', marginLeft: '4px' }}>
                        {headerLabel()}
                    </span>
                </div>

                {/* Right: view toggles */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {['month', 'week', 'day'].map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                transition: 'all 0.15s',
                                background: view === v
                                    ? 'rgba(38,166,154,0.25)'
                                    : 'rgba(255,255,255,0.05)',
                                color: view === v ? '#26a69a' : '#9fb0d0',
                                outline: view === v ? '1px solid rgba(38,166,154,0.5)' : 'none',
                            }}
                        >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Calendar body ── */}
            <div style={{
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '16px',
                minHeight: '520px',
            }}>
                {loadingBookings ? (
                    <div style={{ textAlign: 'center', color: '#9fb0d0', paddingTop: '80px' }}>
                        Loading bookings…
                    </div>
                ) : (
                    <>
                        {view === 'month' && renderMonth()}
                        {view === 'week'  && renderWeek()}
                        {view === 'day'   && renderDay()}
                    </>
                )}
            </div>

            {/* ─────────────────────────────────────────────────────────
                Booking Detail Modal
            ───────────────────────────────────────────────────────── */}
            {detailModal.open && detailModal.booking && (() => {
                const b = detailModal.booking;
                const meetLink = getMeetingLink(b);
                const isPending = !b.status || b.status === 'new' || b.status === 'pending';

                return (
                    <div
                        className="modal-overlay"
                        onClick={() => setDetailModal({ open: false, booking: null })}
                    >
                        <div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: '520px', width: '100%' }}
                        >
                            {/* Close */}
                            <button
                                className="close-btn"
                                onClick={() => setDetailModal({ open: false, booking: null })}
                            >×</button>

                            {/* Title row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <h2 style={{ margin: 0 }}>{b.full_name}</h2>
                                <span
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(b.status) }}
                                >
                                    {formatBookingStatus(b.status)}
                                </span>
                            </div>

                            {/* Info grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '10px 16px',
                                background: 'rgba(255,255,255,0.04)',
                                borderRadius: '8px',
                                padding: '14px 16px',
                                marginBottom: '20px',
                                fontSize: '0.875rem',
                            }}>
                                {[
                                    ['📧 Email',    b.email || '—'],
                                    ['📱 Phone',    b.phone || '—'],
                                    ['🏢 Company',  b.company || '—'],
                                    ['📅 Date',     b.preferred_date || '—'],
                                    ['⏰ Time',     b.preferred_time || '—'],
                                    ['📹 Platform', b.platform === 'google_meet' ? 'Google Meet' : b.platform || '—'],
                                ].map(([label, val]) => (
                                    <div key={label}>
                                        <div style={{ color: '#9fb0d0', fontSize: '0.75rem', marginBottom: '2px' }}>{label}</div>
                                        <div style={{ color: '#e0e9f5', fontWeight: 500 }}>{val}</div>
                                    </div>
                                ))}

                                {/* Meeting link spans full width */}
                                {meetLink && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <div style={{ color: '#9fb0d0', fontSize: '0.75rem', marginBottom: '2px' }}>🔗 Meeting Link</div>
                                        <a
                                            href={meetLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ color: '#26a69a', fontWeight: 500, wordBreak: 'break-all' }}
                                        >
                                            {meetLink}
                                        </a>
                                    </div>
                                )}

                                {b.message && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <div style={{ color: '#9fb0d0', fontSize: '0.75rem', marginBottom: '2px' }}>💬 Message</div>
                                        <div style={{ color: '#c5d5e8' }}>{b.message}</div>
                                    </div>
                                )}

                                {b.admin_notes && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <div style={{ color: '#9fb0d0', fontSize: '0.75rem', marginBottom: '2px' }}>📝 Admin Notes</div>
                                        <div style={{ color: '#c5d5e8' }}>{b.admin_notes}</div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setDetailModal({ open: false, booking: null })}
                                >
                                    Close
                                </button>

                                {/* Approve button — only for pending */}
                                {isPending && (
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        style={{ backgroundColor: '#26a69a' }}
                                        onClick={() => {
                                            setApproveModal({
                                                open: true,
                                                booking: b,
                                                message: '',
                                                submitting: false,
                                            });
                                        }}
                                    >
                                        ✓ Approve & Send Link
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ─────────────────────────────────────────────────────────
                Approve Modal
            ───────────────────────────────────────────────────────── */}
            {approveModal.open && approveModal.booking && (
                <div
                    className="modal-overlay"
                    onClick={() => !approveModal.submitting && setApproveModal({ open: false, booking: null, message: '', submitting: false })}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '480px', width: '100%' }}
                    >
                        <button
                            className="close-btn"
                            disabled={approveModal.submitting}
                            onClick={() => setApproveModal({ open: false, booking: null, message: '', submitting: false })}
                        >×</button>

                        <h2>Approve Booking</h2>
                        <p style={{ marginBottom: '16px', color: '#9fb0d0' }}>
                            Add a message for <strong style={{ color: '#e0e9f5' }}>{approveModal.booking.full_name}</strong>.
                            A meeting link ({approveModal.booking.platform === 'google_meet' ? 'Google Meet' : 'Zoom'}) will be
                            created and sent to <strong style={{ color: '#e0e9f5' }}>{approveModal.booking.email}</strong>.
                        </p>

                        {/* Booking summary */}
                        <div style={{
                            background: 'rgba(38,166,154,0.07)',
                            border: '1px solid rgba(38,166,154,0.2)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            marginBottom: '18px',
                            fontSize: '0.82rem',
                            color: '#9fb0d0',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '6px',
                        }}>
                            <span><span style={{ color: '#26a69a' }}>Date:</span> {approveModal.booking.preferred_date || '—'}</span>
                            <span><span style={{ color: '#26a69a' }}>Time:</span> {approveModal.booking.preferred_time || '—'}</span>
                            <span><span style={{ color: '#26a69a' }}>Platform:</span> {approveModal.booking.platform === 'google_meet' ? 'Google Meet' : approveModal.booking.platform || '—'}</span>
                            <span><span style={{ color: '#26a69a' }}>Company:</span> {approveModal.booking.company || '—'}</span>
                        </div>

                        <div className="form-group">
                            <label>
                                Message to Client <span style={{ color: '#ef5350' }}>*</span>
                            </label>
                            <textarea
                                rows={4}
                                value={approveModal.message}
                                onChange={(e) => setApproveModal((prev) => ({ ...prev, message: e.target.value }))}
                                placeholder="e.g. We are pleased to confirm your demo. Please check your email for the meeting link."
                                style={{ width: '100%', resize: 'vertical' }}
                                disabled={approveModal.submitting}
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                disabled={approveModal.submitting}
                                onClick={() => setApproveModal({ open: false, booking: null, message: '', submitting: false })}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                style={{ backgroundColor: '#26a69a' }}
                                disabled={approveModal.submitting}
                                onClick={handleApproveSubmit}
                            >
                                {approveModal.submitting ? 'Sending…' : 'Approve & Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Admin_Layout>
    );
}

export default Admin_Calendar;