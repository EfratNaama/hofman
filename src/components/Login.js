import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const INVALID_CREDENTIALS_MESSAGE = 'האימייל או הסיסמא שגויים! נסו שנית!';

function getFriendlyErrorMessage(error) {
  if (!error) return 'אירעה שגיאה אנונימית. נסו שוב.';
  const code = error.code || '';
  const message = error.message || '';

  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return INVALID_CREDENTIALS_MESSAGE;
  }

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
        console.warn('Login: Firestore user profile write failed, continuing login', firestoreResult.error);
      }
      
      console.log('Login: success, navigating to home');
      navigate('/');
    } catch (err) {
      console.error('Login email error', err.code, err.message, err);
      const message = getFriendlyErrorMessage(err);
      setError(message);
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
        console.warn('Login: Firestore user profile write failed, continuing login', firestoreResult.error);
      }
      
      console.log('Login: success, navigating to home');
      navigate('/');
    } catch (err) {
      console.error('Login Google error', err.code, err.message, err);
      const message = getFriendlyErrorMessage(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-card">
      <h2 className="login-card__title">כניסה לחשבון</h2>
      <p className="login-card__text">
        התחברו באמצעות כתובת דוא"ל וסיסמה או השתמשו בכניסה עם Google. ניתן לאפס את הטופס בכל עת.
      </p>

      <form onSubmit={handleEmailLogin} className="login-form">
        <label className="login-form__field">
          <span className="login-form__label">אימייל</span>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-form__input"
            required
          />
        </label>

        <label className="login-form__field">
          <span className="login-form__label">סיסמה</span>
          <input
            type="password"
            placeholder="הקלידו סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-form__input"
            required
          />
        </label>

        <div className="login-form__actions">
          <button type="submit" className="login-form__button login-form__button--primary" disabled={loading}>
            {loading ? 'טוען...' : 'התחבר'}
          </button>
          {error && (
            <div className="login-form__error" role="alert" aria-live="assertive">
              <span className="login-form__error-icon" aria-hidden="true">!</span>
              <span>{error}</span>
            </div>
          )}
          <button type="button" className="login-form__button login-form__button--google" onClick={handleGoogleLogin} disabled={loading}>
            {loading ? 'טוען...' : 'התחבר עם Google'}
          </button>
          <button type="button" className="login-form__button login-form__button--secondary" onClick={resetForm} disabled={loading}>
            אפס טופס
          </button>
        </div>
      </form>

      <div className="login-card__footer">
        <Link to="/" className="login-form__button login-form__button--secondary login-form__button--link">
          חזרה לדף הבית
        </Link>
      </div>
    </section>
  );
}

export default Login;
