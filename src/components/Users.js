import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  ListChecks,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { getActivityById } from '../services/activitiesService';
import { getUserActivityRegistrations } from '../services/activityRegistrationsService';
import { deleteUser, getUsers } from '../services/usersService';
import { formatActivityDate } from '../utils/activityDateUtils';
import LogoLoader from './LogoLoader';
import './Users.css';

const roleLabels = {
  admin: 'מנהל',
  resident: 'משתמש',
  volunteer: 'מתנדב',
};

const statusLabels = {
  active: 'פעיל',
  inactive: 'לא פעיל',
};

const paymentStatusLabels = {
  paid: 'שולם',
  pending: 'ממתין',
  cancelled: 'בוטל',
};

const formatRole = (role) => roleLabels[role] || role || '-';
const formatStatus = (status) => statusLabels[status] || status || '-';
const formatPaymentStatus = (status) => paymentStatusLabels[status] || status || '-';
const missingActivityLabel = 'הפעילות לא נמצאה';

const isManagerRole = (role) => ['admin', 'מנהל'].includes(String(role || '').toLowerCase());

const getUniqueValues = (values) => (
  Array.from(new Set(values.filter(Boolean)))
);

const getRegistrationActivityId = (registration) => (
  registration.activityId || registration.activityID || ''
);

const formatPrice = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
};

const getInitials = (user) => {
  const name = String(user.fullName || user.email || '?').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 1);
};

const AVATAR_TONES = [
  ['#e6efec', '#2c4d44'],
  ['#f6eee8', '#a84f3d'],
  ['#eceef8', '#3e4c94'],
  ['#f6efdf', '#7a5512'],
];

const avatarTone = (user) => {
  const key = String(user.id || user.email || '');
  const sum = Array.from(key).reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
};

const ROLE_FILTERS = [
  { key: 'all', label: 'הכל' },
  { key: 'managers', label: 'מנהלים' },
  { key: 'resident', label: 'משתמשים' },
  { key: 'volunteer', label: 'מתנדבים' },
];

/*
 * All styles for this page live here, scoped under .aus, in the same visual
 * language as the admin dashboard. Sizes are in rem so the site's
 * accessibility font scale still applies.
 */
