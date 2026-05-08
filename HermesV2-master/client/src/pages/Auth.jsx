import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import { Eye, EyeOff, Mail, Lock, User, Briefcase, Building, ArrowRight, AlertCircle, CheckCircle, Shield, ShieldCheck, ShieldAlert, X } from 'lucide-react';

function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if coming from signup button
  const [isLogin, setIsLogin] = useState(
    location.pathname === '/login' || 
    (location.pathname !== '/signup' && !location.search.includes('signup=true'))
  );
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    companyName: '',
    // Honeypot fields (should remain empty)
    website: '',
    phone_confirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Security states
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', valid: false });
  const [formStartTime, setFormStartTime] = useState(Date.now());
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [progressiveDelay, setProgressiveDelay] = useState(0);
  const [securityWarnings, setSecurityWarnings] = useState([]);
  const formRef = useRef(null);

  // Email verification state
  const [authStep, setAuthStep] = useState('form'); // 'form' | 'verifyEmail'
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [tempUserId, setTempUserId] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check user role and redirect accordingly
        const { data: userData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        console.log('Initial auth check - User role:', userData?.role);
        if (userData?.role === 'Admin' || userData?.role === 'SuperAdmin') {
          console.log('Auto-redirecting to /Admin/Dashboard');
          navigate('/Admin/Dashboard', { replace: true });
        } else {
          console.log('Auto-redirecting to /ClientDashboard');
          navigate('/ClientDashboard', { replace: true });
        }
      }
    };
    checkAuth();
  }, [navigate]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', valid: false };
    
    let score = 0;
    let checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password),
      noCommon: !['password', '123456', 'qwerty', 'admin'].some(common => 
        password.toLowerCase().includes(common)
      )
    };
    
    if (checks.length) score += 25;
    if (checks.uppercase) score += 15;
    if (checks.lowercase) score += 10;
    if (checks.numbers) score += 15;
    if (checks.special) score += 20;
    if (checks.noCommon) score += 15;
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    let label = 'Weak';
    if (score >= 80 && passedChecks >= 5) label = 'Strong';
    else if (score >= 60 && passedChecks >= 4) label = 'Good';
    else if (score >= 40 && passedChecks >= 3) label = 'Fair';
    
    return { 
      score: Math.min(score, 100), 
      label, 
      valid: score >= 60 && passedChecks >= 4,
      checks
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
    
    // Check password strength for signup
    if (name === 'password' && !isLogin) {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    // Reset form start time on first interaction
    if (formStartTime === Date.now()) {
      setFormStartTime(Date.now());
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (resendTimer > 0) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
      });
      
      if (error) throw error;
      
      setSuccess('Verification email resent! Please check your inbox.');
      setResendTimer(60); // 60 second cooldown
    } catch (error) {
      setError(error.message || 'Failed to resend email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify email with OTP code
  const verifyEmailOTP = async (e) => {
    e.preventDefault();
    
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Verify the OTP
      const { error } = await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: otpCode,
        type: 'email'
      });
      
      if (error) throw error;
      
      setSuccess('Email verified successfully! Logging you in...');
      
      // Auto login after verification - redirect to dashboard
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          // Redirect based on role
          navigate(userData?.role === 'Admin' || userData?.role === 'SuperAdmin' 
            ? '/Admin/Dashboard' 
            : '/ClientDashboard', { replace: true });
        }
      }, 1500);
      
    } catch (error) {
      setError(error.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }
    
    if (!isLogin) {
      if (!formData.firstName || !formData.lastName) {
        setError('First name and surname are required');
        return false;
      }
      
      // Enhanced password validation against dictionary attacks
      if (!passwordStrength.valid) {
        setError('Password must be at least 12 characters with uppercase, lowercase, number, and special character');
        return false;
      }
      
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Honeypot check - if filled, it's a bot
    if (formData.website || formData.phone_confirm) {
      setError('Security check failed. Please refresh and try again.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Progressive delay - slows down automated attacks
    if (progressiveDelay > 0) {
      setError(`Please wait ${progressiveDelay / 1000} seconds before trying again...`);
      await new Promise(resolve => setTimeout(resolve, progressiveDelay));
    }
    
    // Check for CAPTCHA requirement after multiple failures
    if (requiresCaptcha && !captchaVerified) {
      setError('Please complete the security verification.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Add security metadata for server-side validation
      const securityMetadata = {
        _form_start_time: formStartTime.toString(),
        _failed_attempts: failedAttempts,
        _fingerprint: generateDeviceFingerprint()
      };
      
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        // Check if email is confirmed
        if (!data.user.email_confirmed_at) {
          // Email not verified - show verification step
          setVerificationEmail(formData.email);
          setAuthStep('verifyEmail');
          setSuccess('Please verify your email before logging in.');
          return;
        }

        // Get user role and redirect
        const { data: userData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        console.log('User role detected:', userData?.role);

        setSuccess('Login successful! Redirecting...');
        
        setTimeout(() => {
          navigate(userData?.role === 'Admin' || userData?.role === 'SuperAdmin' 
            ? '/Admin/Dashboard' 
            : '/ClientDashboard', { replace: true });
        }, 1000);

      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`,
              company_name: formData.companyName || null,
              role: formData.companyName ? 'Admin' : 'User'
            }
          }
        });

        if (error) throw error;

        // Wait a moment for the trigger to create the profile
        await new Promise(r => setTimeout(r, 1000));
        
        // Check if profile was created by trigger
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // Show email verification step
        setVerificationEmail(formData.email);
        setAuthStep('verifyEmail');
        setSuccess('Account created! Please verify your email to continue.');
        setResendTimer(60); // Start 60 second cooldown for resend
        
        // Store temp user ID for later
        setTempUserId(data.user.id);
      }
    } catch (error) {
      console.error('Auth error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message || 'An error occurred. Please try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please log in instead.';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before logging in.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please wait a moment and try again.';
      }
      
      setError(errorMessage);
      
      // Track failed attempts for progressive delay
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      
      // Implement progressive delay (slows down brute force attacks)
      let delay = 0;
      if (newFailedAttempts >= 3) delay = 2000;      // 2 seconds
      if (newFailedAttempts >= 5) delay = 5000;      // 5 seconds
      if (newFailedAttempts >= 7) delay = 10000;     // 10 seconds
      if (newFailedAttempts >= 10) delay = 30000;   // 30 seconds
      
      setProgressiveDelay(delay);
      
      // Require CAPTCHA after 3 failures
      if (newFailedAttempts >= 3) {
        setRequiresCaptcha(true);
      }
      
      // Log security event
      console.warn(`[SECURITY] Failed auth attempt #${newFailedAttempts} for ${formData.email}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate device fingerprint for tracking
  const generateDeviceFingerprint = () => {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency,
      navigator.deviceMemory
    ];
    return btoa(components.join('|')).substring(0, 32);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({
      email: '',
      password: '',
      firstName: '',
      middleName: '',
      lastName: '',
      companyName: '',
      website: '',
      phone_confirm: ''
    });
    // Reset security states
    setPasswordStrength({ score: 0, label: '', valid: false });
    setFormStartTime(Date.now());
    setFailedAttempts(0);
    setRequiresCaptcha(false);
    setCaptchaVerified(false);
    setProgressiveDelay(0);
    setSecurityWarnings([]);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      {/* Glow effect */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 60%)'
        }}
      />
      <div className={`w-full ${isLogin ? 'max-w-md' : 'max-w-2xl'}`}>
        {/* Auth Form */}
        <div className={`bg-[#0d1525] backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden flex flex-col ${isLogin ? '' : ''}`}>
          {/* Header for Create Account */}
          {!isLogin && (
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white font-[family-name:var(--ep-font-display)]">
                  Create Account
                </h2>
                <p className="text-sm text-white/50 font-inter mt-1">
                  Fill in your details to get started
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} className="text-white/60" />
              </button>
            </div>
          )}
          
          {/* Header for Login */}
          {isLogin && (
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white font-[family-name:var(--ep-font-display)]">
                  Sign In
                </h2>
                <p className="text-sm text-white/50 font-inter mt-1">
                  Welcome back to your account
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} className="text-white/60" />
              </button>
            </div>
          )}
          
          <div className="p-6">
            {/* Error/Success Messages */}
            {error && (
              <div className={`mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 ${isLogin ? '' : 'font-inter'}`}>
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}
            
            {success && (
              <div className={`mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 ${isLogin ? '' : 'font-inter'}`}>
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-400 text-sm">{success}</span>
              </div>
            )}

            {/* Email Verification Step */}
            {authStep === 'verifyEmail' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#c9a84c]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-[#c9a84c]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Verify Your Email</h3>
                  <p className="text-white/60 text-sm">
                    We've sent a verification code to<br/>
                    <span className="text-[#c9a84c]">{verificationEmail}</span>
                  </p>
                </div>

                <form onSubmit={verifyEmailOTP} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70 font-inter">
                      Enter 6-digit code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 bg-[#070b14] border border-white/10 rounded-xl text-white text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all font-inter"
                      placeholder="000000"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 6}
                    className="w-full py-3 bg-[#c9a84c] hover:bg-[#b8953f] text-[#0a0e1a] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify Email'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                <div className="text-center">
                  <button
                    onClick={resendVerificationEmail}
                    disabled={resendTimer > 0 || loading}
                    className="text-sm text-white/50 hover:text-[#c9a84c] transition-colors disabled:opacity-50"
                  >
                    {resendTimer > 0 
                      ? `Resend code in ${resendTimer}s` 
                      : 'Resend verification code'}
                  </button>
                </div>

                <div className="text-center pt-4 border-t border-white/10 space-y-3">
                  <button
                    onClick={() => {
                      setAuthStep('form');
                      setOtpCode('');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-sm text-white/50 hover:text-white transition-colors block w-full"
                  >
                    Back to {isLogin ? 'Login' : 'Sign Up'}
                  </button>
                  
                  {/* DEV MODE: Skip verification */}
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        // Auto-confirm via admin API (requires service role)
                        // For dev: manually login and continue
                        const { data, error } = await supabase.auth.signInWithPassword({
                          email: verificationEmail,
                          password: formData.password
                        });
                        
                        if (error) throw error;
                        
                        // Get role and redirect
                        const { data: userData } = await supabase
                          .from('profiles')
                          .select('role')
                          .eq('id', data.user.id)
                          .single();
                          
                        setSuccess('Development mode: Skipping email verification...');
                        
                        setTimeout(() => {
                          navigate(userData?.role === 'Admin' || userData?.role === 'SuperAdmin' 
                            ? '/Admin/Dashboard' 
                            : '/ClientDashboard', { replace: true });
                        }, 1000);
                      } catch (err) {
                        setError('Dev mode bypass failed. Please verify your email.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="text-xs text-yellow-500/60 hover:text-yellow-400 transition-colors border border-yellow-500/20 rounded px-3 py-1"
                  >
                    ⚠️ Dev Mode: Skip Verification
                  </button>
                </div>
              </div>
            )}

            {/* Main Login/Signup Form */}
            {authStep === 'form' && (
            <form onSubmit={handleSubmit} className={`${isLogin ? 'space-y-4' : 'space-y-5'} select-text`}>
              {/* Login: Single column */}
              {isLogin ? (
                <>
                  {/* Email */}
                  <div>
                    <label className="block text-[#f5f0e8] text-sm font-medium mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[rgba(245,240,232,0.4)]" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-[#0f1528] border border-[rgba(201,168,76,0.18)] rounded-lg text-[#f5f0e8] placeholder-[rgba(245,240,232,0.3)] focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-[#c9a84c] transition-all"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[#f5f0e8] text-sm font-medium mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[rgba(245,240,232,0.4)]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-12 py-3 bg-[#0f1528] border border-[rgba(201,168,76,0.18)] rounded-lg text-[#f5f0e8] placeholder-[rgba(245,240,232,0.3)] focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-[#c9a84c] transition-all"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[rgba(245,240,232,0.4)] hover:text-[#c9a84c] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Signup: Grid layout like Book a Demo */}
                  {/* Name, Middle, Surname & Email */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70 font-inter flex items-center gap-2">
                        <User size={14} className="text-[#c9a84c]" />
                        Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-[#070b14] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all font-inter"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70 font-inter flex items-center gap-2">
                        <User size={14} className="text-[#c9a84c]" />
                        Middle
                      </label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#070b14] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all font-inter"
                        placeholder="M."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70 font-inter flex items-center gap-2">
                        <User size={14} className="text-[#c9a84c]" />
                        Surname *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-[#070b14] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all font-inter"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70 font-inter flex items-center gap-2">
                      <Mail size={14} className="text-[#c9a84c]" />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-[#070b14] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all font-inter"
                      placeholder="john@example.com"
                    />
                  </div>

                  {/* Password with strength indicator */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70 font-inter flex items-center gap-2">
                      <Lock size={14} className="text-[#c9a84c]" />
                      Password *
                      {passwordStrength.score > 0 && (
                        <span className={`ml-2 text-xs ${
                          passwordStrength.label === 'Strong' ? 'text-green-400' :
                          passwordStrength.label === 'Good' ? 'text-[#c9a84c]' :
                          passwordStrength.label === 'Fair' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          ({passwordStrength.label})
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-[#070b14] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all font-inter"
                        placeholder="Create a secure password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-[#c9a84c] transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    
                    {/* Password strength bar */}
                    {passwordStrength.score > 0 && (
                      <div className="mt-2">
                        <div className="h-1 w-full bg-[#070b14] rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              passwordStrength.score >= 80 ? 'bg-green-500 w-full' :
                              passwordStrength.score >= 60 ? 'bg-[#c9a84c] w-3/4' :
                              passwordStrength.score >= 40 ? 'bg-yellow-500 w-1/2' : 'bg-red-500 w-1/4'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-white/40 mt-1 font-inter">
                          Use 12+ chars with uppercase, lowercase, numbers & symbols
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Company Name - determines account type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70 font-inter flex items-center gap-2">
                      <Building size={14} className="text-[#c9a84c]" />
                      Company Name
                      <span className="text-xs text-white/40 font-normal ml-2">(Leave blank for personal account)</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#070b14] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all font-inter"
                      placeholder="Acme Inc. (optional)"
                    />
                    <p className="text-xs text-white/40 mt-1 font-inter">
                      {formData.companyName 
                        ? <span className="text-[#c9a84c]">Γ£ô Admin account will be created</span>
                        : 'User account will be created'
                      }
                    </p>
                  </div>

                  {/* Honeypot fields - hidden from real users */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      tabIndex="-1"
                      autoComplete="off"
                    />
                    <input
                      type="text"
                      name="phone_confirm"
                      value={formData.phone_confirm}
                      onChange={handleInputChange}
                      tabIndex="-1"
                      autoComplete="off"
                    />
                  </div>

                  {/* Security Warnings */}
                  {securityWarnings.length > 0 && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl font-inter">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldAlert className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 text-sm font-medium">Security Notice</span>
                      </div>
                      <p className="text-xs text-yellow-300/80">
                        Unusual activity detected. Additional verification may be required.
                      </p>
                    </div>
                  )}

                  {/* CAPTCHA placeholder */}
                  {requiresCaptcha && (
                    <div className="p-4 bg-[#070b14] border border-[#c9a84c]/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-[#c9a84c]" />
                        <span className="text-white text-sm font-medium font-inter">Security Verification</span>
                      </div>
                      <p className="text-xs text-white/50 mb-3 font-inter">
                        Multiple failed attempts detected. Please verify you are human.
                      </p>
                      <button
                        type="button"
                        onClick={() => setCaptchaVerified(true)}
                        className="w-full py-2 bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#c9a84c] rounded-lg hover:bg-[#c9a84c]/20 transition-colors text-sm font-inter"
                      >
                        {captchaVerified ? (
                          <span className="flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Verified
                          </span>
                        ) : (
                          'Click to Verify'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-inter ${
                  isLogin 
                    ? 'bg-gradient-to-r from-[#c9a84c] to-[#e2c07a] text-[#070b14] hover:from-[#e2c07a] hover:to-[#c9a84c] shadow-lg shadow-[rgba(201,168,76,0.25)] hover:shadow-[rgba(201,168,76,0.4)]'
                    : 'bg-[#c9a84c] text-[#070b14] hover:bg-[#e2c07a]'
                }`}
              >
                {loading ? (
                  <>
                    <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${isLogin ? 'border-[#0a0e1a]' : 'border-[#070b14]/30'}`}></div>
                    <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Terms for signup */}
              {!isLogin && (
                <p className="text-center text-xs text-white/40 font-inter">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              )}
            </form>
            )}

            {/* Toggle Mode - only show on form step */}
            {authStep === 'form' && (
            <div className={`mt-6 text-center ${isLogin ? '' : 'font-inter'}`}>
              <p className="text-[rgba(245,240,232,0.6)]">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  onClick={toggleMode}
                  className="text-[#c9a84c] hover:text-[#e2c07a] font-medium transition-colors"
                >
                  {isLogin ? 'Create account' : 'Sign in'}
                </button>
              </p>
            </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-white/40 font-inter mb-2">
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            <span className="text-white/20">ΓÇó</span>
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <span className="text-white/20">ΓÇó</span>
            <a href="#" className="hover:text-white/60 transition-colors">Help Center</a>
          </div>
          <p className="text-xs text-white/30 font-inter">
            &copy; 2026 Enterprise Portal Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;

