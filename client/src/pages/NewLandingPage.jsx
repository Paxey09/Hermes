import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// New landing page components
import Navbar from '../components/newlanding/sections/Navbar.jsx';
import Hero from '../components/newlanding/sections/Hero.jsx';
import TrustedBy from '../components/newlanding/sections/TrustedBy.jsx';
import Services from '../components/newlanding/sections/Services.jsx';
import Features from '../components/newlanding/sections/Features.jsx';
import AIEngine from '../components/newlanding/sections/AIEngine.jsx';
import Process from '../components/newlanding/sections/Process.jsx';
import Testimonials from '../components/newlanding/sections/Testimonials.jsx';
import Contact from '../components/newlanding/sections/Contact.jsx';
import Footer from '../components/newlanding/sections/Footer.jsx';
import HomepageSupportWidget from './Components/HomepageSupportWidget.jsx';

// Modals
import BookingModal from '../components/newlanding/BookingModal.jsx';

function NewLandingPage() {
  const navigate = useNavigate();
  const [bookingModal, setBookingModal] = useState(false);

  const handleOpenBooking = () => setBookingModal(true);
  const handleOpenLogin = () => navigate('/login');
  const handleOpenSignup = () => navigate('/signup');

  return (
    <div className="min-h-screen bg-[#070b14] text-foreground overflow-x-hidden">
      <Navbar
        onLogin={handleOpenLogin}
        onSignup={handleOpenSignup}
        onBookDemo={handleOpenBooking}
      />
      <main>
        <Hero onCtaClick={handleOpenSignup} />
        <TrustedBy />
        <Services />
        <Features />
        <AIEngine />
        <Process />
        <Testimonials />
        <Contact />
      </main>
      <HomepageSupportWidget />
      <Footer />


      <BookingModal
        isOpen={bookingModal}
        onClose={() => setBookingModal(false)}
      />
    </div>
  );
}

export default NewLandingPage;
