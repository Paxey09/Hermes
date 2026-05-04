function FooterSection({ onScrollTo }) {
  return (
    <footer className="ep-footer">
      <div className="ep-footer-inner">
        <div className="ep-footer-brand">
          <span className="ep-logo-text">
            Exponify<span className="ep-logo-ph">PH</span>
          </span>
          <p>Premium digital services for businesses that demand the best.</p>
        </div>

        <div className="ep-footer-links">
          <button onClick={() => onScrollTo('services')}>Services</button>
          <button onClick={() => onScrollTo('about')}>About</button>
          <button onClick={() => onScrollTo('booking')}>Book a Demo</button>
        </div>

        <p className="ep-footer-copy">
          © {new Date().getFullYear()} ExponifyPH. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default FooterSection;