const PAGE_STYLES = `
.aus * { font-size: inherit; box-sizing: border-box; }
.aus {
  min-height: calc(100vh - 96px); padding: 32px 20px 64px; background: #f6f2ec; color: #2b211c;
  font-size: 1rem; line-height: 1.5; text-align: right;
}
.aus-shell { max-width: 1180px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.aus a:focus-visible, .aus button:focus-visible, .aus input:focus-visible,
.aus-modal a:focus-visible, .aus-modal button:focus-visible { outline: 3px solid #d4a373; outline-offset: 2px; }
.aus-in { animation: aus-in .55s cubic-bezier(.2,.7,.2,1) both; }

.aus-header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; }
.aus-title { margin: 0; font-size: clamp(1.8rem, 3vw, 2.2rem); font-weight: 800; line-height: 1.15; color: #2b211c; }
.aus-subtitle { margin: 4px 0 0; color: #6b5a50; }
.aus-add {
  display: inline-flex; align-items: center; gap: 8px; min-height: 48px; padding: 0 20px; border-radius: 14px;
  background: #a84f3d; color: #fff; font-weight: 800; text-decoration: none;
  box-shadow: 0 10px 22px rgba(168,79,61,.22); transition: background-color .15s ease, translate .2s ease;
}
.aus-add:hover { background: #93422f; color: #fff; translate: 0 -2px; }

/* stats */
.aus-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
.aus-stat { display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: #fff; border: 1px solid #ece3da; border-radius: 18px; }
.aus-stat__icon { width: 46px; height: 46px; flex: 0 0 auto; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.aus-stat__label { margin: 0; font-size: 0.9rem; font-weight: 600; color: #6b5a50; }
.aus-stat__value { margin: 0; font-size: 1.9rem; font-weight: 800; line-height: 1.1; }
.aus-tone--teal { background: #e6efec; color: #2c4d44; }
.aus-tone--terra { background: #f6eee8; color: #a84f3d; }
.aus-tone--blue { background: #eceef8; color: #3e4c94; }
.aus-tone--gold { background: #f6efdf; color: #7a5512; }

/* toolbar */
.aus-toolbar {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px; background: #fff; border: 1px solid #ece3da; border-radius: 18px;
}
.aus-search { position: relative; flex: 1 1 280px; display: flex; align-items: center; }
.aus-search svg { position: absolute; right: 14px; color: #6b5a50; pointer-events: none; }
.aus-search input {
  width: 100%; height: 46px; padding: 0 44px 0 14px; border: 1px solid #e3d7cc; border-radius: 12px;
  background: #fbf8f4; color: #2b211c; font-size: 1rem;
}
.aus-search input:focus { outline: 2px solid #3f6b5f; outline-offset: 1px; border-color: #3f6b5f; background: #fff; }
.aus-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.aus-chip {
  display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: 999px;
  border: 1px solid #e3d7cc; background: #fff; color: #2b211c; font-size: 0.92rem; font-weight: 700; cursor: pointer;
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}
.aus-chip:hover { border-color: #3f6b5f; }
.aus-chip[aria-pressed="true"] { background: #2c4d44; border-color: #2c4d44; color: #fff; }
.aus-chip__count { font-size: 0.8rem; opacity: .75; }

.aus-alert { padding: 12px 16px; border-radius: 12px; background: #fdf0ee; border: 1px solid #f1c4bf; color: #b42318; font-weight: 600; }
.aus-empty { padding: 32px 20px; border-radius: 18px; background: #fff; border: 1px dashed #e3d7cc; color: #6b5a50; text-align: center; }
.aus-empty__title { margin: 0 0 4px; font-size: 1.15rem; font-weight: 800; color: #2b211c; }

/* user cards */
.aus-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 14px; }
.aus-card {
  display: flex; flex-direction: column; gap: 14px; padding: 18px; background: #fff;
  border: 1px solid #ece3da; border-radius: 20px;
  animation: aus-in .45s cubic-bezier(.2,.7,.2,1) both;
  transition: box-shadow .25s ease, border-color .25s ease, translate .25s ease;
}
.aus-card:hover { border-color: #dccbbe; box-shadow: 0 14px 30px rgba(90,51,39,.09); translate: 0 -3px; }
.aus-card.is-inactive { background: #fcfaf8; }
.aus-card__top { display: flex; align-items: center; gap: 14px; }
.aus-avatar {
  position: relative; width: 52px; height: 52px; flex: 0 0 auto; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 800;
}
.aus-avatar__dot { position: absolute; bottom: 1px; left: 1px; width: 13px; height: 13px; border-radius: 50%; border: 2px solid #fff; }
.aus-card__who { flex: 1; min-width: 0; }
.aus-card__name { margin: 0; font-size: 1.15rem; font-weight: 800; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aus-card__email { margin: 0; font-size: 0.9rem; color: #6b5a50; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; direction: ltr; text-align: right; }
.aus-card__tags { display: flex; flex-wrap: wrap; gap: 6px; }
.aus-tag { display: inline-flex; align-items: center; gap: 5px; padding: 2px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
.aus-tag--role { background: #f3ede6; color: #5c4a40; }
.aus-tag--manager { background: #eceef8; color: #3e4c94; }
.aus-tag--active { background: #e6efec; color: #2c4d44; }
.aus-tag--inactive { background: #efebe6; color: #5c524c; }
.aus-card__actions { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 12px; border-top: 1px solid #f3ede6; }
.aus-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; padding: 0 12px;
  border-radius: 10px; border: 1px solid #e3d7cc; background: #fbf8f4; color: #2b211c;
  font-size: 0.88rem; font-weight: 700; text-decoration: none; cursor: pointer;
  transition: background-color .15s ease, border-color .15s ease, color .15s ease;
}
.aus-btn:hover { background: #fff; border-color: #c9b6a8; color: #2b211c; }
.aus-btn--teal { background: #e6efec; border-color: #d3e4dd; color: #2c4d44; }
.aus-btn--teal:hover { background: #d9e9e3; color: #2c4d44; }
.aus-btn--danger { margin-inline-start: auto; background: #fff; border-color: #f1c4bf; color: #b42318; }
.aus-btn--danger:hover:not(:disabled) { background: #fdf0ee; color: #b42318; }
.aus-btn:disabled { opacity: .6; cursor: wait; }

/* modal */
.aus-modal {
  position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center;
  padding: 16px; background: rgba(43,33,28,.45); animation: aus-fade .2s ease both; font-size: 1rem;
}
.aus-modal * { font-size: inherit; box-sizing: border-box; }
.aus-modal__panel {
  width: 100%; max-width: 760px; max-height: 90vh; overflow-y: auto; padding: 24px;
  border-radius: 22px; background: #f6f2ec; color: #2b211c; text-align: right;
  box-shadow: 0 30px 60px rgba(43,33,28,.25); animation: aus-in .3s cubic-bezier(.2,.7,.2,1) both;
}
.aus-modal__head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.aus-modal__eyebrow { margin: 0; font-size: 0.9rem; font-weight: 700; color: #a84f3d; }
.aus-modal__title { margin: 0; font-size: 1.5rem; font-weight: 800; line-height: 1.2; }
.aus-modal__close {
  margin-inline-start: auto; width: 44px; height: 44px; border-radius: 50%; border: 1px solid #e3d7cc;
  background: #fff; color: #2b211c; display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.aus-modal__close:hover { border-color: #c9b6a8; }
.aus-reg-list { display: flex; flex-direction: column; gap: 10px; }
.aus-reg {
  padding: 16px 18px; border-radius: 16px; background: #fff; border: 1px solid #ece3da;
  border-inline-start: 4px solid #00846f;
}
.aus-reg__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.aus-reg__title { margin: 0; font-size: 1.1rem; font-weight: 800; }
.aus-reg__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px 16px; margin: 0; }
.aus-reg__grid dt { font-size: 0.8rem; font-weight: 600; color: #6b5a50; }
.aus-reg__grid dd { margin: 0; font-size: 0.98rem; font-weight: 700; }
.aus-pay { padding: 2px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
.aus-pay--paid { background: #e3f1e8; color: #1f6b3a; }
.aus-pay--pending { background: #fdf6ea; color: #7a5512; }
.aus-pay--other { background: #f3ede6; color: #5c524c; }

@keyframes aus-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes aus-fade { from { opacity: 0; } to { opacity: 1; } }
@media (max-width: 600px) {
  .aus-toolbar { padding: 12px; }
  .aus-modal__panel { padding: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .aus-in, .aus-card, .aus-modal, .aus-modal__panel { animation: none; }
  .aus-card, .aus-add { transition: none; }
  .aus-card:hover, .aus-add:hover { translate: none; }
}
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

function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserActivities, setSelectedUserActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);
      setError('');

      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (err) {
        setError('לא ניתן לטעון את המשתמשים. בדקו את הרשאות Firebase ונסו שוב.');
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUser) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedUser(null);
        setSelectedUserActivities([]);
        setActivitiesError('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedUser]);

  const counts = useMemo(() => ({
    all: users.length,
    managers: users.filter((user) => isManagerRole(user.role)).length,
    resident: users.filter((user) => user.role === 'resident').length,
    volunteer: users.filter((user) => user.role === 'volunteer').length,
    active: users.filter((user) => user.status === 'active').length,
  }), [users]);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('he');
    return users.filter((user) => {
      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'managers' ? isManagerRole(user.role) : user.role === roleFilter);
      const matchesSearch =
        !query ||
        [user.fullName, user.email, user.phone]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('he')
          .includes(query);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const closeDeleteDialog = useCallback(() => setUserToDelete(null), []);

  const confirmDelete = async () => {
    if (!userToDelete) return;
    const userId = userToDelete.id;

    setDeletingUserId(userId);
    setError('');

    try {
      await deleteUser(userId);
      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId));
      setUserToDelete(null);
    } catch (err) {
      setError('לא ניתן למחוק את המשתמש. נסו שוב.');
      setUserToDelete(null);
    } finally {
      setDeletingUserId('');
    }
  };

  const handleViewActivities = async (user) => {
    setSelectedUser(user);
    setSelectedUserActivities([]);
    setActivitiesError('');
    setIsLoadingActivities(true);

    try {
      const userIds = getUniqueValues([user.id, user.uid]);
      const registrationGroups = await Promise.all(
        userIds.map((userId) => getUserActivityRegistrations(userId))
      );
      const registrationsById = new Map();

      registrationGroups.flat().forEach((registration) => {
        registrationsById.set(registration.id, registration);
      });

      const registrationsData = Array.from(registrationsById.values());
      const activityIds = getUniqueValues(registrationsData.map(getRegistrationActivityId));
      const activityPairs = await Promise.all(
        activityIds.map(async (activityId) => [
          activityId,
          await getActivityById(activityId),
        ])
      );
      const activitiesById = new Map(activityPairs);

      setSelectedUserActivities(
        registrationsData.map((registration) => {
          const activity = activitiesById.get(getRegistrationActivityId(registration)) || null;

          return {
            registration: activity
              ? registration
              : { ...registration, activityTitle: missingActivityLabel },
            activity,
          };
        })
      );
    } catch (err) {
      console.error('Failed to load user registered activities:', err);
      setActivitiesError('לא ניתן לטעון את הפעילויות של המשתמש כרגע.');
    } finally {
      setIsLoadingActivities(false);
    }
  };

  function closeActivitiesModal() {
    setSelectedUser(null);
    setSelectedUserActivities([]);
    setActivitiesError('');
  }

  return (
    <section className="aus" dir="rtl">
      <style>{PAGE_STYLES}</style>
      <div className="aus-shell">
        <header className="aus-header aus-in">
          <div>
            <h1 className="aus-title">משתמשים</h1>
            <p className="aus-subtitle">כל מי שרשום לאתר: משתתפים, מתנדבים ומנהלים</p>
          </div>
          <Link className="aus-add" to="/users/new">
            <UserPlus size={18} aria-hidden="true" />
            הוספת משתמש
          </Link>
        </header>

        {error && <div className="aus-alert" role="alert">{error}</div>}

        {isLoading && <LogoLoader label="טוען משתמשים..." />}

        {!isLoading && !error && users.length === 0 && (
          <div className="aus-empty">
            <p className="aus-empty__title">לא נמצאו משתמשים.</p>
            <p style={{ margin: 0 }}>צרו את פרופיל המשתמש הראשון כדי להתחיל לנהל גישה.</p>
          </div>
        )}

        {!isLoading && users.length > 0 && (
          <>
            <div className="aus-toolbar aus-in" style={{ animationDelay: '.1s' }}>
              <label className="aus-search">
                <Search size={18} aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="חיפוש לפי שם, אימייל או טלפון"
                  aria-label="חיפוש משתמש"
                />
              </label>
              <div className="aus-chips" role="group" aria-label="סינון לפי תפקיד">
                {ROLE_FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className="aus-chip"
                    aria-pressed={roleFilter === filter.key}
                    onClick={() => setRoleFilter(filter.key)}
                  >
                    {filter.label}
                    <span className="aus-chip__count">{counts[filter.key]}</span>
                  </button>
                ))}
              </div>
            </div>

            {visibleUsers.length === 0 ? (
              <div className="aus-empty">
                <p className="aus-empty__title">אין משתמשים שמתאימים לחיפוש</p>
                <p style={{ margin: 0 }}>נסו מילה אחרת או בחרו "הכל".</p>
              </div>
            ) : (
              <div className="aus-grid">
                {visibleUsers.map((user, index) => {
                  const [toneBg, toneFg] = avatarTone(user);
                  const isActive = user.status === 'active';
                  const manager = isManagerRole(user.role);
                  return (
                    <article
                      className={`aus-card${isActive ? '' : ' is-inactive'}`}
                      key={user.id}
                      style={{ animationDelay: `${Math.min(index, 12) * 0.03}s` }}
                    >
                      <div className="aus-card__top">
                        <span className="aus-avatar" style={{ background: toneBg, color: toneFg }} aria-hidden="true">
                          {getInitials(user)}
                          <span className="aus-avatar__dot" style={{ background: isActive ? '#00846f' : '#b9b0a8' }} />
                        </span>
                        <div className="aus-card__who">
                          <h2 className="aus-card__name">{user.fullName || 'ללא שם'}</h2>
                          <p className="aus-card__email">{user.email || '-'}</p>
                        </div>
                      </div>

                      <div className="aus-card__tags">
                        <span className={`aus-tag ${manager ? 'aus-tag--manager' : 'aus-tag--role'}`}>
                          {manager && <ShieldCheck size={13} aria-hidden="true" />}
                          {formatRole(user.role)}
                        </span>
                        <span className={`aus-tag ${isActive ? 'aus-tag--active' : 'aus-tag--inactive'}`}>
                          {formatStatus(user.status)}
                        </span>
                      </div>

                      <div className="aus-card__actions">
                        <Link className="aus-btn" to={`/users/${user.id}`}>
                          <Eye size={15} aria-hidden="true" />
                          צפייה
                        </Link>
                        <Link className="aus-btn" to={`/users/${user.id}/edit`}>
                          <Pencil size={15} aria-hidden="true" />
                          עריכה
                        </Link>
                        <button className="aus-btn aus-btn--teal" type="button" onClick={() => handleViewActivities(user)}>
                          <ListChecks size={15} aria-hidden="true" />
                          פעילויות
                        </button>
                        <button
                          className="aus-btn aus-btn--danger"
                          type="button"
                          disabled={deletingUserId === user.id}
                          onClick={() => setUserToDelete(user)}
                          aria-label={`מחיקת ${user.fullName || 'המשתמש'}`}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                          {deletingUserId === user.id ? 'מוחק...' : 'מחיקה'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {selectedUser && (
        <div
          className="aus-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="aus-modal-title"
          dir="rtl"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeActivitiesModal();
          }}
        >
          <div className="aus-modal__panel">
            <div className="aus-modal__head">
              <span
                className="aus-avatar"
                style={{ background: avatarTone(selectedUser)[0], color: avatarTone(selectedUser)[1] }}
                aria-hidden="true"
              >
                {getInitials(selectedUser)}
              </span>
              <div>
                <p className="aus-modal__eyebrow">פעילויות שנרשם אליהן</p>
                <h2 id="aus-modal-title" className="aus-modal__title">
                  {selectedUser.fullName || selectedUser.email || 'משתמש'}
                </h2>
              </div>
              <button className="aus-modal__close" type="button" onClick={closeActivitiesModal} aria-label="סגירה">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {isLoadingActivities && <LogoLoader label="טוען פעילויות..." />}

            {!isLoadingActivities && activitiesError && (
              <div className="aus-alert" role="alert">{activitiesError}</div>
            )}

            {!isLoadingActivities && !activitiesError && selectedUserActivities.length === 0 && (
              <div className="aus-empty">
                <p className="aus-empty__title">המשתמש לא נרשם לפעילויות עדיין</p>
              </div>
            )}

            {!isLoadingActivities && !activitiesError && selectedUserActivities.length > 0 && (
              <div className="aus-reg-list">
                {selectedUserActivities.map(({ registration, activity }) => {
                  const payment = registration.paymentStatus;
                  const payTone = payment === 'paid' ? 'paid' : payment === 'pending' ? 'pending' : 'other';
                  return (
                    <article key={registration.id} className="aus-reg">
                      <div className="aus-reg__head">
                        <h3 className="aus-reg__title">
                          {activity?.title || registration.activityTitle || 'פעילות לא נמצאה'}
                        </h3>
                        <span className={`aus-pay aus-pay--${payTone}`}>{formatPaymentStatus(payment)}</span>
                      </div>
                      <dl className="aus-reg__grid">
                        <ActivityDetail
                          label="תאריך"
                          value={formatActivityDate(activity?.activityDate || activity?.date || registration.activityDate || registration.date)}
                        />
                        <ActivityDetail label="שעה" value={activity?.time || registration.time} />
                        <ActivityDetail label="מיקום" value={activity?.location || registration.location} />
                        <ActivityDetail label="מחיר" value={formatPrice(activity?.price)} />
                      </dl>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {userToDelete && (
        <ConfirmDialog
          title={`למחוק את ${userToDelete.fullName || userToDelete.email || 'המשתמש'}?`}
          text="המשתמש יימחק לצמיתות, ולא יהיה אפשר לשחזר אותו."
          confirmLabel="כן, למחוק"
          busy={deletingUserId === userToDelete.id}
          onConfirm={confirmDelete}
          onCancel={closeDeleteDialog}
        />
      )}
    </section>
  );
}

function ActivityDetail({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || '-'}</dd>
    </div>
  );
}

export default Users;
