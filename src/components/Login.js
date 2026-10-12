import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { CircleAlert, CircleCheck, Eye, EyeOff, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import LogoLoader from './LogoLoader';
import logo from '../logo/Hoffman.png';
import './Login.css';

const HELP_PHONE = { display: '02-6788848', tel: '026788848' };
const INVALID_CREDENTIALS_MESSAGE = 'האימייל או הסיסמה אינם נכונים. בדקו אותם ונסו שוב.';
const LOGIN_TIMEOUT_MS = 10000;

function getFriendlyErrorMessage(error) {
  if (!error) return 'משהו השתבש. נסו שוב.';
  const code = error.code || '';
  const message = error.message || '';

  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return INVALID_CREDENTIALS_MESSAGE;
  }
  if (code === 'auth/invalid-email') {
    return 'כתובת האימייל לא נראית תקינה. בדקו שכתבתם אותה במלואה, למשל name@gmail.com';
  }
  if (code === 'auth/too-many-requests') {
    return 'היו יותר מדי ניסיונות כניסה. המתינו כמה דקות ונסו שוב, או התקשרו אלינו לעזרה.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'חלון הכניסה של Google נסגר לפני שהכניסה הסתיימה. אפשר לנסות שוב.';
  }
  if (code === 'auth/popup-blocked') {
    return 'הדפדפן חסם את חלון הכניסה של Google. אפשרו חלונות קופצים ונסו שוב.';
  }
  if (code === 'auth/network-request-failed' || code === 'unavailable' || /offline/i.test(message)) {
    return 'אין חיבור לאינטרנט כרגע. בדקו את החיבור ונסו שוב.';
  }
  if (/timeout/i.test(message)) {
    return 'הכניסה לוקחת יותר זמן מהרגיל. נסו שוב בעוד רגע.';
  }
  return 'הכניסה לא הצליחה. בדקו את האימייל והסיסמה ונסו שוב.';
}

/*
 * Login styles, scoped under .lgn so Login.css and the rest of the site are untouched.
 * Built for older users: large text, large targets, clear labels and plain-language messages.
 * Sizes are in rem so the site's accessibility font scale still applies.
 */
