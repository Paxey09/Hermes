function LandingNavbar({
  mobileMenuOpen,
  setMobileMenuOpen,
  onScrollTo,
  onOpenAuthModal,
}) {
  return (
    <nav className="ep-nav">
      <div className="ep-nav-inner">
        <span className="ep-logo-text">
          Exponify<span className="ep-logo-ph">PH</span>
        </span>

        <ul className="ep-nav-links">
          <li>
            <button onClick={() => onScrollTo('services')}>Services</button>
          </li>
          <li>
            <button onClick={() => onScrollTo('about')}>About</button>
          </li>
          <li>
            <button onClick={() => onScrollTo('booking')} className="ep-nav-cta">
              Book a Demo
            </button>
          </li>
        </ul>

        <ul className="ep-nav-auth">
          <li>
            <button
              className="ep-nav-auth-ghost"
              onClick={() => onOpenAuthModal('signin')}
            >
              Sign In
            </button>
          </li>
          <li>
            <button
              className="ep-nav-auth-primary"
              onClick={() => onOpenAuthModal('signup')}
            >
              Sign Up
            </button>
          </li>
        </ul>

        <button
          className={`ep-nav-toggle ${mobileMenuOpen ? 'ep-open' : ''}`}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`ep-nav-mobile ${mobileMenuOpen ? 'ep-open' : ''}`}>
        <div className="ep-nav-mobile-links">
          <button onClick={() => onScrollTo('services')}>Services</button>
          <button onClick={() => onScrollTo('about')}>About</button>
          <button onClick={() => onScrollTo('booking')} className="ep-nav-cta">
            Book a Demo
          </button>
        </div>

        <div className="ep-nav-mobile-auth">
          <button
            className="ep-nav-auth-ghost"
            onClick={() => onOpenAuthModal('signin')}
          >
            Sign In
          </button>
          <button
            className="ep-nav-auth-primary"
            onClick={() => onOpenAuthModal('signup')}
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
}

export default LandingNavbar;
