import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';
import { supabase } from '../config/supabaseClient.js';

  const services = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      title: 'Hermes Inbox',
      desc: 'AI-powered unified inbox across Facebook, Instagram, TikTok, Shopee, Lazada & more — reply at godspeed.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      title: 'Hermes CRM',
      desc: '360-degree customer profiles, lead scoring, pipeline management, and lifetime value tracking across all brands.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      ),
      title: 'Hermes ERP',
      desc: 'Real-time stock management, automated reorder alerts, margin analysis, and multi-brand product catalog.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      ),
      title: 'Hermes Advance Analytics',
      desc: 'AI-powered revenue forecasting, cohort analysis, funnel metrics, cross-platform performance dashboards.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      title: 'Hermes AI Chatbot',
      desc: 'Smart auto-replies in Taglish — trained on your brand voice, products, and FAQs. Live 24/7 across all platforms.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      title: 'Hermes Social Ads',
      desc: 'Track ROAS, optimize ad creatives, and attribute revenue across Facebook, TikTok, and Shopee Ads.',
    },
  ];

  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

  const platforms = [
    { id: 'google-meet', label: 'Google Meet' }
  ];

function LandingPage() {
    const [form, setForm] = useState({
      name: '',
      company: '',
      email: '',
      phone: '',
      service: '',
      platform: '',
      date: '',
      time: '',
      message: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const observerRef = useRef(null);

    const handleChange = (e) => {
      setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      setSubmitted(true);
    };

    const scrollTo = (id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const [authModal, setAuthModal] = useState(null);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [authSuccess, setAuthSuccess] = useState('');

    // Add this at the top of your component with other hooks
    useEffect(() => {
      if (authSuccess || authError) {
        const timer = setTimeout(() => {
          setAuthSuccess('');
          setAuthError('');
        }, 8000); // 8 seconds
        return () => clearTimeout(timer); // Cleanup on unmount
      }
    }, [authSuccess, authError]);

    // ── HANDLE SIGN UP ──
    const handleSignUp = async (formData) => {
      setAuthLoading(true);
      setAuthError('');

      try {
        // 1. Sign up with Supabase Auth (no email verification)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailConfirmTo: false, // Disables confirmation email
            data: {
              full_name: `${formData.firstName} ${formData.lastName}`,
              role: 'Client', // Public signups must default to Client
            }
          }
        });

        if (authError) throw authError;

        // 2. Verify profile was created by trigger
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.error('Profile not found:', profileError);
          throw new Error('Profile was not created. Please try signing in again.');
        }

        console.log('Profile created:', profileData);

        // Success - user can now log in
        setAuthSuccess('Account created successfully! You can now log in.');

      } catch (error) {
        console.error('Sign up error:', error);
        setAuthError(error.message || 'Failed to create account');
      } finally {
        setAuthLoading(false);
      }
    };

    // ── HANDLE SIGN IN ──
    const navigate = useNavigate();
    const handleSignIn = async (formData) => {
      setAuthLoading(true);
      setAuthError('');
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;

        console.log('User ID:', data.user.id);

        // Get user role from public.profiles table
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        console.log('Profile query result:', userData);
        console.log('Profile query error:', userError);

        let userRole = 'Client'; // Default role

        if (userError) {
          console.log('Profile not found, creating new profile...');
          // If profile doesn't exist, create it with default role
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || '',
              role: 'Client'
            });
          if (createError) throw createError;
        } else if (userData && userData.role) {
          userRole = userData.role;
        }

        setAuthModal(null);
        console.log('Final user role:', userRole);

        // Redirect based on role
        if (userRole === 'Admin') {
          navigate('/AdminDashboard');
        } else {
          navigate('/ClientDashboard');
        }
      } catch (error) {
        console.error('Sign in error:', error);
        setAuthError(error.message || 'Failed to sign in');
      } finally {
        setAuthLoading(false);
      }
    };

    // ── SCROLL ANIMATIONS ──
    useEffect(() => {
      const initAnimations = () => {
        const config = {
          root: null,
          rootMargin: '0px 0px -50px 0px',
          threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('ep-in-view');
            }
          });
        }, config);

        observerRef.current = observer;

        // Function to observe elements
        const observeElements = () => {
          const animatedElements = document.querySelectorAll(
            '.ep-reveal-up, .ep-reveal-left, .ep-reveal-right, .ep-reveal-scale, ' +
            '.ep-service-card, .ep-pillar, .ep-form, .ep-field, .ep-pricing-card, ' +
            '.ep-about-text, .ep-about-body, .ep-section-eyebrow, .ep-section-title, .ep-section-sub'
          );

          animatedElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const isInView = rect.top < window.innerHeight && rect.bottom > 0;

            if (isInView) {
              el.classList.add('ep-in-view');
            } else {
              observer.observe(el);
            }
          });

          // Staggered children
          const staggerContainers = document.querySelectorAll('.ep-stagger-children');
          staggerContainers.forEach((container) => {
            const rect = container.getBoundingClientRect();
            const isInView = rect.top < window.innerHeight && rect.bottom > 0;

            if (isInView) {
              container.classList.add('ep-in-view');
            } else {
              observer.observe(container);
            }
          });
        };

        // Run immediately
        observeElements();

        // Also run after a short delay
        const timeout = setTimeout(observeElements, 100);

        // Run on scroll as backup
        const handleScroll = () => {
          const animatedElements = document.querySelectorAll(
            '.ep-reveal-up, .ep-reveal-left, .ep-reveal-right, .ep-reveal-scale, ' +
            '.ep-service-card, .ep-pillar, .ep-form, .ep-field, .ep-pricing-card, ' +
            '.ep-about-text, .ep-about-body, .ep-section-eyebrow, .ep-section-title, .ep-section-sub'
          );

          animatedElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const isInView = rect.top < window.innerHeight && rect.bottom > 0;

            if (isInView && !el.classList.contains('ep-in-view')) {
              el.classList.add('ep-in-view');
            }
          });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
          clearTimeout(timeout);
          window.removeEventListener('scroll', handleScroll);
          observer.disconnect();
        };
      };

      // Run after DOM is ready
      const timer = setTimeout(initAnimations, 50);

      // Also run on window load
      window.addEventListener('load', initAnimations);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('load', initAnimations);
      };
    }, []);

    // Mouse tracking for hero glow effects
    useEffect(() => {
      const handleMouseMove = (e) => {
        const hero = document.querySelector('.ep-hero');
        if (hero) {
          const rect = hero.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          hero.style.setProperty('--ep-mouse-x', `${x}px`);
          hero.style.setProperty('--ep-mouse-y', `${y}px`);
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
      <div className="ep-root">
        {/* ── NAV ── */}
        <nav className="ep-nav">
          <div className="ep-nav-inner">
            <span className="ep-logo-text">
              Exponify<span className="ep-logo-ph">PH</span>
            </span>

            <ul className="ep-nav-links">
              <li><button onClick={() => scrollTo('services')}>Services</button></li>
              <li><button onClick={() => scrollTo('about')}>About</button></li>
              <li>
                <button onClick={() => scrollTo('booking')} className="ep-nav-cta">
                  Book a Demo
                </button>
              </li>
            </ul>

            <ul className="ep-nav-auth">
              <li>
                <button className="ep-nav-auth-ghost" onClick={() => setAuthModal('signin')}>
                  Sign In
                </button>
              </li>
              <li>
                <button className="ep-nav-auth-primary" onClick={() => setAuthModal('signup')}>
                  Sign Up
                </button>
              </li>
            </ul>

            {/* Mobile menu toggle */}
            <button
              className={`ep-nav-toggle ${mobileMenuOpen ? 'ep-open' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>

          {/* Mobile menu dropdown */}
          <div className={`ep-nav-mobile ${mobileMenuOpen ? 'ep-open' : ''}`}>
            <div className="ep-nav-mobile-links">
              <button onClick={() => { scrollTo('services'); setMobileMenuOpen(false); }}>
                Services
              </button>
              <button onClick={() => { scrollTo('about'); setMobileMenuOpen(false); }}>
                About
              </button>
              <button onClick={() => { scrollTo('booking'); setMobileMenuOpen(false); }} className="ep-nav-cta">
                Book a Demo
              </button>
            </div>
            <div className="ep-nav-mobile-auth">
              <button className="ep-nav-auth-ghost" onClick={() => { setAuthModal('signin'); setMobileMenuOpen(false); }}>
                Sign In
              </button>
              <button className="ep-nav-auth-primary" onClick={() => { setAuthModal('signup'); setMobileMenuOpen(false); }}>
                Sign Up
              </button>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="ep-hero" id="hero">
          <div className="ep-hero-mouse-glow-secondary"></div>
          <div className="ep-hero-mouse-glow"></div>
          <div className="ep-hero-mouse-trail"></div>
          <div className="ep-hero-grid-overlay" />
          <div className="ep-hero-glow" />

          <div className="ep-hero-content">
            <p className="ep-hero-eyebrow">Premium Digital Services</p>
            <h1 className="ep-hero-title">
              Elevate Your<br />
              <span className="ep-gold">Business Online</span>
            </h1>
            <p className="ep-hero-sub">
              We craft bespoke digital strategies that position your brand at the apex of your industry.
              Strategy. Design. Growth — delivered with precision.
            </p>
            <div className="ep-hero-actions">
              <button className="ep-btn-primary" onClick={() => scrollTo('booking')}>
                Schedule a Consultation
              </button>
              <button className="ep-btn-ghost" onClick={() => scrollTo('services')}>
                Explore Services
              </button>
            </div>
            <div className="ep-hero-stats">
              <div className="ep-stat">
                <span className="ep-stat-num">120+</span>
                <span className="ep-stat-label">Clients Served</span>
              </div>
              <div className="ep-stat-divider" />
              <div className="ep-stat">
                <span className="ep-stat-num">98%</span>
                <span className="ep-stat-label">Satisfaction Rate</span>
              </div>
              <div className="ep-stat-divider" />
              <div className="ep-stat">
                <span className="ep-stat-num">5+</span>
                <span className="ep-stat-label">Years of Excellence</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVICES ── */}
        <section className="ep-section ep-services-section" id="services">
          <div className="ep-section-inner">
            <p className="ep-section-eyebrow">What We Offer</p>
            <h2 className="ep-section-title">
              Digital Services <span className="ep-gold">Designed for Growth</span>
            </h2>
            <p className="ep-section-sub">
              From concept to conversion, our full-suite digital services give your business the
              competitive edge it deserves.
            </p>
            <div className="ep-services-grid">
              {services.map((s) => (
                <div className="ep-service-card" key={s.title}>
                  <span className="ep-service-icon">{s.icon}</span>
                  <h3 className="ep-service-title">{s.title}</h3>
                  <p className="ep-service-desc">{s.desc}</p>
                  <div className="ep-card-line" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section className="ep-section ep-about-section" id="about">
          <div className="ep-section-inner ep-about-inner">
            <div className="ep-about-text">
              <p className="ep-section-eyebrow">About Exponify</p>
              <h2 className="ep-section-title">
                Where Strategy Meets <span className="ep-gold">Excellence</span>
              </h2>
              <p className="ep-about-body">
                Exponify is a premier digital services firm based in the Philippines, serving businesses
                across industries who demand more than the ordinary. We don't just deliver services —
                we build lasting digital foundations.
              </p>
              <p className="ep-about-body">
                Our team of specialists combines creative vision with analytical rigor to produce
                outcomes that are not only beautiful but measurably effective. Every engagement begins
                with listening, and ends with results that speak for themselves.
              </p>
              <button className="ep-btn-primary" onClick={() => scrollTo('booking')}>
                Work With Us
              </button>
            </div>
            <div className="ep-about-pillars">
              {[
                { num: '01', title: 'Discovery', body: 'We audit your current presence and align on goals.' },
                { num: '02', title: 'Strategy', body: 'A tailored roadmap built for your specific market.' },
                { num: '03', title: 'Execution', body: 'Our experts deliver with precision and speed.' },
                { num: '04', title: 'Growth', body: 'Continuous optimization to scale your results.' },
              ].map((p) => (
                <div className="ep-pillar" key={p.num}>
                  <span className="ep-pillar-num">{p.num}</span>
                  <div>
                    <h4 className="ep-pillar-title">{p.title}</h4>
                    <p className="ep-pillar-body">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOOKING ── */}
        <section className="ep-section ep-booking-section" id="booking">
          <div className="ep-section-inner">
            <p className="ep-section-eyebrow">Get Started</p>
            <h2 className="ep-section-title">
              Book a <span className="ep-gold">Demo</span>
            </h2>
            <p className="ep-section-sub">
              Reserve your preferred date and time. We'll connect via your chosen platform and come
              fully prepared for a meaningful conversation.
            </p>

            {submitted ? (
              <div className="ep-success">
                <div className="ep-success-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3>Your Booked is Confirmed</h3>
                <p>
                  Thank you, <strong>{form.name}</strong>. We'll send a calendar invite to{' '}
                  <strong>{form.email}</strong> shortly.
                </p>
              </div>
            ) : (
              <form className="ep-form" onSubmit={handleSubmit}>
                <div className="ep-form-grid">

                  <div className="ep-field">
                    <label>Full Name <span className="ep-req">*</span></label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Juan dela Cruz"
                      required
                    />
                  </div>

                  <div className="ep-field">
                    <label>Company / Business</label>
                    <input
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      placeholder="Your Company, Inc."
                    />
                  </div>

                  <div className="ep-field">
                    <label>Email Address <span className="ep-req">*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@company.com"
                      required
                    />
                  </div>

                  <div className="ep-field">
                    <label>Phone Number</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+63 9XX XXX XXXX"
                    />
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
                    <select
                      className="ep-time-select"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      required
                    >
                      <option value="">Select a time</option>
                      {timeSlots.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ep-field">
                    <label>Preferred Platform <span className="ep-req">*</span></label>
                    <div className="ep-platform-group">
                      {platforms.map((p) => (
                        <label
                          key={p.id}
                          className={`ep-platform-pill ${form.platform === p.id ? 'ep-platform-active' : ''}`}
                        >
                          <input
                            type="radio"
                            name="platform"
                            value={p.id}
                            checked={form.platform === p.id}
                            onChange={handleChange}
                            required
                          />
                          {p.label}
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

                <button type="submit" className="ep-btn-primary ep-submit">
                  Confirm Booking
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="ep-footer">
          <div className="ep-footer-inner">
            <div className="ep-footer-brand">
              <span className="ep-logo-text">Exponify<span className="ep-logo-ph">PH</span></span>
              <p>Premium digital services for businesses that demand the best.</p>
            </div>
            <div className="ep-footer-links">
              <button onClick={() => scrollTo('services')}>Services</button>
              <button onClick={() => scrollTo('about')}>About</button>
              <button onClick={() => scrollTo('booking')}>Book a Demo</button>
            </div>
            <p className="ep-footer-copy">© {new Date().getFullYear()} ExponifyPH. All rights reserved.</p>
          </div>
        </footer>

        {authModal && (
          <div className="ep-modal-overlay" onClick={() => setAuthModal(null)}>
            <div className="ep-modal" onClick={(e) => e.stopPropagation()}>
              <button className="ep-modal-close" onClick={() => setAuthModal(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="6"></line>
                </svg>
              </button>
              <h2>{authModal === 'signin' ? 'Welcome Back' : 'Create Account'}</h2>
              {authError && (
                <div style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {authError}
                </div>
              )}
              {authSuccess && (
                <div style={{ color: '#4caf50', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {authSuccess}
                </div>
              )}
              <form
                className="ep-modal-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const data = Object.fromEntries(formData);
                  if (authModal === 'signup') {
                    await handleSignUp({
                      firstName: data.firstName,
                      lastName: data.lastName,
                      email: data.email,
                      password: data.password,
                      phone: data.phone,
                    });
                  } else {
                    await handleSignIn({
                      email: data.email,
                      password: data.password,
                    });
                  }
                }}
              >
                {authModal === 'signup' && (
                  <div className="ep-modal-name-row">
                    <input type="text" name="firstName" placeholder="First Name" required />
                    <input type="text" name="lastName" placeholder="Last Name" required />
                  </div>
                )}
                <input type="email" name="email" placeholder="Email" required />
                {authModal === 'signup' && (
                  <input type="tel" name="phone" placeholder="+63 9123456789 (Optional)" style={{ flex: 1 }} />
                )}
                <input type="password" name="password" placeholder="Password" required />
                {authModal === 'signup' && (
                  <input type="password" name="confirmPassword" placeholder="Confirm Password" required />
                )}
                <button type="submit" className="ep-btn-primary" disabled={authLoading}>
                  {authLoading ? 'Processing...' : (authModal === 'signin' ? 'Sign In' : 'Sign Up')}
                </button>
              </form>
              <p className="ep-modal-switch">
                {authModal === 'signin' ? (
                  <>
                    Don't have an account?{' '}
                    <span onClick={() => setAuthModal('signup')}>Sign up</span>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <span onClick={() => setAuthModal('signin')}>Sign in</span>
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

export default LandingPage;
