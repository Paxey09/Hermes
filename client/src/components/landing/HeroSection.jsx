function HeroSection({ onScrollTo }) {
  const stats = [
    { value: '120+', label: 'Clients Served' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '5+', label: 'Years of Excellence' },
  ];

  return (
    <section className="ep-hero" id="hero">
      <div className="ep-hero-grid-overlay" />
      <div className="ep-hero-glow" />

      <div className="ep-hero-inner">
        <div className="ep-hero-content">
          <p className="ep-hero-eyebrow">Digital Sales & Marketing</p>
          <h1 className="ep-hero-title">
            Exponify <span className="ep-gold">PH</span>
          </h1>
          <p className="ep-hero-sub">
            We combine AI-driven tools with proven digital marketing strategies to scale your business online — from CRM and ERP to social ads and smart automation.
          </p>

          <div className="ep-hero-actions">
            <button className="ep-btn-primary" onClick={() => onScrollTo('booking')}>
              Book a Consultation
            </button>
            <button className="ep-btn-ghost" onClick={() => onScrollTo('services')}>
              Watch Demo
            </button>
          </div>

          <div className="ep-hero-stats">
            {stats.map((stat) => (
              <div className="ep-stat" key={stat.label}>
                <span className="ep-stat-num">{stat.value}</span>
                <span className="ep-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ep-hero-side">
          <div className="ep-hero-side-card">
            <img
              src="https://media.base44.com/images/public/69f2d4780bf151eda077e38c/5fd007c8a_677929059_122109345321256076_7094985079586088692_n.jpg"
              alt="Exponify PH digital marketing"
            />

            <div className="ep-hero-badge-wrap">
              <div className="ep-hero-badge">
                <span className="ep-badge-globe">🎯</span>
                <p className="ep-badge-text">Smart Planning</p>
              </div>
              <div className="ep-hero-badge">
                <span className="ep-badge-globe">📈</span>
                <p className="ep-badge-text">Scalable Growth</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
