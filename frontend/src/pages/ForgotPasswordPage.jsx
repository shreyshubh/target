import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiForgotPassword, apiResetPassword } from '../api';
import styles from './LoginPage.module.css';

const PASSWORD_RULES = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase', test: (p) => /[a-z]/.test(p) },
  { label: 'Number', test: (p) => /[0-9]/.test(p) },
  { label: 'Special char', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1=email, 2=code+newPass
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiForgotPassword(email.trim());
      setSuccess('If a matching account exists, a reset code has been sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code.trim() || !newPassword) {
      setError('Please fill in all fields.');
      return;
    }

    const passedAll = PASSWORD_RULES.every(r => r.test(newPassword));
    if (!passedAll) {
      setError('New password does not meet all requirements.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await apiResetPassword(email.trim(), code.trim(), newPassword);
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgOrbs}>
        <div className={styles.orb1}></div>
        <div className={styles.orb2}></div>
        <div className={styles.orb3}></div>
      </div>

      <div className={styles.card}>
        <Link to="/login" className={styles.backLink}>← Back to login</Link>

        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>🔑</div>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>
            {step === 1 ? 'Enter your email to receive a reset code' : 'Enter the code and your new password'}
          </p>
        </div>

        <div className={styles.steps}>
          <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''}`}></div>
          <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`}></div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <div className={styles.inputGroup}>
              <label className={styles.label}>Email Address</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>📧</span>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@gmail.com"
                  className={styles.input}
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner}></span> : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <div className={styles.inputGroup}>
              <label className={styles.label}>Verification Code</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>🔢</span>
                <input
                  id="forgot-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className={styles.input}
                  maxLength={6}
                  autoFocus
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>New Password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  id="forgot-new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a new password"
                  className={styles.input}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {newPassword.length > 0 && (
                <div className={styles.strengthMeter}>
                  <div className={styles.strengthRules}>
                    {PASSWORD_RULES.map((r) => (
                      <span key={r.label} className={`${styles.rule} ${r.test(newPassword) ? styles.rulePassed : ''}`}>
                        {r.test(newPassword) ? '✓' : '✗'} {r.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner}></span> : 'Reset Password'}
            </button>

            <button
              type="button"
              className={styles.footerLink}
              onClick={() => { setStep(1); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', width: '100%', padding: '8px', fontFamily: 'inherit' }}
            >
              Didn't receive a code? Resend
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
