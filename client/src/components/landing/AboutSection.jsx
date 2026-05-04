const pillars = [
  { num: '01', title: 'Discovery', body: 'We audit your current presence and align on goals.' },
  { num: '02', title: 'Strategy', body: 'A tailored roadmap built for your specific market.' },
  { num: '03', title: 'Execution', body: 'Our experts deliver with precision and speed.' },
  { num: '04', title: 'Growth', body: 'Continuous optimization to scale your results.' },
];

function AboutSection({ onScrollTo }) {
  return (
    <section className="ep-section ep-about-section" id="about">
      <div className="ep-section-inner ep-about-inner">
        <div className="ep-about-text">
          <p className="ep-section-eyebrow">About Exponify</p>
          <h2 className="ep-section-title">
            Where Strategy Meets <span className="ep-gold">Excellence</span>
          </h2>
          <p className="ep-about-body">
            Exponify is a premier digital services firm based in the Philippines,
            serving businesses across industries who demand more than the ordinary.
            We do not just deliver services — we build lasting digital foundations.
          </p>
          <p className="ep-about-body">
            Our team of specialists combines creative vision with analytical rigor
            to produce outcomes that are not only beautiful but measurably effective.
            Every engagement begins with listening, and ends with results that speak
            for themselves.
          </p>
          <button className="ep-btn-primary" onClick={() => onScrollTo('booking')}>
            Work With Us
          </button>
        </div>

        <div className="ep-about-pillars">
          {pillars.map((pillar) => (
            <div className="ep-pillar" key={pillar.num}>
              <span className="ep-pillar-num">{pillar.num}</span>
              <div>
                <h4 className="ep-pillar-title">{pillar.title}</h4>
                <p className="ep-pillar-body">{pillar.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
