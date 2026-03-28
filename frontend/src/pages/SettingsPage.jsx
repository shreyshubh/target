import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { apiChangePassword, apiUpdateProfile, apiDeleteAccount, saveSyllabus } from '../api';
import styles from './SettingsPage.module.css';

const PASSWORD_RULES = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase', test: (p) => /[a-z]/.test(p) },
  { label: 'Number', test: (p) => /[0-9]/.test(p) },
  { label: 'Special char', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

export default function SettingsPage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);

  // Profile
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState({ type: '', text: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Import
  const [importMsg, setImportMsg] = useState({ type: '', text: '' });

  // ── Profile Update ──────────────────────────────────────
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    if (username.trim() === user?.username && email.trim() === user?.email) {
      setProfileMsg({ type: 'info', text: 'No changes to save.' });
      return;
    }
    setProfileLoading(true);
    try {
      const data = await apiUpdateProfile({
        username: username.trim(),
        email: email.trim(),
      });
      login(data.token, data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Change Password ─────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmNew) {
      setPasswordMsg({ type: 'error', text: 'Please fill all fields.' });
      return;
    }

    const allPassed = PASSWORD_RULES.every(r => r.test(newPassword));
    if (!allPassed) {
      setPasswordMsg({ type: 'error', text: 'New password does not meet all requirements.' });
      return;
    }

    if (newPassword !== confirmNew) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      await apiChangePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNew('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Import Syllabus ─────────────────────────────────────
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.tracks || !Array.isArray(data.tracks)) {
        throw new Error('Invalid file format: missing tracks array.');
      }
      // Validate structure
      for (const track of data.tracks) {
        if (!track.id || !track.label || !Array.isArray(track.sections)) {
          throw new Error(`Invalid track: "${track.label || track.id || 'unknown'}"`);
        }
      }
      await saveSyllabus(data.tracks);
      queryClient.invalidateQueries({ queryKey: ['syllabus'] });
      setImportMsg({ type: 'success', text: `Imported ${data.tracks.length} subjects successfully!` });
    } catch (err) {
      setImportMsg({ type: 'error', text: err.message });
    }
    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Delete Account ──────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteMsg({ type: 'error', text: 'Password is required.' });
      return;
    }
    setDeleteLoading(true);
    try {
      await apiDeleteAccount(deletePassword);
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setDeleteMsg({ type: 'error', text: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>⚙️ Settings</h2>

      {/* ── Profile ────────────────────────── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>👤 Edit Profile</h3>
        <form onSubmit={handleProfileUpdate} className={styles.form}>
          {profileMsg.text && <div className={`${styles.msg} ${styles[profileMsg.type]}`}>{profileMsg.text}</div>}
          <div className={styles.field}>
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className={styles.input} />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} />
          </div>
          <button type="submit" className={styles.primaryBtn} disabled={profileLoading}>
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* ── Change Password ────────────────── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>🔒 Change Password</h3>
        <form onSubmit={handleChangePassword} className={styles.form}>
          {passwordMsg.text && <div className={`${styles.msg} ${styles[passwordMsg.type]}`}>{passwordMsg.text}</div>}
          <div className={styles.field}>
            <label>Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={styles.input} />
          </div>
          <div className={styles.field}>
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={styles.input} />
            {newPassword && (
              <div className={styles.rules}>
                {PASSWORD_RULES.map((r) => (
                  <span key={r.label} className={r.test(newPassword) ? styles.rulePassed : styles.ruleFail}>
                    {r.test(newPassword) ? '✓' : '✗'} {r.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className={styles.field}>
            <label>Confirm New Password</label>
            <input type="password" value={confirmNew} onChange={(e) => setConfirmNew(e.target.value)} className={styles.input} />
          </div>
          <button type="submit" className={styles.primaryBtn} disabled={passwordLoading}>
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* ── Import / Export ─────────────────── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>📦 Import Syllabus</h3>
        <p className={styles.cardDesc}>Upload a JSON file previously exported from this app. This will <strong>replace</strong> your current syllabus.</p>
        {importMsg.text && <div className={`${styles.msg} ${styles[importMsg.type]}`}>{importMsg.text}</div>}
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className={styles.fileInput} />
      </div>

      {/* ── Danger Zone ─────────────────────── */}
      <div className={`${styles.card} ${styles.dangerCard}`}>
        <h3 className={styles.cardTitle}>⚠️ Danger Zone</h3>
        <p className={styles.cardDesc}>Permanently delete your account and all associated data. This action cannot be undone.</p>
        {deleteMsg.text && <div className={`${styles.msg} ${styles[deleteMsg.type]}`}>{deleteMsg.text}</div>}
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} className={styles.dangerBtn}>Delete My Account</button>
        ) : (
          <div className={styles.deleteConfirm}>
            <p style={{ color: '#ff6b6b', fontWeight: 500, fontSize: '13px' }}>Enter your password to confirm:</p>
            <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className={styles.input} placeholder="Your password" />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={handleDeleteAccount} className={styles.dangerBtn} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button onClick={() => { setDeleteConfirm(false); setDeletePassword(''); }} className={styles.cancelBtn}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
