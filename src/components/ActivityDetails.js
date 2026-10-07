import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowRight, Calendar, Check, Clock, CreditCard, MapPin, MessageCircle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { deleteActivity, getActivityById } from '../services/activitiesService';
import {
  getActivityRegistrationCount,
  getUserActivityRegistrations,
  registerForActivity,
} from '../services/activityRegistrationsService';
import {
  ACTIVITY_WEEKDAYS,
  formatActivityDate,
  getActivityDaysOfWeek,
  toDate,
} from '../utils/activityDateUtils';
import {
  getRecurringEndDate,
  getRecurringStartDate,
  getRegistrationPresentation,
  isActivityRegistrationClosed,
  isOneTimeActivity,
} from '../utils/activityRegistrationUtils';
import LogoLoader from './LogoLoader';
import './ActivityDetails.css';

/*
 * All styles for this page live here, scoped under .adp, so the page can be
 * restyled without touching shared CSS files. Sizes are in rem so the site's
 * accessibility font scale (html font-size) still applies.
 */
const PAGE_STYLES = `
.adp * { font-size: inherit; }
.adp {
  --adp-bg: #fbf7f1;
  --adp-surface: #ffffff;
  --adp-ink: #2b2522;
  --adp-ink-soft: #4a403a;
  --adp-muted: #6b5f58;
  --adp-line: #e8dfd4;
  --adp-line-soft: #f0e9e0;
  --adp-accent: #b4593f;
  --adp-accent-hover: #9a4932;
  --adp-accent-soft: #f3e3dc;
  --adp-accent-ink: #8e4330;
  --adp-teal: #3f6b5f;
  --adp-teal-soft: #e1ece8;
  --adp-teal-ink: #2c4d44;
  min-height: 100vh;
  background: var(--adp-bg);
  color: var(--adp-ink);
  font-size: 1.0625rem;
  line-height: 1.55;
  text-align: right;
}
.adp-wrap { max-width: 1160px; margin: 0 auto; padding-inline: 24px; }

/* top bar */
.adp-topbar { background: var(--adp-surface); border-bottom: 1px solid var(--adp-line); }
.adp-topbar__inner {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 12px; padding-block: 12px;
}
.adp-back {
  display: inline-flex; align-items: center; gap: 8px; min-height: 44px;
  color: var(--adp-teal); font-weight: 600; font-size: 1rem; text-decoration: none;
}
.adp-back:hover { color: var(--adp-teal-ink); text-decoration: underline; text-underline-offset: 4px; }
.adp-admin { display: flex; flex-wrap: wrap; gap: 8px; }
.adp-btn-sm {
  display: inline-flex; align-items: center; justify-content: center; min-height: 44px;
  padding: 0 18px; border-radius: 10px; font-size: 0.95rem; font-weight: 700;
  text-decoration: none; cursor: pointer; transition: background-color 150ms ease;
}
.adp-btn-sm--edit { background: var(--adp-surface); color: var(--adp-ink); border: 1px solid var(--adp-line); }
.adp-btn-sm--edit:hover { background: var(--adp-bg); }
.adp-btn-sm--delete { background: #fff; color: #b42318; border: 1px solid #f1c4bf; }
.adp-btn-sm--delete:hover:not(:disabled) { background: #fdf0ee; }
.adp-btn-sm:disabled { cursor: not-allowed; opacity: 0.6; }

/* hero */
.adp-hero {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px;
  align-items: center; padding-top: 40px;
}
.adp-hero--no-image { grid-template-columns: minmax(0, 1fr); }
.adp-hero__text { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.adp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.adp-chip {
  display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 999px;
  font-size: 0.875rem; font-weight: 600; line-height: 1.5;
}
.adp-chip--accent { background: var(--adp-accent-soft); color: var(--adp-accent-ink); }
.adp-chip--teal { background: var(--adp-teal-soft); color: var(--adp-teal-ink); }
.adp-chip--plain { background: var(--adp-surface); color: var(--adp-ink); border: 1px solid var(--adp-line); padding-block: 3px; }
.adp-title {
  margin: 0; font-size: clamp(2.1rem, 5vw, 3.4rem); font-weight: 800;
  line-height: 1.1; letter-spacing: -0.5px; color: var(--adp-ink); overflow-wrap: anywhere;
}
.adp-desc {
  margin: 0; font-size: 1.15rem; color: var(--adp-ink-soft); max-width: 560px;
  white-space: pre-line; overflow-wrap: anywhere;
}
.adp-desc--empty { color: var(--adp-muted); }
.adp-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 4px; }
.adp-fact {
  display: flex; align-items: center; gap: 12px; min-width: 0;
  background: var(--adp-surface); border: 1px solid var(--adp-line); border-radius: 14px; padding: 14px 16px;
}
.adp-fact__icon {
  width: 40px; height: 40px; flex: 0 0 auto; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: var(--adp-accent-soft); color: var(--adp-accent-ink);
}
.adp-fact__icon--teal { background: var(--adp-teal-soft); color: var(--adp-teal-ink); }
.adp-fact__body { min-width: 0; }
.adp-fact__value { font-weight: 700; font-size: 1rem; line-height: 1.35; overflow-wrap: anywhere; }
.adp-fact__label { font-size: 0.875rem; color: var(--adp-muted); }
.adp-cta {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 10px;
  min-height: 52px; padding: 0 28px; border-radius: 12px; margin-top: 4px;
  background: var(--adp-accent); color: #fff; font-size: 1.1rem; font-weight: 700;
  text-decoration: none; transition: background-color 150ms ease;
}
.adp-cta:hover { background: var(--adp-accent-hover); color: #fff; }
.adp-hero__media {
  border-radius: 24px; overflow: hidden; background: #efe4d6; aspect-ratio: 4 / 3;
}
.adp-hero__media img { display: block; width: 100%; height: 100%; object-fit: cover; }

/* body */
.adp-body {
  display: flex; flex-wrap: wrap; gap: 32px; align-items: flex-start;
  padding-top: 48px; padding-bottom: 72px;
}
.adp-main { flex: 999 1 520px; min-width: 0; display: flex; flex-direction: column; gap: 24px; }
.adp-side { flex: 1 1 340px; min-width: 0; scroll-margin-top: 96px; }
.adp-card {
  background: var(--adp-surface); border: 1px solid var(--adp-line); border-radius: 20px; padding: 28px;
}
.adp-card--raised { box-shadow: 0 12px 32px rgba(60, 40, 25, 0.08); }
.adp-card__title { margin: 0 0 8px; font-size: 1.6rem; font-weight: 800; line-height: 1.25; color: var(--adp-ink); }
.adp-alert {
  border-radius: 12px; padding: 12px 16px; font-size: 1rem; font-weight: 600; line-height: 1.6;
}
.adp-alert--error { background: #fdf0ee; border: 1px solid #f1c4bf; color: #b42318; }
.adp-alert--success { background: var(--adp-teal-soft); border: 1px solid #c3d8d1; color: var(--adp-teal-ink); }

/* details list */
.adp-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 32px; margin: 0; }
.adp-row {
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  padding: 14px 0; border-bottom: 1px solid var(--adp-line-soft); min-width: 0;
}
.adp-row dt { color: var(--adp-accent-ink); font-size: 1.1rem; font-weight: 800; flex: 0 0 auto; }
.adp-row dd { margin: 0; color: var(--adp-ink); font-weight: 600; font-size: 1.1rem; text-align: left; min-width: 0; overflow-wrap: anywhere; }
.adp-row dd a {
  display: inline-flex; align-items: center; gap: 6px; min-height: 44px;
  color: var(--adp-teal); font-weight: 700; text-decoration: underline; text-underline-offset: 4px;
}
.adp-row dd a:hover { color: var(--adp-teal-ink); }
.adp-row dd a.adp-row__wa { color: #1f7a43; }
.adp-row dd a.adp-row__wa:hover { color: #18633a; }
.adp-row--wide { grid-column: 1 / -1; }

/* lecturer */
.adp-lecturer { display: flex; align-items: center; gap: 22px; }
.adp-lecturer__image {
  width: 104px; height: 104px; flex: 0 0 auto; border-radius: 999px; object-fit: cover;
  background: var(--adp-bg); border: 3px solid #fff; box-shadow: 0 6px 20px rgba(60, 40, 25, 0.14);
}
.adp-lecturer__eyebrow { margin: 0; color: var(--adp-accent-ink); font-size: 0.95rem; font-weight: 700; }
.adp-lecturer__name { margin: 4px 0 0; font-size: 1.5rem; font-weight: 800; line-height: 1.25; color: var(--adp-ink); }
.adp-lecturer__desc { margin: 8px 0 0; color: var(--adp-ink-soft); font-size: 1.05rem; line-height: 1.75; white-space: pre-line; }

/* registration */
.adp-reg { display: flex; flex-direction: column; gap: 18px; }
.adp-reg__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.adp-status {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px;
  font-size: 0.875rem; font-weight: 700;
}
.adp-status__dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.adp-status--open { background: var(--adp-teal-soft); color: var(--adp-teal-ink); }
.adp-status--closed { background: #efebe6; color: #5c524c; }
.adp-spots { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.adp-spots__num { font-size: 2.5rem; font-weight: 800; line-height: 1; color: var(--adp-teal-ink); }
.adp-spots__label { font-size: 1.1rem; font-weight: 600; color: var(--adp-ink-soft); }
.adp-bar { height: 10px; background: #efe8df; border-radius: 999px; overflow: hidden; }
.adp-bar__fill { height: 100%; background: var(--adp-teal); border-radius: 999px; transition: width 300ms ease; }
.adp-bar-legend { display: flex; justify-content: space-between; font-size: 0.95rem; color: var(--adp-muted); margin-top: -8px; }
.adp-reg__button {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; min-height: 54px; border: 0; border-radius: 12px; padding: 0 20px;
  background: var(--adp-accent); color: #fff; font-size: 1.15rem; font-weight: 700;
  cursor: pointer; text-decoration: none; transition: background-color 150ms ease;
}
.adp-reg__button:hover:not(:disabled) { background: var(--adp-accent-hover); color: #fff; }
.adp-reg__button:disabled { cursor: not-allowed; }
.adp-reg__button[data-state='closed'],
.adp-reg__button[data-state='full'] { background: #e9e4de; color: #5c524c; }
.adp-reg__button[data-state='registered'] { background: var(--adp-teal-soft); color: var(--adp-teal-ink); }
.adp-reg__note { margin: 0; font-size: 0.875rem; color: var(--adp-muted); text-align: center; }

/* not found */
.adp-empty { padding-top: 48px; padding-bottom: 72px; }
.adp-empty__title { margin: 0 0 16px; font-size: 1.6rem; font-weight: 800; }

@media (max-width: 860px) {
  .adp-hero { grid-template-columns: minmax(0, 1fr); gap: 24px; padding-top: 24px; }
  .adp-hero__media { order: -1; }
}
@media (max-width: 560px) {
  .adp-wrap { padding-inline: 16px; }
  .adp-facts { grid-template-columns: minmax(0, 1fr); }
  .adp-list { grid-template-columns: minmax(0, 1fr); }
  .adp-card { padding: 20px; }
  .adp-cta { align-self: stretch; justify-content: center; }
  .adp-lecturer { flex-direction: column; align-items: flex-start; }
}
`;

