import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, adminAuth } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const sectionStyle = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '20px',
  marginBottom: '24px',
  boxShadow: '0 10px 22px rgba(0,0,0,0.08)',
  maxWidth: '680px',
  margin: '0 auto 24px',
};

const buttonStyle = {
  display: 'inline-block',
  marginTop: '16px',
  padding: '12px 20px',
  borderRadius: '16px',
  background: '#3f6378',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '1rem',
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '14px',
  border: '1px solid #d2d6dc',
  fontSize: '1rem',
  color: '#0f172a',
};

const formButton = {
  ...buttonStyle,
  width: '100%',
};

const errorStyle = {
  color: '#991b1b',
  fontSize: '0.95rem',
  minHeight: '24px',
  marginTop: '12px',
};

function Users() {
  const { currentUser } = useAuth();
  const [identityNumber, setIdentityNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createUserProfile = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (!currentUser) {
        throw new Error('משתמש לא מאומת. יש להתחבר מחדש.');
      }

      const newUser = await createUserWithEmailAndPassword(adminAuth, email, '123456');
      const authUid = newUser.user.uid;

      await setDoc(doc(db, 'user_profiles', authUid), {
        authUid,
        identityNumber,
        fullName,
        phone,
        email,
        role,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await signOut(adminAuth);

      setMessage('פרופיל משתמש נוצר בהצלחה עם חשבון Auth.');
      setIdentityNumber('');
      setFullName('');
      setPhone('');
      setEmail('');
      setRole('member');
    } catch (err) {
      console.error('createUserProfile error', err);
      setError(err?.message || 'אירעה שגיאה בזמן יצירת פרופיל המשתמש. נסו שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={sectionStyle}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>משתמשים</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#4c5663' }}>
        פרופילי משתמשים נוצרים רק על ידי מנהלים. הזינו את פרטי המשתמש כדי לשמור אותו ב-`user_profiles`.
      </p>

      <form onSubmit={createUserProfile} style={{ display: 'grid', gap: '16px' }}>
        <label>
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1f2933' }}>תעודת זהות</span>
          <input
            type="text"
            value={identityNumber}
            onChange={(e) => setIdentityNumber(e.target.value)}
            style={inputStyle}
            required
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1f2933' }}>שם מלא</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={inputStyle}
            required
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1f2933' }}>טלפון</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
            required
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1f2933' }}>אימייל</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1f2933' }}>תפקיד</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={inputStyle}
            required
          >
            <option value="member">member</option>
            <option value="admin">admin</option>
          </select>
        </label>

        <button type="submit" style={formButton} disabled={loading}>
          {loading ? 'שומר...' : 'צור פרופיל משתמש'}
        </button>
      </form>

      {message && <div style={{ color: '#064e3b', fontSize: '0.95rem', marginTop: '12px' }}>{message}</div>}
      {error && <div style={errorStyle}>{error}</div>}

      <Link to="/" style={buttonStyle}>חזרה לדף הבית</Link>
    </section>
  );
}

export default Users;