const STYLES = `
.lgn * { font-size: inherit; box-sizing: border-box; }
.lgn { width: min(100%, 560px); margin: clamp(24px, 5vw, 56px) auto 48px; padding: 0 16px; color: #2b211c; font-size: 1.125rem; line-height: 1.6; text-align: right; }
.lgn-card { padding: clamp(26px, 5vw, 44px); border-radius: 28px; background: #fff; border: 1px solid #ece3da; box-shadow: 0 22px 54px rgba(90,51,39,.10); }
.lgn-logo { display: block; width: 190px; max-width: 60%; height: auto; margin: 0 auto 18px; }
.lgn-title { margin: 0; text-align: center; font-size: clamp(2rem, 6vw, 2.5rem); font-weight: 800; line-height: 1.2; color: #2b211c; }
.lgn-sub { margin: 8px 0 26px; text-align: center; font-size: 1.15rem; color: #5c4a40; }

.lgn-form { display: flex; flex-direction: column; gap: 20px; }
.lgn-field { display: flex; flex-direction: column; gap: 8px; }
.lgn-label { font-size: 1.2rem; font-weight: 800; color: #2b211c; }
.lgn-hint { font-size: 0.95rem; color: #6b5a50; }
.lgn-input-wrap { position: relative; }
.lgn-input {
  width: 100%; height: 62px; padding: 0 18px; border: 2px solid #d9c9bb; border-radius: 16px;
  background: #fffdfa; color: #2b211c; font: inherit; font-size: 1.25rem;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.lgn-input::placeholder { color: #9a8b80; }
.lgn-input:hover { border-color: #b9a593; }
.lgn-input:focus { outline: none; border-color: #3f6b5f; box-shadow: 0 0 0 4px rgba(63,107,95,.2); background: #fff; }
.lgn-input--ltr { direction: ltr; text-align: left; }
.lgn-input--pass { padding-left: 128px; padding-right: 18px; }
.lgn-toggle {
  position: absolute; top: 50%; left: 8px; transform: translateY(-50%);
  display: inline-flex; align-items: center; gap: 6px; height: 46px; padding: 0 14px;
  border: 0; border-radius: 12px; background: #f3ede6; color: #2b211c; font: inherit; font-size: 1rem; font-weight: 700; cursor: pointer;
}
.lgn-toggle:hover { background: #ece3da; }
.lgn-caps { display: flex; align-items: center; gap: 8px; margin: 0; padding: 8px 12px; border-radius: 10px; background: #fdf6ea; color: #7a5512; font-size: 1rem; font-weight: 700; }

.lgn-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px; width: 100%; min-height: 62px; padding: 0 20px;
  border-radius: 16px; border: 2px solid transparent; font: inherit; font-size: 1.3rem; font-weight: 800; cursor: pointer;
  transition: background-color .15s ease, border-color .15s ease;
}
.lgn-btn--primary { background: #a84f3d; color: #fff; }
.lgn-btn--primary:hover:not(:disabled) { background: #93422f; }
.lgn-btn--google { background: #fff; border-color: #d9c9bb; color: #2b211c; font-size: 1.2rem; }
.lgn-btn--google:hover:not(:disabled) { border-color: #a89585; background: #fbf8f4; }
.lgn-btn:disabled { opacity: .7; cursor: wait; }
.lgn-spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: lgn-spin .8s linear infinite; }
@keyframes lgn-spin { to { transform: rotate(360deg); } }

.lgn-or { display: flex; align-items: center; gap: 14px; margin: 4px 0; color: #6b5a50; font-size: 1rem; font-weight: 700; }
.lgn-or::before, .lgn-or::after { content: ""; flex: 1; height: 1px; background: #e3d7cc; }

.lgn-alert { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 14px; font-size: 1.1rem; font-weight: 700; line-height: 1.5; }
.lgn-alert svg { flex: none; margin-top: 2px; }
.lgn-alert--error { background: #fdf0ee; border: 2px solid #f1c4bf; color: #8f1d14; }
.lgn-alert--ok { background: #e9f4ee; border: 2px solid #bfdcc9; color: #1f5a37; }

.lgn-forgot { align-self: flex-start; padding: 6px 0; border: 0; background: none; color: #a84f3d; font: inherit; font-size: 1.05rem; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
.lgn-forgot:hover { color: #93422f; }

.lgn-help { display: flex; align-items: center; gap: 14px; margin-top: 22px; padding: 18px 20px; border-radius: 20px; background: #e6efec; color: #2c4d44; }
.lgn-help__icon { flex: none; width: 48px; height: 48px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; color: #2c4d44; }
.lgn-help p { margin: 0; font-size: 1.05rem; }
.lgn-help a { font-size: 1.3rem; font-weight: 800; color: #2c4d44; text-decoration: none; direction: ltr; unicode-bidi: isolate; white-space: nowrap; }
.lgn-help a:hover { text-decoration: underline; }
.lgn-back { display: block; margin-top: 18px; text-align: center; color: #5c4a40; font-size: 1.05rem; font-weight: 700; }
.lgn-back:hover { color: #a84f3d; }

.lgn a:focus-visible, .lgn button:focus-visible { outline: 3px solid #d4a373; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .lgn-spinner { animation-duration: 2s; } }
`;

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function withTimeout(promise) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('Login timeout: operation took too long'), { code: 'auth/login-timeout' })), LOGIN_TIMEOUT_MS);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