const longDateFormatter = new Intl.DateTimeFormat('he-IL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function ActivityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, role: authRole } = useAuth();
  const normalizedRole = (authRole ?? currentUser?.role ?? '').toLowerCase();
  const canManageActivity = normalizedRole === 'admin' || normalizedRole === 'manager';
  const canRegister = Boolean(currentUser) && !canManageActivity;
  const [activity, setActivity] = useState(null);
  const [registrationsCount, setRegistrationsCount] = useState(null);
  const [userRegistration, setUserRegistration] = useState(null);
  const [registeringActivityId, setRegisteringActivityId] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [wasJustRegistered, setWasJustRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadActivity() {
      setIsLoading(true);
      setError('');

      try {
        const activityData = await getActivityById(id);
        const registrationCount = await getActivityRegistrationCount(id);
        setActivity(activityData);
        setRegistrationsCount(registrationCount);
      } catch (err) {
        setError('לא ניתן לטעון את פרטי הפעילות. נסו שוב מאוחר יותר.');
      } finally {
        setIsLoading(false);
      }
    }

    loadActivity();
  }, [canManageActivity, id]);

  useEffect(() => {
    let isMounted = true;

    async function loadUserRegistration() {
      if (!currentUser?.uid) {
        setUserRegistration(null);
        setWasJustRegistered(false);
        return;
      }

      try {
        const registrations = await getUserActivityRegistrations(currentUser.uid);
        if (isMounted) {
          setUserRegistration(
            registrations.find((registration) => registration.activityId === id) || null
          );
          setWasJustRegistered(false);
        }
      } catch (err) {
        console.error('Failed to load activity registrations', err);
        if (isMounted) {
          setRegistrationError('לא ניתן לטעון את ההרשמות שלך כרגע.');
        }
      }
    }

    loadUserRegistration();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid, id]);

  const handleDelete = async () => {
    const confirmed = window.confirm('האם למחוק את הפעילות? לא ניתן לבטל פעולה זו.');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await deleteActivity(id);
      window.alert('הפעילות וההרשמות הקשורות נמחקו בהצלחה');
      navigate('/activities');
    } catch (err) {
      setError('לא ניתן למחוק את הפעילות. נסו שוב.');
      setIsDeleting(false);
    }
  };

  const getAvailableSpots = (targetActivity) => (
    Math.max(
      Number(targetActivity?.maxParticipants || 0) -
        (registrationsCount ?? Number(targetActivity?.currentParticipants || 0)),
      0
    )
  );

  const handleRegister = async () => {
    setRegistrationError('');
    setRegistrationMessage('');

    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!canRegister) {
      setRegistrationError('רק משתמשים רגילים יכולים להירשם לפעילויות.');
      return;
    }

    if (!activity) {
      return;
    }

    if (isActivityRegistrationClosed(activity)) {
      setRegistrationError(
        isOneTimeActivity(activity)
          ? 'ההרשמה לפעילות זו נסגרה כי התאריך עבר.'
          : 'ההרשמה לפעילות זו נסגרה כי הפעילות הסתיימה.'
      );
      return;
    }

    if (getAvailableSpots(activity) <= 0) {
      setRegistrationError('לא נותרו מקומות פנויים לפעילות זו.');
      return;
    }

    setRegisteringActivityId(activity.id);

    try {
      const result = await registerForActivity(activity, currentUser);
      setUserRegistration((currentRegistration) => (
        currentRegistration || {
          id: `${currentUser.uid}_${activity.id}`,
          activityId: activity.id,
          paymentStatus: result.alreadyRegistered ? '' : 'pending',
        }
      ));

      if (!result.alreadyRegistered) {
        setRegistrationsCount((currentCount) => (
          (currentCount ?? Number(activity.currentParticipants || 0)) + 1
        ));
        setWasJustRegistered(true);
      }

      setRegistrationMessage(
        result.alreadyRegistered ? 'כבר נרשמת לפעילות זו.' : 'נרשמת בהצלחה'
      );
    } catch (err) {
      console.error('Failed to register for activity', err);
      setRegistrationError('לא ניתן להשלים את ההרשמה. נסו שוב מאוחר יותר.');
    } finally {
      setRegisteringActivityId('');
    }
  };

  if (isLoading) {
    return <LogoLoader label="טוען פעילות..." />;
  }

  if (!activity) {
    return (
      <section className="adp" dir="rtl">
        <style>{PAGE_STYLES}</style>
        <div className="adp-wrap adp-empty">
          <div className="adp-card">
            <p className="adp-empty__title">{error || 'הפעילות לא נמצאה.'}</p>
            <Link className="adp-back" to="/activities">
              <ArrowRight size={18} aria-hidden="true" />
              חזרה לכל הפעילויות
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const paymentRequired = Boolean(activity.paymentRequired ?? activity.requiresPayment);
  const priceLabel = `₪${Number(activity.price || 0).toLocaleString('he-IL')}`;
  const paymentLabel = paymentRequired ? priceLabel : 'ללא תשלום';
  const categoryLabel = [activity.category, activity.subCategory]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' · ');
  const chipCategory = String(activity.subCategory || activity.category || '').trim();
  const maxParticipants = Number(activity.maxParticipants || 0);
  const displayedRegisteredCount = registrationsCount ?? Number(activity.currentParticipants || 0);
  const displayedAvailableSpots = getAvailableSpots(activity);
  const fillPercent = maxParticipants > 0
    ? Math.min(100, Math.round((displayedRegisteredCount / maxParticipants) * 100))
    : 0;
  const lecturer = activity.lecturer || {};
  const lecturerName = lecturer.name?.trim() || '';
  const lecturerDescription = lecturer.description?.trim() || '';
  const lecturerImage = lecturer.imageBase64?.trim() || '';
  const hasLecturerDetails = Boolean(lecturerName || lecturerDescription || lecturerImage);
  const registrationClosed = isActivityRegistrationClosed(activity);
  const isInactive = activity.isActive === false;
  const isFull = displayedAvailableSpots <= 0;
  const registrationUnavailable = registrationClosed || isFull;
  const registrationPresentation = getRegistrationPresentation(userRegistration, wasJustRegistered);
  const isOneTime = isOneTimeActivity(activity);
  const recurringStartDate = getRecurringStartDate(activity);
  const recurringEndDate = getRecurringEndDate(activity);
  const activityDateValue = isOneTime ? activity.date || activity.activityDate : recurringStartDate;
  const activityDate = toDate(activityDateValue);
  const formattedActivityDateValue = formatActivityDate(activityDateValue);
  const hasDate = formattedActivityDateValue !== '-';
  const formattedEndDate = recurringEndDate ? formatActivityDate(recurringEndDate) : '';

  // Day of week: stored days for recurring activities, derived from the date for one-time ones.
  const storedDays = getActivityDaysOfWeek(activity);
  const derivedDay = isOneTime && activityDate ? ACTIVITY_WEEKDAYS[activityDate.getDay()] : '';
  const daysLabel = storedDays.length ? storedDays.join(', ') : derivedDay;

  const hasPaymentLink = paymentRequired && Boolean(activity.paymentLink);

  // Headline "when" fact.
  let whenValue = '';
  let whenLabel = '';
  if (isOneTime && activityDate) {
    whenValue = longDateFormatter.format(activityDate);
    whenLabel = String(activityDate.getFullYear());
  } else if (!isOneTime && daysLabel) {
    whenValue = `כל יום ${daysLabel}`;
    whenLabel = hasDate
      ? `${formattedActivityDateValue}${formattedEndDate ? ` – ${formattedEndDate}` : ''}`
      : 'פעילות קבועה';
  } else if (hasDate) {
    whenValue = formattedActivityDateValue;
    whenLabel = isOneTime ? 'תאריך' : 'מתאריך';
  }

  const registrationStateKey = registrationClosed
    ? 'closed'
    : isFull
      ? 'full'
      : userRegistration
        ? 'registered'
        : 'available';

  const statusOpen = !isInactive && !registrationUnavailable;
  const statusLabel = isInactive
    ? 'הפעילות לא פעילה'
    : registrationClosed
      ? 'ההרשמה נסגרה'
      : isFull
        ? 'הפעילות מלאה'
        : 'ההרשמה פתוחה';

  const showRegistrationPanel = !canManageActivity;
  const showHeroCta = showRegistrationPanel && !registrationUnavailable && !userRegistration;

  return (
    <section className="adp" dir="rtl">
      <style>{PAGE_STYLES}</style>

      <div className="adp-topbar">
        <div className="adp-wrap adp-topbar__inner">
          <Link className="adp-back" to="/activities">
            <ArrowRight size={18} aria-hidden="true" />
            חזרה לכל הפעילויות
          </Link>
          {canManageActivity && (
            <div className="adp-admin">
              <Link className="adp-btn-sm adp-btn-sm--edit" to={`/activities/${id}/edit`}>
                עריכה
              </Link>
              <button
                className="adp-btn-sm adp-btn-sm--delete"
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? 'מוחק...' : 'מחיקה'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="adp-wrap">
        <div className={`adp-hero${activity.imageUrl ? '' : ' adp-hero--no-image'}`}>
          <div className="adp-hero__text">
            <div className="adp-chips">
              {chipCategory && <span className="adp-chip adp-chip--accent">{chipCategory}</span>}
              <span className="adp-chip adp-chip--teal">
                {isOneTime ? 'פעילות חד־פעמית' : 'פעילות קבועה'}
              </span>
              <span className="adp-chip adp-chip--plain">{paymentLabel}</span>
            </div>

            <h1 className="adp-title">{activity.title}</h1>

            {activity.description ? (
              <p className="adp-desc">{activity.description}</p>
            ) : (
              <p className="adp-desc adp-desc--empty">אין תיאור לפעילות זו.</p>
            )}

            <div className="adp-facts">
              {whenValue && (
                <Fact icon={<Calendar size={20} aria-hidden="true" />} value={whenValue} label={whenLabel} />
              )}
              {activity.time && (
                <Fact icon={<Clock size={20} aria-hidden="true" />} value={activity.time} label="שעת התחלה" />
              )}
              {activity.location && (
                <Fact icon={<MapPin size={20} aria-hidden="true" />} value={activity.location} label="מיקום" />
              )}
              {maxParticipants > 0 && (
                <Fact
                  icon={<Users size={20} aria-hidden="true" />}
                  value={`עד ${maxParticipants} משתתפים`}
                  label="מספר מקומות"
                  teal
                />
              )}
            </div>

            {showHeroCta && (
              <a className="adp-cta" href="#register">
                להרשמה לפעילות
                <ArrowDown size={18} aria-hidden="true" />
              </a>
            )}
          </div>

          {activity.imageUrl && (
            <div className="adp-hero__media">
              <img alt={activity.title} src={activity.imageUrl} />
            </div>
          )}
        </div>

        <div className="adp-body">
          <div className="adp-main">
            {error && (
              <div className="adp-alert adp-alert--error" role="alert">{error}</div>
            )}

            {hasLecturerDetails && (
              <section className="adp-card" aria-labelledby="activity-lecturer-title">
                <div className="adp-lecturer">
                  {lecturerImage && (
                    <img
                      className="adp-lecturer__image"
                      src={lecturerImage}
                      alt={lecturerName || 'תמונת המרצה'}
                    />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p className="adp-lecturer__eyebrow">פרטים על המרצה</p>
                    <h2 className="adp-lecturer__name" id="activity-lecturer-title">
                      {lecturerName || 'מרצה הפעילות'}
                    </h2>
                    {lecturerDescription && (
                      <p className="adp-lecturer__desc">{lecturerDescription}</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            <div className="adp-card">
              <h2 className="adp-card__title">פרטי הפעילות</h2>
              <dl className="adp-list">
                {categoryLabel && <Row label="קטגוריה" value={categoryLabel} />}
                <Row label="סוג" value={isOneTime ? 'חד־פעמית' : 'קבועה'} />
                {hasDate && <Row label={isOneTime ? 'תאריך' : 'מתאריך'} value={formattedActivityDateValue} />}
                {!isOneTime && formattedEndDate && <Row label="עד תאריך" value={formattedEndDate} />}
                {daysLabel && <Row label={storedDays.length > 1 ? 'ימים' : 'יום'} value={daysLabel} />}
                {activity.time && <Row label="שעה" value={activity.time} />}
                {activity.location && <Row label="מיקום" value={activity.location} />}
                <Row label="תשלום" value={paymentLabel} />
                {maxParticipants > 0 && <Row label="מכסה" value={`${maxParticipants} משתתפים`} />}
                {canManageActivity && (
                  <Row label="סטטוס" value={isInactive ? 'לא פעילה' : 'פעילה'} />
                )}
                {hasPaymentLink && (
                  <Row
                    label="קישור לתשלום"
                    value={(
                      <a href={activity.paymentLink} target="_blank" rel="noopener noreferrer">
                        <CreditCard size={18} aria-hidden="true" />
                        מעבר לתשלום
                      </a>
                    )}
                  />
                )}
                {activity.whatsappLink && (
                  <Row
                    label="קבוצת וואטסאפ"
                    value={(
                      <a
                        className="adp-row__wa"
                        href={activity.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle size={18} aria-hidden="true" />
                        הצטרפות לקבוצה
                      </a>
                    )}
                  />
                )}
              </dl>
            </div>
          </div>

          <aside
            id="register"
            className="adp-side adp-card adp-card--raised"
            aria-label={canManageActivity ? 'מצב ההרשמה' : 'הרשמה לפעילות'}
          >
            <div className="adp-reg">
              <div className="adp-reg__head">
                <h2 className="adp-card__title" style={{ margin: 0 }}>
                  {canManageActivity ? 'מצב ההרשמה' : 'הרשמה'}
                </h2>
                <span className={`adp-status ${statusOpen ? 'adp-status--open' : 'adp-status--closed'}`}>
                  <span className="adp-status__dot" aria-hidden="true" />
                  {statusLabel}
                </span>
              </div>

              {maxParticipants > 0 && (
                <>
                  <div className="adp-spots">
                    <span className="adp-spots__num">{displayedAvailableSpots}</span>
                    <span className="adp-spots__label">מקומות פנויים</span>
                  </div>
                  <div
                    className="adp-bar"
                    role="progressbar"
                    aria-label="תפוסת הפעילות"
                    aria-valuemin={0}
                    aria-valuemax={maxParticipants}
                    aria-valuenow={displayedRegisteredCount}
                  >
                    <div className="adp-bar__fill" style={{ width: `${fillPercent}%` }} />
                  </div>
                  <div className="adp-bar-legend">
                    <span>{displayedRegisteredCount} נרשמו</span>
                    <span>מתוך {maxParticipants}</span>
                  </div>
                </>
              )}

              {registrationError && (
                <div className="adp-alert adp-alert--error" role="alert">{registrationError}</div>
              )}
              {registrationMessage && (
                <div className="adp-alert adp-alert--success" role="status">{registrationMessage}</div>
              )}

              {showRegistrationPanel && canRegister && (
                <button
                  className="adp-reg__button"
                  type="button"
                  disabled={
                    registrationUnavailable ||
                    Boolean(userRegistration) ||
                    registeringActivityId === activity.id
                  }
                  data-state={registrationStateKey}
                  onClick={handleRegister}
                >
                  {registrationStateKey === 'registered' && <Check size={20} aria-hidden="true" />}
                  {registrationClosed
                    ? 'ההרשמה נסגרה'
                    : isFull
                      ? 'הפעילות מלאה'
                      : registeringActivityId === activity.id
                        ? 'נרשם...'
                        : registrationPresentation.label === 'הרשמה'
                          ? 'אישור הרשמה'
                          : registrationPresentation.label}
                </button>
              )}

              {showRegistrationPanel && !currentUser && !registrationUnavailable && (
                <>
                  <Link className="adp-reg__button" to="/login">התחברות להרשמה</Link>
                  <p className="adp-reg__note">ההרשמה לפעילויות פתוחה למשתמשים רשומים</p>
                </>
              )}

              {showRegistrationPanel && canRegister && !userRegistration && !registrationUnavailable && paymentRequired && (
                <p className="adp-reg__note">עלות הפעילות: {priceLabel}</p>
              )}

            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Fact({ icon, value, label, teal = false }) {
  return (
    <div className="adp-fact">
      <div className={`adp-fact__icon${teal ? ' adp-fact__icon--teal' : ''}`}>{icon}</div>
      <div className="adp-fact__body">
        <div className="adp-fact__value">{value}</div>
        {label && <div className="adp-fact__label">{label}</div>}
      </div>
    </div>
  );
}

function Row({ label, value, wide = false }) {
  return (
    <div className={`adp-row${wide ? ' adp-row--wide' : ''}`}>
      <dt>{label}</dt>
      <dd>{value ?? '-'}</dd>
    </div>
  );
}

export default ActivityDetails;
