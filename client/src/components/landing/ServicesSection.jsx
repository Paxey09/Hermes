import { services } from './data/services.jsx';

function ServicesSection() {
  return (
    <section className="ep-section ep-services-section" id="services">
      <div className="ep-section-inner">
        <p className="ep-section-eyebrow">What We Offer</p>
        <h2 className="ep-section-title">
          Digital Services <span className="ep-gold">Designed for Growth</span>
        </h2>
        <p className="ep-section-sub">
          From concept to conversion, our full-suite digital services give your
          business the competitive edge it deserves.
        </p>

        <div className="ep-services-grid">
          {services.map((service) => (
            <div className="ep-service-card" key={service.title}>
              <span className="ep-service-icon">{service.icon}</span>
              <h3 className="ep-service-title">{service.title}</h3>
              <p className="ep-service-desc">{service.desc}</p>
              <div className="ep-card-line" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
