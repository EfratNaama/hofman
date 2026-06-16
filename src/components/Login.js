import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const sectionStyle = {
  background: '#ffffff',
  borderRadius: '22px',
  padding: '28px',
  marginBottom: '24px',
  boxShadow: '0 16px 38px rgba(0,0,0,0.12)',
  maxWidth: '520px',
  margin: '0 auto 24px',
};

const titleStyle = {
  fontSize: '2rem',
  marginBottom: '14px',
  color: '#1b3f5b',
};

const textStyle = {
  fontSize: '1rem',
  lineHeight: 1.8,
  color: '#4c5663',
  marginBottom: '24px',
};

const formStyle = {
  display: 'grid',
  gap: '16px',
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '16px',
  border: '1px solid #d2d6dc',
  fontSize: '1rem',
  color: '#0f172a',
};

const buttonStyle = {
  padding: '14px 16px',
  borderRadius: '16px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
};

const primaryButton = {
  ...buttonStyle,
  background: '#3f6378',
  color: '#ffffff',
};

const secondaryButton = {
  ...buttonStyle,
  background: '#e9e5df',
  color: '#1f2933',
};

const googleButton = {
  ...buttonStyle,
  background: '#1a73e8',
  color: '#ffffff',
};

const errorStyle = {
  color: '#991b1b',
  fontSize: '0.95rem',
  minHeight: '24px',
};

function getFriendlyErrorMessage(error) {
  if (!error) return 'אירעה שגיאה אנונימית. נסו שוב.';
  const code = error.code || '';
  const message = error.message || '';

  if (code === 'unavailable' || code === 'failed-precondition' || /offline/i.test(message)) {
    return 'חיבור ל-Firestore אינו זמין כרגע. בדקו את חיבור הרשת ונסו שוב מאוחר יותר.';
  }

  if (code === 'permission-denied') {
    return 'אין לך הרשאה לבצע פעולה זו. בדוק את הגדרות Firestore או היכנס מחדש.';
  }

  if (code === 'auth/network-request-failed') {
    return 'חיבור לאינטרנט נכשל. בדקו את חיבור הרשת ונסו שוב.';
  }

  return message || 'נכשל ניסיון הכניסה. בדקו את האימייל והסיסמה ונסו שוב.';
}

function Login() {
  const navigate = useNavigate();
  const { signInEmail, signInGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    console.log('Login: email submit', email);

    try {
      // Add 10 second timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout: operation took too long')), 10000)
      );
      
      const result = await Promise.race([signInEmail(email, password), timeoutPromise]);
      console.log('Login: signInEmail returned', result);
      
      if (!result || typeof result !== 'object') {
        throw new Error('Unexpected response from login');
      }

      const { credential, firestoreResult } = result;
      
      if (!credential || !credential.user) {
        throw new Error('Failed to authenticate');
      }

      if (firestoreResult && !firestoreResult.success) {
        const message = getFriendlyErrorMessage(firestoreResult.error);
        setError(message);
        alert(`Login error: ${message}`);
        return;
      }
      
      console.log('Login: success, navigating to home');
      navigate('/');
    } catch (err) {
      console.error('Login email error', err.code, err.message, err);
      const message = getFriendlyErrorMessage(err);
      setError(message);
      alert(`Login error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    console.log('Login: Google submit');

    try {
      // Add 10 second timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout: operation took too long')), 10000)
      );
      
      const result = await Promise.race([signInGoogle(), timeoutPromise]);
      console.log('Login: signInGoogle returned', result);

      if (!result || typeof result !== 'object') {
        throw new Error('Unexpected response from login');
      }

      const { credential, firestoreResult } = result;
      
      if (!credential || !credential.user) {
        throw new Error('Failed to authenticate');
      }

      if (firestoreResult && !firestoreResult.success) {
        const message = getFriendlyErrorMessage(firestoreResult.error);
        setError(message);
        alert(`Login error: ${message}`);
        return;
      }
      
      console.log('Login: success, navigating to home');
      navigate('/');
    } catch (err) {
      console.error('Login Google error', err.code, err.message, err);
      const message = getFriendlyErrorMessage(err);
      setError(message);
      alert(`Login error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>כניסה לחשבון</h2>
      <p style={textStyle}>
        התחברו באמצעות כתובת דוא"ל וסיסמה או השתמשו בכניסה עם Google. ניתן לאפס את הטופס בכל עת.
      </p>

      <form onSubmit={handleEmailLogin} style={formStyle}>
        <label>
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1f2933' }}>אימייל</span>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1f2933' }}>סיסמה</span>
          <input
            type="password"
            placeholder="הקלידו סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
        </label>

        <div style={{ display: 'grid', gap: '12px' }}>
          <button type="submit" style={primaryButton} disabled={loading}>
            {loading ? 'טוען...' : 'התחבר'}
          </button>
          <button type="button" style={googleButton} onClick={handleGoogleLogin} disabled={loading}>
            {loading ? 'טוען...' : 'התחבר עם Google'}
          </button>
          <button type="button" style={secondaryButton} onClick={resetForm} disabled={loading}>
            אפס טופס
          </button>
        </div>
      </form>

      <div style={errorStyle} role="alert">{error}</div>

      <div style={{ marginTop: '18px', textAlign: 'center' }}>
        <Link to="/" style={{ ...secondaryButton, textDecoration: 'none', display: 'inline-block', width: '100%' }}>
          חזרה לדף הבית
        </Link>
      </div>
    </section>
  );
}

export default Login;
