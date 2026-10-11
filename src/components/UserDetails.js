import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CalendarClock, Mail, Pencil, Phone, ShieldCheck, Trash2 } from 'lucide-react';
import { deleteUser, getUserById } from '../services/usersService';
import { toDate } from '../utils/dateUtils';
import LogoLoader from './LogoLoader';

const roleLabels = {
  admin: 'מנהל',
  resident: 'משתמש',
  volunteer: 'מתנדב',
};

const statusLabels = {
  active: 'פעיל',
  inactive: 'לא פעיל',
};

const formatRole = (role) => roleLabels[role] || role || '-';
const formatStatus = (status) => statusLabels[status] || status || '-';
const isManagerRole = (role) => ['admin'].includes(String(role || '').toLowerCase());

const dateTimeFormatter = new Intl.DateTimeFormat('he-IL', { dateStyle: 'long', timeStyle: 'short' });
const formatHebrewDate = (value) => {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : '-';
};

const getInitials = (user) => {
  const name = String(user.fullName || user.email || '?').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 1);
};

/*
 * All styles for this page live here, scoped under .aup (shared look with the
 * users list and the user form). Sizes are in rem so the site's accessibility
 * font scale still applies.
 */
const PAGE_STYLES = `
.aup * { font-size: inherit; box-sizing: border-box; }
.aup {
  min-height: calc(100vh - 96px); padding: 28px 20px 64px; background: #f6f2ec; color: #2b211c;
  font-size: 1rem; line-height: 1.5; text-align: right;
}
.aup-shell { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; animation: aup-in .5s cubic-bezier(.2,.7,.2,1) both; }
.aup a:focus-visible, .aup button:focus-visible { outline: 3px solid #d4a373; outline-offset: 2px; }
.aup-back { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; color: #3f6b5f; font-weight: 700; text-decoration: none; }
.aup-back:hover { color: #2c4d44; text-decoration: underline; text-underline-offset: 4px; }

.aup-hero {
  position: relative; overflow: hidden; isolation: isolate; display: flex; flex-wrap: wrap; align-items: center; gap: 20px;
  padding: 28px; border-radius: 24px; background: #fff; border: 1px solid #ece3da;
}
.aup-hero::before {
  content: ''; position: absolute; inset: 0 0 auto 0; height: 84px; z-index: -1;
  background: linear-gradient(135deg, #f6eee8 0%, #e6efec 100%);
}
.aup-avatar {
  position: relative; width: 96px; height: 96px; flex: 0 0 auto; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 2.1rem; font-weight: 800;
  background: #a84f3d; color: #fff; border: 4px solid #fff; box-shadow: 0 8px 20px rgba(90,51,39,.18);
}
.aup-avatar__dot { position: absolute; bottom: 4px; left: 4px; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; }
.aup-hero__who { flex: 1 1 240px; min-width: 0; padding-top: 18px; }
.aup-hero__eyebrow { margin: 0; font-size: 0.85rem; font-weight: 700; color: #a84f3d; }
.aup-hero__name { margin: 2px 0 8px; font-size: clamp(1.7rem, 3vw, 2.1rem); font-weight: 800; line-height: 1.15; overflow-wrap: anywhere; }
.aup-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.aup-tag { display: inline-flex; align-items: center; gap: 5px; padding: 3px 12px; border-radius: 999px; font-size: 0.85rem; font-weight: 700; }
.aup-tag--role { background: #f3ede6; color: #5c4a40; }
.aup-tag--manager { background: #eceef8; color: #3e4c94; }
.aup-tag--active { background: #e6efec; color: #2c4d44; }
.aup-tag--inactive { background: #efebe6; color: #5c524c; }
.aup-hero__actions { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 18px; }
.aup-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 46px; padding: 0 18px;
  border-radius: 12px; border: 1px solid transparent; font: inherit; font-size: 0.95rem; font-weight: 800; text-decoration: none; cursor: pointer;
  transition: background-color .15s ease, border-color .15s ease;
}
.aup-btn--primary { background: #2c4d44; color: #fff; }
.aup-btn--primary:hover { background: #22403a; color: #fff; }
.aup-btn--danger { background: #fff; border-color: #f1c4bf; color: #b42318; }
.aup-btn--danger:hover:not(:disabled) { background: #fdf0ee; color: #b42318; }
.aup-btn--ghost { background: #fff; border-color: #e3d7cc; color: #2b211c; }
.aup-btn:disabled { opacity: .6; cursor: wait; }

.aup-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 16px; }
.aup-card { padding: 20px 22px; background: #fff; border: 1px solid #ece3da; border-radius: 20px; }
.aup-card__title { margin: 0 0 12px; font-size: 1.1rem; font-weight: 800; }
.aup-info { margin: 0; display: flex; flex-direction: column; gap: 4px; }
.aup-info__row { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 12px; }
.aup-info__icon { width: 40px; height: 40px; flex: 0 0 auto; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.aup-tone--teal { background: #e6efec; color: #2c4d44; }
.aup-tone--terra { background: #f6eee8; color: #a84f3d; }
.aup-tone--blue { background: #eceef8; color: #3e4c94; }
.aup-tone--gold { background: #f6efdf; color: #7a5512; }
.aup-info dt { font-size: 0.82rem; font-weight: 600; color: #6b5a50; }
.aup-info dd { margin: 0; font-size: 1.05rem; font-weight: 700; overflow-wrap: anywhere; }
.aup-info a { color: #2b211c; text-decoration: none; }
.aup-info a:hover { color: #2c4d44; text-decoration: underline; text-underline-offset: 3px; }
.aup-ltr { direction: ltr; unicode-bidi: isolate; }

.aup-error { padding: 12px 16px; border-radius: 12px; background: #fdf0ee; border: 1px solid #f1c4bf; color: #b42318; font-weight: 600; }
.aup-empty { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding: 28px; border-radius: 20px; background: #fff; border: 1px solid #ece3da; }

@keyframes aup-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .aup-shell { animation: none; } }
`;

