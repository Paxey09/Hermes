function AuthModal({
  mode,
  loading,
  error,
  success,
  onClose,
  onSwitchMode,
  onSignIn,
  onSignUp,
}) {
  const isSignIn = mode === 'signin';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    if (isSignIn) {
      await onSignIn({
        email: data.email,
        password: data.password,
      });
      return;
    }

    await onSignUp({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
  };

  return (
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ep-modal-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="6"></line>
          </svg>
        </button>

        <h2>{isSignIn ? 'Welcome Back' : 'Create Account'}</h2>

        {error && (
          <div style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ color: '#4caf50', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {success}
          </div>
        )}

        <form className="ep-modal-form" onSubmit={handleSubmit}>
          {!isSignIn && (
            <div className="ep-modal-name-row">
              <input type="text" name="firstName" placeholder="First Name" required />
              <input type="text" name="lastName" placeholder="Last Name" required />
            </div>
          )}

          <input type="email" name="email" placeholder="Email" required />

          {!isSignIn && (
            <input
              type="tel"
              name="phone"
              placeholder="+63 9123456789 (Optional)"
              style={{ flex: 1 }}
            />
          )}

          <input type="password" name="password" placeholder="Password" required />

          {!isSignIn && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              required
            />
          )}

          <button type="submit" className="ep-btn-primary" disabled={loading}>
            {loading ? 'Processing...' : isSignIn ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="ep-modal-switch">
          {isSignIn ? (
            <>
              Don&apos;t have an account?{' '}
              <span onClick={() => onSwitchMode('signup')}>Sign up</span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span onClick={() => onSwitchMode('signin')}>Sign in</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default AuthModal;