function Login() {
  const navigate = useNavigate();
  const { signInEmail, signInGoogle, authStatus, currentUser, isSessionAuthorized, cancelSignIn } = useAuth();
  const [pendingUid, setPendingUid] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (!pendingUid) return;
    if (authStatus === 'active' && currentUser?.uid === pendingUid && isSessionAuthorized(pendingUid)) {
      navigate('/');
    } else if (authStatus === 'inactive' || authStatus === 'unauthenticated') {
      setPendingUid(null);
      setLoading(false);
    }
  }, [pendingUid, authStatus, currentUser, isSessionAuthorized, navigate]);

  // Shared by the email and Google flows: run the sign-in, then go home.
  const runLogin = async (signIn, label) => {
    setError('');
    setNotice('');
    setLoading(true);
    setPendingUid(null);
    let keepLoaderUntilRedirect = false;

    try {
      const result = await withTimeout(signIn());

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

      keepLoaderUntilRedirect = true;
      setPendingUid(credential.user.uid);
    } catch (err) {
      if (err.code === 'auth/login-timeout') void cancelSignIn();
      console.error(`Login ${label} error`, err.code, err.message, err);
      setError(err.code === 'auth/account-inactive' ? '' : getFriendlyErrorMessage(err));
    } finally {
      if (!keepLoaderUntilRedirect) {
        setLoading(false);
      }
    }
  };

  const handleEmailLogin = (event) => {
    event.preventDefault();
    runLogin(() => signInEmail(email.trim(), password), 'email');
  };

  const handleGoogleLogin = () => {
    runLogin(() => signInGoogle(), 'Google');
  };

  const handleForgotPassword = async () => {
    setError('');
    setNotice('');
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('כדי לאפס סיסמה, כתבו קודם את כתובת האימייל שלכם בשדה "אימייל" ולחצו שוב על "שכחתי סיסמה".');
      return;
    }

    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setNotice(`שלחנו מייל עם קישור לבחירת סיסמה חדשה אל ${trimmedEmail}. אם לא מצאתם אותו, בדקו גם בתיקיית הספאם.`);
    } catch (err) {
      console.error('Password reset error', err.code, err.message, err);
      setError(err.code === 'auth/invalid-email'
        ? getFriendlyErrorMessage(err)
        : 'לא הצלחנו לשלוח מייל לאיפוס סיסמה. נסו שוב או התקשרו אלינו לעזרה.');
    } finally {
      setSendingReset(false);
    }
  };

  const handlePasswordKey = (event) => {
    if (typeof event.getModifierState === 'function') {
      setCapsLockOn(event.getModifierState('CapsLock'));
    }
  };

  return (
    <section className="lgn" dir="rtl">
      <style>{STYLES}</style>
      {loading && <LogoLoader label="נכנסים לחשבון..." />}

      <div className="lgn-card">
        <img className="lgn-logo" src={logo} alt="בית הופמן" />
        <h1 className="lgn-title">ברוכים הבאים</h1>
        <p className="lgn-sub">היכנסו לחשבון כדי לראות את הפעילויות שלכם ולהירשם לפעילויות חדשות.</p>

        <form onSubmit={handleEmailLogin} className="lgn-form" noValidate>
          <label className="lgn-field">
            <span className="lgn-label">אימייל</span>
            <input
              className="lgn-input lgn-input--ltr"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@gmail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <div className="lgn-field">
            <label className="lgn-label" htmlFor="lgn-password">סיסמה</label>
            <div className="lgn-input-wrap">
              <input
                id="lgn-password"
                className="lgn-input lgn-input--ltr lgn-input--pass"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="הסיסמה שלכם"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyUp={handlePasswordKey}
                onKeyDown={handlePasswordKey}
                onBlur={() => setCapsLockOn(false)}
                required
              />
              <button
                className="lgn-toggle"
                type="button"
                aria-pressed={showPassword}
                aria-controls="lgn-password"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                {showPassword ? 'הסתרה' : 'הצגה'}
              </button>
            </div>
            {capsLockOn && (
              <p className="lgn-caps" role="status">
                <CircleAlert size={18} aria-hidden="true" />
                שימו לב: האותיות הגדולות (Caps Lock) מופעלות
              </p>
            )}
            <button className="lgn-forgot" type="button" onClick={handleForgotPassword} disabled={sendingReset}>
              {sendingReset ? 'שולחים מייל...' : 'שכחתי סיסמה'}
            </button>
          </div>

          {error && (
            <div className="lgn-alert lgn-alert--error" role="alert">
              <CircleAlert size={24} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="lgn-alert lgn-alert--ok" role="status">
              <CircleCheck size={24} aria-hidden="true" />
              <span>{notice}</span>
            </div>
          )}

          <button type="submit" className="lgn-btn lgn-btn--primary" disabled={loading || !email.trim() || !password}>
            {loading && <span className="lgn-spinner" aria-hidden="true" />}
            {loading ? 'נכנסים...' : 'כניסה'}
          </button>

          <div className="lgn-or">או</div>

          <button type="button" className="lgn-btn lgn-btn--google" onClick={handleGoogleLogin} disabled={loading}>
            <GoogleIcon />
            כניסה עם חשבון Google
          </button>
        </form>
      </div>

      <div className="lgn-help">
        <span className="lgn-help__icon" aria-hidden="true"><Phone size={22} /></span>
        <div>
          <p>צריכים עזרה בכניסה? נשמח לעזור בטלפון</p>
          <a href={`tel:${HELP_PHONE.tel}`} aria-label={`התקשרו לבית הופמן ${HELP_PHONE.display}`}>{HELP_PHONE.display}</a>
        </div>
      </div>

      <Link to="/" className="lgn-back">חזרה לדף הבית</Link>
    </section>
  );
}

export default Login;