/*
 * Styled confirmation dialog (replaces the browser's window.confirm).
 * Scoped under .ucd. Escape or a click outside cancels; focus starts on "ביטול".
 */
const CONFIRM_STYLES = `
.ucd { position: fixed; inset: 0; z-index: 90; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(43,33,28,.5); font-size: 1rem; animation: ucd-fade .18s ease both; }
.ucd * { font-size: inherit; box-sizing: border-box; }
.ucd-panel {
  width: 100%; max-width: 420px; padding: 28px 26px 22px; border-radius: 24px; background: #fff; color: #2b211c;
  text-align: center; box-shadow: 0 30px 60px rgba(43,33,28,.3); animation: ucd-pop .25s cubic-bezier(.2,.7,.2,1) both;
}
.ucd-icon { width: 64px; height: 64px; margin: 0 auto 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #fdf0ee; color: #b42318; box-shadow: 0 0 0 8px #fef7f6; }
.ucd-title { margin: 0; font-size: 1.35rem; font-weight: 800; line-height: 1.3; overflow-wrap: anywhere; }
.ucd-text { margin: 8px 0 0; color: #6b5a50; line-height: 1.6; }
.ucd-actions { display: flex; gap: 10px; margin-top: 22px; }
.ucd-btn { flex: 1; min-height: 50px; border-radius: 14px; border: 1px solid transparent; font: inherit; font-size: 1rem; font-weight: 800; cursor: pointer; transition: background-color .15s ease, border-color .15s ease; }
.ucd-btn--danger { background: #b42318; color: #fff; }
.ucd-btn--danger:hover:not(:disabled) { background: #93190f; }
.ucd-btn--cancel { background: #fff; border-color: #e3d7cc; color: #2b211c; }
.ucd-btn--cancel:hover { border-color: #c9b6a8; }
.ucd-btn:disabled { opacity: .65; cursor: wait; }
.ucd-btn:focus-visible { outline: 3px solid #d4a373; outline-offset: 2px; }
@keyframes ucd-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ucd-pop { from { opacity: 0; transform: translateY(10px) scale(.96); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .ucd, .ucd-panel { animation: none; } }
`;

