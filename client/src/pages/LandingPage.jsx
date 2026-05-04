import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';
import { supabase } from '../config/supabaseClient.js';

import LandingNavbar from '../components/landing/LandingNavbar.jsx';
import HeroSection from '../components/landing/HeroSection.jsx';
import ServicesSection from '../components/landing/ServicesSection.jsx';
import AboutSection from '../components/landing/AboutSection.jsx';
import BookingSection from '../components/landing/BookingSection.jsx';
import FooterSection from '../components/landing/FooterSection.jsx';
import AuthModal from '../components/landing/AuthModal.jsx';
import ChatbotWidget from '../components/landing/ChatbotWidget.jsx';

import useLandingAnimations from '../hooks/useLandingAnimations.js';

function LandingPage() {
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  useLandingAnimations();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (authSuccess || authError) {
      const timer = setTimeout(() => {
        setAuthSuccess('');
        setAuthError('');
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [authSuccess, authError]);

  const handleSignUp = async (formData) => {
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailConfirmTo: false,
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`.trim(),
            role: 'Client',
          },
        },
      });

      if (signUpError) throw signUpError;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        throw new Error('Profile was not created. Please try signing in again.');
      }

      console.log('Profile created:', profileData);
      setAuthSuccess('Account created successfully! You can now log in.');
    } catch (error) {
      console.error('Sign up error:', error);
      setAuthError(error.message || 'Failed to create account');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = async (formData) => {
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      let userRole = 'Client';

      if (userError) {
        const { error: createError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || '',
          role: 'Client',
        });

        if (createError) throw createError;
      } else if (userData?.role) {
        userRole = userData.role;
      }

      setAuthModal(null);

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

  return (
    <div className="ep-root">
      <LandingNavbar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onScrollTo={scrollTo}
        onOpenAuthModal={setAuthModal}
      />

      <HeroSection onScrollTo={scrollTo} />
      <ServicesSection />
      <AboutSection onScrollTo={scrollTo} />
      <BookingSection />
      <FooterSection onScrollTo={scrollTo} />

      <ChatbotWidget />

      {authModal && (
        <AuthModal
          mode={authModal}
          loading={authLoading}
          error={authError}
          success={authSuccess}
          onClose={() => setAuthModal(null)}
          onSwitchMode={setAuthModal}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
        />
      )}
    </div>
  );
}

export default LandingPage;