function ConfirmDialog({ title, text, confirmLabel, busy, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="ucd"
      dir="rtl"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <style>{CONFIRM_STYLES}</style>
      <div className="ucd-panel" role="alertdialog" aria-modal="true" aria-labelledby="ucd-title" aria-describedby="ucd-text">
        <span className="ucd-icon" aria-hidden="true"><Trash2 size={28} /></span>
        <h2 id="ucd-title" className="ucd-title">{title}</h2>
        <p id="ucd-text" className="ucd-text">{text}</p>
        <div className="ucd-actions">
          <button className="ucd-btn ucd-btn--danger" type="button" disabled={busy} onClick={onConfirm}>
            {busy ? 'מוחק...' : confirmLabel}
          </button>
          <button ref={cancelRef} className="ucd-btn ucd-btn--cancel" type="button" disabled={busy} onClick={onCancel}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const closeConfirm = useCallback(() => setConfirmOpen(false), []);

  useEffect(() => {
    async function loadUser() {
      setIsLoading(true);
      setError('');

      try {
        const userData = await getUserById(id);
        setUser(userData);
      } catch (err) {
        setError('לא ניתן לטעון את המשתמש.');
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      await deleteUser(id);
      navigate('/users');
    } catch (err) {
      setError('לא ניתן למחוק את המשתמש. נסו שוב.');
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (isLoading) {
    return <LogoLoader label="טוען משתמש..." />;
  }

  if (!user) {
    return (
      <section className="aup" dir="rtl">
        <style>{PAGE_STYLES}</style>
        <div className="aup-shell">
          <div className="aup-empty">
            <strong style={{ fontSize: '1.2rem' }}>{error || 'המשתמש לא נמצא.'}</strong>
            <Link className="aup-btn aup-btn--ghost" to="/users">חזרה למשתמשים</Link>
          </div>
        </div>
      </section>
    );
  }

  const isActive = user.status === 'active';
  const manager = isManagerRole(user.role);

  return (
    <section className="aup" dir="rtl">
      <style>{PAGE_STYLES}</style>
      <div className="aup-shell">
        <Link className="aup-back" to="/users">
          <ArrowRight size={18} aria-hidden="true" />
          חזרה למשתמשים
        </Link>

        {error && <div className="aup-error" role="alert">{error}</div>}

        <header className="aup-hero">
          <span className="aup-avatar" aria-hidden="true">
            {getInitials(user)}
            <span className="aup-avatar__dot" style={{ background: isActive ? '#00846f' : '#b9b0a8' }} />
          </span>
          <div className="aup-hero__who">
            <p className="aup-hero__eyebrow">פרטי משתמש</p>
            <h1 className="aup-hero__name">{user.fullName || 'ללא שם'}</h1>
            <div className="aup-tags">
              <span className={`aup-tag ${manager ? 'aup-tag--manager' : 'aup-tag--role'}`}>
                {manager && <ShieldCheck size={14} aria-hidden="true" />}
                {formatRole(user.role)}
              </span>
              <span className={`aup-tag ${isActive ? 'aup-tag--active' : 'aup-tag--inactive'}`}>
                {formatStatus(user.status)}
              </span>
            </div>
          </div>
          <div className="aup-hero__actions">
            <Link className="aup-btn aup-btn--primary" to={`/users/${id}/edit`}>
              <Pencil size={16} aria-hidden="true" />
              עריכה
            </Link>
            <button className="aup-btn aup-btn--danger" type="button" disabled={isDeleting} onClick={() => setConfirmOpen(true)}>
              <Trash2 size={16} aria-hidden="true" />
              {isDeleting ? 'מוחק...' : 'מחיקה'}
            </button>
          </div>
        </header>

        <div className="aup-cards">
          <section className="aup-card" aria-labelledby="aup-contact">
            <h2 id="aup-contact" className="aup-card__title">פרטי קשר</h2>
            <dl className="aup-info">
              <div className="aup-info__row">
                <span className="aup-info__icon aup-tone--terra" aria-hidden="true"><Mail size={18} /></span>
                <div>
                  <dt>אימייל</dt>
                  <dd>{user.email ? <a className="aup-ltr" href={`mailto:${user.email}`}>{user.email}</a> : '-'}</dd>
                </div>
              </div>
              <div className="aup-info__row">
                <span className="aup-info__icon aup-tone--teal" aria-hidden="true"><Phone size={18} /></span>
                <div>
                  <dt>טלפון</dt>
                  <dd>{user.phone ? <a className="aup-ltr" href={`tel:${user.phone}`}>{user.phone}</a> : '-'}</dd>
                </div>
              </div>
            </dl>
          </section>

          <section className="aup-card" aria-labelledby="aup-account">
            <h2 id="aup-account" className="aup-card__title">חשבון</h2>
            <dl className="aup-info">
              <div className="aup-info__row">
                <span className="aup-info__icon aup-tone--blue" aria-hidden="true"><CalendarClock size={18} /></span>
                <div>
                  <dt>נוצר בתאריך</dt>
                  <dd>{formatHebrewDate(user.createdAt)}</dd>
                </div>
              </div>
              <div className="aup-info__row">
                <span className="aup-info__icon aup-tone--gold" aria-hidden="true"><Pencil size={18} /></span>
                <div>
                  <dt>עודכן לאחרונה</dt>
                  <dd>{formatHebrewDate(user.updatedAt)}</dd>
                </div>
              </div>
            </dl>
          </section>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title={`למחוק את ${user.fullName || user.email || 'המשתמש'}?`}
          text="המשתמש יימחק לצמיתות, ולא יהיה אפשר לשחזר אותו."
          confirmLabel="כן, למחוק"
          busy={isDeleting}
          onConfirm={handleDelete}
          onCancel={closeConfirm}
        />
      )}
    </section>
  );
}

export default UserDetails;
