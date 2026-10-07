import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Clock, CreditCard, ImageIcon, MapPin, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import {
  getActivityRegistrations,
  getActivityRegistrationCounts,
  getUserActivityRegistrations,
  registerForActivity,
  removeActivityRegistration,
} from '../services/activityRegistrationsService';
import './Activities.css';
import { getUsers } from '../services/usersService';
import {
  ACTIVITY_WEEKDAYS,
  formatActivityDate,
  generateActivityOccurrences,
  getActivityDaysOfWeek,
} from '../utils/activityDateUtils';
import {
  getActivityDate,
  getRecurringActivityStatus,
  getRecurringEndDate,
  getRecurringStartDate,
  getRegistrationPresentation,
  isActivityRegistrationClosed,
  isOneTimeActivity,
  isOneTimeActivityExpired,
} from '../utils/activityRegistrationUtils';
import LogoLoader from './LogoLoader';

const initialFilters = {
  search: '',
  activityType: 'all',
  dateRange: 'all',
  registrationStatus: 'all',
  sortBy: 'date-asc',
};

const dayOptions = ACTIVITY_WEEKDAYS;
const noDayLabel = 'ללא יום מוגדר';

const getRecurringDays = getActivityDaysOfWeek;

const getActivityTypes = (activity) =>
  [activity.category, activity.subCategory, activity.type]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

const getActivityCategoryLabel = (activity) =>
  [activity.category, activity.subCategory]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' - ');

const formatPrice = (activity) => {
  if (activity.price !== undefined && activity.price !== null && activity.price !== '') {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 2,
    }).format(Number(activity.price) || 0);
  }

  const paymentRequired = Boolean(activity.paymentRequired ?? activity.requiresPayment);
  return paymentRequired
    ? `₪${Number(activity.price || 0).toLocaleString('he-IL')}`
    : 'ללא תשלום';
};

const isInSelectedDateRange = (activity, dateRange) => {
  if (dateRange === 'all') return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activityStart = getActivityDate(activity);
  const activityEnd = isOneTimeActivity(activity)
    ? activityStart
    : (getRecurringEndDate(activity) || activityStart);
  if (!activityStart && !activityEnd) return false;

  const startDay = activityStart ? new Date(activityStart) : null;
  const endDay = activityEnd ? new Date(activityEnd) : null;
  startDay?.setHours(0, 0, 0, 0);
  endDay?.setHours(0, 0, 0, 0);

  if (dateRange === 'future') {
    return (endDay || startDay) >= today;
  }

  const rangeEnd = new Date(today);
  rangeEnd.setDate(rangeEnd.getDate() + (dateRange === 'week' ? 7 : 30));
  return (endDay || startDay) >= today && (startDay || endDay) <= rangeEnd;
};

const monthShortFormatter = new Intl.DateTimeFormat('he-IL', { month: 'short' });
const weekdayFormatter = new Intl.DateTimeFormat('he-IL', { weekday: 'long' });
const formatShortDate = (date) => `${date.getDate()}.${date.getMonth() + 1}`;

/*
 * All styles for this page live here, scoped under .act, so the catalog can be
 * redesigned without touching shared CSS files. Sizes are in rem so the site's
 * accessibility font scale still applies.
 */
const ACTIVITIES_STYLES = `
.act * { font-size: inherit; box-sizing: border-box; }
.act {
  --act-bg: #fbf7f1;
  --act-surface: #ffffff;
  --act-ink: #2b2522;
  --act-ink-soft: #4a403a;
  --act-muted: #6b5f58;
  --act-line: #e8dfd4;
  --act-field: #d9cec2;
  --act-accent: #b4593f;
  --act-accent-hover: #9a4932;
  --act-accent-ink: #8e4330;
  --act-teal: #3f6b5f;
  --act-teal-hover: #2c4d44;
  --act-teal-soft: #e1ecE8;
  --act-danger: #b42318;
  width: 100%;
  min-height: 100vh;
  background: var(--act-bg);
  color: var(--act-ink);
  font-size: 1.0625rem;
  line-height: 1.55;
  text-align: right;
}
.act-wrap { max-width: 1240px; margin: 0 auto; padding: 40px 24px 96px; }
.act-visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* header */
.act-header {
  display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between;
  gap: 18px; margin-bottom: 28px; animation: act-in .7s cubic-bezier(.2,.7,.2,1) both;
}
.act-eyebrow { margin: 0 0 4px; font-size: 0.95rem; font-weight: 700; color: var(--act-accent-ink); }
.act-title { margin: 0; font-size: clamp(2.4rem, 5vw, 3.25rem); font-weight: 800; line-height: 1.05; letter-spacing: -0.5px; color: var(--act-ink); }
.act-subtitle { margin: 8px 0 0; font-size: 1.15rem; color: var(--act-ink-soft); }
.act-header__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.act-toggle { display: inline-flex; padding: 4px; background: var(--act-surface); border: 1px solid var(--act-line); border-radius: 14px; }
.act-toggle__btn {
  min-height: 42px; padding: 0 16px; border: 0; border-radius: 10px; background: transparent;
  color: var(--act-ink-soft); font-size: 0.95rem; font-weight: 700; cursor: pointer;
  transition: background-color .15s ease, color .15s ease;
}
.act-toggle__btn[aria-pressed="true"] { background: var(--act-teal); color: #fff; }

/* buttons */
.act-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 46px; padding: 0 18px; border: 0; border-radius: 12px;
  font-size: 1rem; font-weight: 700; text-decoration: none; cursor: pointer;
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}
.act-btn:disabled { cursor: not-allowed; }
.act-btn--accent { background: var(--act-accent); color: #fff; }
.act-btn--accent:hover { background: var(--act-accent-hover); color: #fff; }
.act-btn--teal { background: var(--act-teal); color: #fff; }
.act-btn--teal:hover:not(:disabled) { background: var(--act-teal-hover); color: #fff; }
.act-btn--ghost { background: var(--act-surface); border: 1px solid var(--act-field); color: var(--act-ink); }
.act-btn--ghost:hover { border-color: var(--act-teal); color: var(--act-teal-hover); }
.act-link-btn {
  min-height: 40px; padding: 0 12px; border: 0; background: transparent; cursor: pointer;
  color: var(--act-teal); font-size: 0.95rem; font-weight: 700; text-decoration: underline; text-underline-offset: 4px;
}

/* filters */
.act-filters {
  display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; padding: 18px;
  background: var(--act-surface); border: 1px solid var(--act-line); border-radius: 20px;
  box-shadow: 0 8px 24px rgba(60,40,25,.06);
}
.act-filters__row { display: flex; flex-wrap: wrap; gap: 12px; }
.act-search { position: relative; flex: 999 1 320px; display: flex; align-items: center; }
.act-search__icon { position: absolute; right: 16px; color: var(--act-muted); pointer-events: none; }
.act-search input {
  width: 100%; height: 52px; padding: 0 48px 0 16px; border: 1px solid var(--act-field); border-radius: 14px;
  background: #fffdfb; color: var(--act-ink); font-size: 1.05rem;
}
.act-select {
  flex: 1 1 180px; height: 52px; padding: 0 14px; border: 1px solid var(--act-field); border-radius: 14px;
  background: #fffdfb; color: var(--act-ink); font-size: 1rem;
}
.act-search input:focus, .act-select:focus { outline: 2px solid var(--act-teal); outline-offset: 1px; border-color: var(--act-teal); }
.act-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.act-chips__divider { width: 1px; height: 26px; margin: 0 6px; background: var(--act-line); }
.act-chip {
  display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 16px;
  border: 1px solid var(--act-field); border-radius: 999px; background: var(--act-surface);
  color: var(--act-ink); font-size: 0.95rem; font-weight: 700; cursor: pointer;
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}
.act-chip:hover { border-color: var(--act-teal); }
.act-chip[aria-pressed="true"] { background: var(--act-teal); border-color: var(--act-teal); color: #fff; }

.act-results-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; min-height: 40px; margin-bottom: 18px; }
.act-count { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--act-ink); }
.act-alert { margin-bottom: 18px; padding: 12px 16px; border-radius: 12px; font-size: 1rem; font-weight: 600; }
.act-alert--error { background: #fdf0ee; border: 1px solid #f1c4bf; color: var(--act-danger); }
.act-alert--success { background: var(--act-teal-soft); border: 1px solid #c3d8d1; color: var(--act-teal-hover); }
.act-empty {
  padding: 48px 24px; text-align: center; background: var(--act-surface);
  border: 1px solid var(--act-line); border-radius: 20px;
}
.act-empty__title { margin: 0 0 18px; font-size: 1.3rem; font-weight: 800; color: var(--act-ink); }

/* cards */
.act-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 24px; }
.act-card {
  display: flex; flex-direction: column; min-width: 0; overflow: hidden;
  background: var(--act-surface); border: 1px solid var(--act-line); border-radius: 22px;
  box-shadow: 0 6px 18px rgba(60,40,25,.06);
  transition: translate .3s ease, box-shadow .3s ease;
}
.act-card:hover { translate: 0 -6px; box-shadow: 0 18px 40px rgba(60,40,25,.14); }
.act-card__media { position: relative; height: 190px; overflow: hidden; background: #ead9cb; }
.act-card__img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform .6s cubic-bezier(.2,.7,.2,1);
}
.act-card:hover .act-card__img { transform: scale(1.06); }
.act-card__img--empty { display: flex; align-items: center; justify-content: center; color: rgba(43,37,34,.35); }
.act-card__shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(25,18,14,.6), rgba(25,18,14,0) 58%); }
.act-status {
  position: absolute; top: 14px; right: 14px; display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 800;
}
.act-status--open { background: var(--act-teal-soft); color: var(--act-teal-hover); }
.act-status--mine { background: #fff; color: var(--act-teal-hover); }
.act-status--upcoming { background: #e3edf5; color: #1f4f6e; }
.act-status--closed { background: #efebe6; color: #5c524c; }
.act-card__media-bottom {
  position: absolute; right: 14px; left: 14px; bottom: 12px;
  display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; color: #fff;
}
.act-card__when { display: flex; align-items: center; gap: 10px; min-width: 0; }
.act-date-badge {
  display: flex; flex-direction: column; align-items: center; min-width: 54px; max-width: 150px;
  padding: 6px 10px; border-radius: 12px; background: #fff; color: var(--act-ink); line-height: 1.1; text-align: center;
}
.act-date-badge__top { font-size: 0.75rem; font-weight: 700; color: var(--act-accent-ink); }
.act-date-badge__main { font-size: 1.2rem; font-weight: 800; overflow-wrap: anywhere; }
.act-card__when-label { font-size: 0.95rem; font-weight: 700; text-shadow: 0 1px 3px rgba(0,0,0,.45); }
.act-card__type {
  flex: 0 0 auto; padding: 4px 12px; border-radius: 999px; font-size: 0.85rem; font-weight: 800;
  color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.25);
}
.act-card__type--recurring { background: var(--act-accent); }
.act-card__type--one-time { background: var(--act-teal); }
.act-card__body { display: flex; flex: 1; flex-direction: column; gap: 12px; padding: 20px 20px 18px; }
.act-card__category { margin: 0; font-size: 0.9rem; font-weight: 700; color: var(--act-accent-ink); }
.act-card__title {
  margin: 2px 0 0; font-size: 1.55rem; font-weight: 800; line-height: 1.2; color: var(--act-ink);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.act-meta { display: flex; flex-wrap: wrap; gap: 8px 18px; margin: 0; padding: 0; list-style: none; font-size: 0.95rem; color: var(--act-ink-soft); }
.act-meta li { display: inline-flex; align-items: center; gap: 6px; }
.act-meta svg { color: var(--act-accent-ink); flex: 0 0 auto; }
.act-card__desc {
  margin: 0; font-size: 0.95rem; color: var(--act-muted);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.act-capacity { margin-top: auto; }
.act-capacity__labels { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px; font-size: 0.875rem; color: var(--act-muted); }
.act-capacity__spots { font-weight: 700; color: var(--act-teal-hover); }
.act-capacity__spots.is-few { color: var(--act-accent-ink); }
.act-capacity__spots.is-full { color: #5c524c; }
.act-capacity__bar { height: 8px; border-radius: 999px; background: #efe8df; overflow: hidden; }
.act-capacity__fill { height: 100%; border-radius: 999px; background: var(--act-teal); transition: width .4s ease; }
.act-capacity__fill.is-few { background: var(--act-accent); }
.act-capacity__fill.is-full { background: #a39a93; }
.act-card__actions { display: flex; flex-wrap: wrap; gap: 10px; padding-top: 6px; }
.act-card__actions > * { flex: 1 1 0; }
.act-register { flex-grow: 1.4 !important; background: var(--act-accent); color: #fff; }
.act-register:hover:not(:disabled) { background: var(--act-accent-hover); }
.act-register[data-state="registered"] { background: var(--act-teal-soft); color: var(--act-teal-hover); }
.act-register[data-state="closed"], .act-register[data-state="full"] { background: #e9e4de; color: #5c524c; }

/* admin registrations */
.act-registrations { margin-top: 6px; padding: 16px; border-radius: 14px; background: var(--act-bg); }
.act-registrations__title { margin: 0 0 8px; font-size: 1.05rem; font-weight: 800; color: var(--act-ink); }
.act-registrations__empty { margin: 0; color: var(--act-muted); }
.act-registrations__scroll { overflow-x: auto; }
.act-table { width: 100%; min-width: 480px; border-collapse: collapse; font-size: 0.875rem; text-align: right; }
.act-table th { padding: 8px 10px; color: var(--act-muted); font-weight: 700; border-bottom: 1px solid var(--act-line); }
.act-table td { padding: 8px 10px; color: var(--act-ink-soft); border-bottom: 1px solid var(--act-line); }
.act-table__name { font-weight: 700; color: var(--act-ink) !important; }
.act-table__remove {
  min-height: 36px; padding: 0 12px; border: 1px solid #f1c4bf; border-radius: 8px;
  background: #fff; color: var(--act-danger); font-weight: 700; cursor: pointer;
}
.act-table__remove:hover:not(:disabled) { background: #fdf0ee; }

/* weekly schedule */
.act-schedule { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 18px; }
.act-day {
  min-width: 0; padding: 18px; background: var(--act-surface);
  border: 1px solid var(--act-line); border-radius: 18px; box-shadow: 0 6px 18px rgba(60,40,25,.06);
}
.act-day__title { margin: 0; padding-bottom: 12px; border-bottom: 2px solid var(--act-accent); font-size: 1.4rem; font-weight: 800; color: var(--act-ink); }
.act-day__list { display: grid; gap: 10px; margin-top: 14px; }
.act-day__empty { margin: 14px 0 0; color: var(--act-muted); }
.act-slot {
  display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; border-radius: 12px;
  background: var(--act-bg); border-inline-start: 4px solid var(--act-teal); color: var(--act-ink); text-decoration: none;
  transition: background-color .15s ease;
}
.act-slot:hover { background: var(--act-teal-soft); color: var(--act-ink); }
.act-slot__time { font-size: 0.875rem; font-weight: 800; color: var(--act-teal-hover); }
.act-slot__title { font-size: 1.05rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.act-slot__meta { font-size: 0.8rem; color: var(--act-muted); }

.act button:focus-visible, .act a:focus-visible { outline: 3px solid #d4a373; outline-offset: 2px; }

@keyframes act-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes act-rise { from { opacity: 0; transform: translateY(40px) scale(.97); } to { opacity: 1; transform: none; } }
@supports (animation-timeline: view()) {
  .act-card { animation: act-rise linear both; animation-timeline: view(); animation-range: entry 0% entry 60%; }
}

@media (max-width: 600px) {
  .act-wrap { padding: 28px 16px 64px; }
  .act-chips__divider { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .act-header, .act-card { animation: none !important; }
  .act-card, .act-card__img { transition: none; }
  .act-card:hover { translate: none; }
}
`;

function Activities() {
  const navigate = useNavigate();
  const { activities, isLoading, error } = useActivities();
  const { currentUser, role: authRole } = useAuth();
  const role = (authRole ?? currentUser?.role ?? '').toLowerCase();
  const canCreateActivity = Boolean(currentUser) && (role === 'admin' || role === 'manager');
  const canRegister = Boolean(currentUser) && !canCreateActivity;
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [activitiesView, setActivitiesView] = useState('catalog');
  const [registrationError, setRegistrationError] = useState('');
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [registeringActivityId, setRegisteringActivityId] = useState('');
  const [successfulRegistrationIds, setSuccessfulRegistrationIds] = useState([]);
  const [registrationCountsByActivityId, setRegistrationCountsByActivityId] = useState({});
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminRegistrationsByActivity, setAdminRegistrationsByActivity] = useState({});
  const [expandedRegistrationActivityId, setExpandedRegistrationActivityId] = useState('');
  const [loadingRegistrationActivityId, setLoadingRegistrationActivityId] = useState('');
  const [removingRegistrationId, setRemovingRegistrationId] = useState('');

  const registrationsByActivityId = useMemo(
    () => new Map(userRegistrations.map((registration) => [registration.activityId, registration])),
    [userRegistrations]
  );

  const adminUsersById = useMemo(() => {
    const usersById = new Map();

    adminUsers.forEach((user) => {
      [user.id, user.uid, user.authUid].filter(Boolean).forEach((userId) => {
        usersById.set(userId, user);
      });
    });

    return usersById;
  }, [adminUsers]);

  const getRegisteredCount = (activity) => (
    registrationCountsByActivityId[activity.id] ?? Number(activity.currentParticipants || 0)
  );

  const getAvailableSpots = (activity) => (
    Math.max(Number(activity.maxParticipants || 0) - getRegisteredCount(activity), 0)
  );

  const availableActivityTypes = useMemo(
    () => Array.from(new Set(activities.flatMap(getActivityTypes)))
      .sort((first, second) => first.localeCompare(second, 'he')),
    [activities]
  );

  const filteredActivities = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLocaleLowerCase('he');

    return activities
      .filter((activity) => {
        const registration = registrationsByActivityId.get(activity.id);
        const searchableText = [
          activity.title,
          activity.description,
          activity.location,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('he');

        const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
        const matchesType =
          filters.activityType === 'all' ||
          getActivityTypes(activity).includes(filters.activityType);
        const matchesDate = isInSelectedDateRange(activity, filters.dateRange);
        const matchesRegistration =
          filters.registrationStatus === 'all' ||
          (filters.registrationStatus === 'registered' && Boolean(registration)) ||
          (filters.registrationStatus === 'not-registered' && !registration);

        return matchesSearch && matchesType && matchesDate && matchesRegistration;
      })
      .sort((first, second) => {
        if (filters.sortBy === 'name-asc') {
          return String(first.title || '').localeCompare(String(second.title || ''), 'he');
        }

        if (filters.sortBy === 'name-desc') {
          return String(second.title || '').localeCompare(String(first.title || ''), 'he');
        }

        const firstDate = getActivityDate(first)?.getTime();
        const secondDate = getActivityDate(second)?.getTime();

        if (!firstDate && !secondDate) return 0;
        if (!firstDate) return 1;
        if (!secondDate) return -1;

        return filters.sortBy === 'date-desc'
          ? secondDate - firstDate
          : firstDate - secondDate;
      });
  }, [activities, filters, registrationsByActivityId]);

  const activitiesByScheduleDay = useMemo(() => {
    const grouped = Object.fromEntries(
      [...dayOptions, noDayLabel].map((day) => [day, []])
    );

    filteredActivities.forEach((activity) => {
      const occurrences = generateActivityOccurrences(activity);

      if (!occurrences.length) {
        grouped[noDayLabel].push({ activity, occurrenceDate: null });
        return;
      }

      occurrences.forEach((occurrenceDate) => {
        const day = dayOptions[occurrenceDate.getDay()] || noDayLabel;
        grouped[day].push({ activity, occurrenceDate });
      });
    });

    Object.values(grouped).forEach((occurrences) => {
      occurrences.sort((first, second) => (
        (first.occurrenceDate?.getTime() || 0) - (second.occurrenceDate?.getTime() || 0)
      ));
    });

    return grouped;
  }, [filteredActivities]);

  useEffect(() => {
    let isMounted = true;

    async function loadRegistrations() {
      if (!currentUser) {
        setUserRegistrations([]);
        return;
      }

      try {
        const registrations = await getUserActivityRegistrations(currentUser.uid);
        if (isMounted) {
          setUserRegistrations(registrations);
        }
      } catch (err) {
        console.error('Failed to load activity registrations', err);
        if (isMounted) {
          setRegistrationError('לא ניתן לטעון את ההרשמות שלך כרגע.');
        }
      }
    }

    loadRegistrations();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;

    async function loadRegistrationCounts() {
      if (!currentUser || !activities.length) {
        setRegistrationCountsByActivityId({});
        return;
      }

      try {
        const counts = await getActivityRegistrationCounts(
          activities.map((activity) => activity.id)
        );
        if (isMounted) {
          setRegistrationCountsByActivityId(counts);
        }
      } catch (err) {
        console.error('Failed to load activity registration counts', err);
      }
    }

    loadRegistrationCounts();

    return () => {
      isMounted = false;
    };
  }, [activities, currentUser]);

  useEffect(() => {
    let isMounted = true;

    async function loadAdminUsers() {
      if (!canCreateActivity) {
        setAdminUsers([]);
        return;
      }

      try {
        const users = await getUsers();
        if (isMounted) {
          setAdminUsers(users);
        }
      } catch (err) {
        console.error('Failed to load users for activity registrations', err);
        if (isMounted) {
          setRegistrationError('לא ניתן לטעון את פרטי המשתמשים כרגע.');
        }
      }
    }

    loadAdminUsers();

    return () => {
      isMounted = false;
    };
  }, [canCreateActivity]);

  const updateFilter = (name, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const resetFilters = () => setFilters(initialFilters);

  const handleRegister = async (activity) => {
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
      setUserRegistrations((currentRegistrations) => (
        currentRegistrations.some((registration) => registration.activityId === activity.id)
          ? currentRegistrations
          : [
            ...currentRegistrations,
            {
              id: `${currentUser.uid}_${activity.id}`,
              activityId: activity.id,
              paymentStatus: result.alreadyRegistered ? '' : 'pending',
            },
          ]
      ));
      if (!result.alreadyRegistered) {
        setRegistrationCountsByActivityId((currentCounts) => ({
          ...currentCounts,
          [activity.id]: (currentCounts[activity.id] ?? Number(activity.currentParticipants || 0)) + 1,
        }));
        setSuccessfulRegistrationIds((currentIds) => (
          currentIds.includes(activity.id) ? currentIds : [...currentIds, activity.id]
        ));
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

  const handleViewRegistrations = async (activityId) => {
    setRegistrationError('');
    setRegistrationMessage('');

    if (!canCreateActivity) {
      setRegistrationError('אין לך הרשאה לצפות ברשימת הנרשמים.');
      return;
    }

    if (expandedRegistrationActivityId === activityId) {
      setExpandedRegistrationActivityId('');
      return;
    }

    setExpandedRegistrationActivityId(activityId);

    if (adminRegistrationsByActivity[activityId]) {
      return;
    }

    setLoadingRegistrationActivityId(activityId);

    try {
      const registrations = await getActivityRegistrations(activityId);
      setAdminRegistrationsByActivity((currentRegistrations) => ({
        ...currentRegistrations,
        [activityId]: registrations,
      }));
    } catch (err) {
      console.error('Failed to load activity registrations for admin view', err);
      setRegistrationError('לא ניתן לטעון את רשימת הנרשמים לפעילות זו.');
    } finally {
      setLoadingRegistrationActivityId('');
    }
  };

  const handleRemoveRegistration = async (activity, registration) => {
    setRegistrationError('');
    setRegistrationMessage('');

    if (!canCreateActivity) {
      setRegistrationError('אין לך הרשאה להסיר נרשמים מפעילות.');
      return;
    }

    const confirmed = window.confirm('האם להסיר את המשתמש מהרישום לפעילות?');
    if (!confirmed) return;

    setRemovingRegistrationId(registration.id);

    try {
      const result = await removeActivityRegistration(activity.id, registration.id);

      setAdminRegistrationsByActivity((currentRegistrations) => ({
        ...currentRegistrations,
        [activity.id]: (currentRegistrations[activity.id] || []).filter(
          (currentRegistration) => currentRegistration.id !== registration.id
        ),
      }));
      if (!result.alreadyRemoved) {
        setRegistrationCountsByActivityId((currentCounts) => ({
          ...currentCounts,
          [activity.id]: Math.max(
            (currentCounts[activity.id] ?? Number(activity.currentParticipants || 0)) - 1,
            0
          ),
        }));
      }
      setRegistrationMessage('המשתמש הוסר מהרישום לפעילות בהצלחה');
    } catch (err) {
      console.error('Failed to remove activity registration', err);
      setRegistrationError('שגיאה בהסרת המשתמש מהרישום לפעילות. נסו שוב');
    } finally {
      setRemovingRegistrationId('');
    }
  };

  const hasActiveFilters =
    filters.search !== initialFilters.search ||
    filters.activityType !== initialFilters.activityType ||
    filters.dateRange !== initialFilters.dateRange ||
    filters.registrationStatus !== initialFilters.registrationStatus ||
    filters.sortBy !== initialFilters.sortBy;

  return (
    <main className="act" dir="rtl">
      <style>{ACTIVITIES_STYLES}</style>
      <div className="act-wrap">
        <header className="act-header">
          <div>
            <p className="act-eyebrow">חוגים · סדנאות · אירועים</p>
            <h1 className="act-title">פעילויות</h1>
            <p className="act-subtitle">צפייה והרשמה לפעילויות וחוגים בבית הופמן</p>
          </div>
          <div className="act-header__actions">
            <div className="act-toggle" role="group" aria-label="בחירת תצוגת פעילויות">
              <button
                type="button"
                className="act-toggle__btn"
                aria-pressed={activitiesView === 'catalog'}
                onClick={() => setActivitiesView('catalog')}
              >
                קטלוג
              </button>
              {!canCreateActivity && (
                <button
                  type="button"
                  className="act-toggle__btn"
                  aria-pressed={activitiesView === 'schedule'}
                  onClick={() => setActivitiesView('schedule')}
                >
                  מערכת שבועית
                </button>
              )}
            </div>
            {canCreateActivity && (
              <Link to="/activities/new" className="act-btn act-btn--accent">
                <Plus size={18} aria-hidden="true" />
                פעילות חדשה
              </Link>
            )}
          </div>
        </header>

        <section className="act-filters" aria-label="סינון פעילויות">
          <div className="act-filters__row">
            <label className="act-search" htmlFor="activity-search">
              <span className="act-visually-hidden">חיפוש חופשי</span>
              <Search className="act-search__icon" size={20} aria-hidden="true" />
              <input
                id="activity-search"
                type="search"
                value={filters.search}
                placeholder="חיפוש לפי שם, תיאור או מיקום"
                onChange={(event) => updateFilter('search', event.target.value)}
              />
            </label>
            <select
              id="activity-date"
              aria-label="תאריך"
              className="act-select"
              value={filters.dateRange}
              onChange={(event) => updateFilter('dateRange', event.target.value)}
            >
              <option value="all">כל התאריכים</option>
              <option value="week">השבוע הקרוב</option>
              <option value="month">החודש הקרוב</option>
              <option value="future">תאריכים עתידיים בלבד</option>
            </select>
            <select
              id="activity-sort"
              aria-label="מיון"
              className="act-select"
              value={filters.sortBy}
              onChange={(event) => updateFilter('sortBy', event.target.value)}
            >
              <option value="date-asc">מיון: תאריך קרוב</option>
              <option value="date-desc">מיון: תאריך רחוק</option>
              <option value="name-asc">מיון: שם א–ת</option>
              <option value="name-desc">מיון: שם ת–א</option>
            </select>
          </div>

          <div className="act-chips" role="group" aria-label="סינון לפי סוג פעילות">
            {['all', ...availableActivityTypes].map((activityType) => (
              <button
                key={activityType}
                type="button"
                className="act-chip"
                aria-pressed={filters.activityType === activityType}
                onClick={() => updateFilter('activityType', activityType)}
              >
                {activityType === 'all' ? 'הכל' : activityType}
              </button>
            ))}
            {canRegister && (
              <>
                <span className="act-chips__divider" aria-hidden="true" />
                <button
                  type="button"
                  className="act-chip"
                  aria-pressed={filters.registrationStatus === 'registered'}
                  onClick={() => updateFilter(
                    'registrationStatus',
                    filters.registrationStatus === 'registered' ? 'all' : 'registered'
                  )}
                >
                  <Check size={16} aria-hidden="true" />
                  הפעילויות שלי
                </button>
              </>
            )}
          </div>
        </section>

        <div className="act-results-bar">
          <p className="act-count">
            {isLoading ? '' : `${filteredActivities.length} פעילויות נמצאו`}
          </p>
          {hasActiveFilters && (
            <button type="button" className="act-link-btn" onClick={resetFilters}>
              איפוס סינון
            </button>
          )}
        </div>

        {error && <div className="act-alert act-alert--error" role="alert">{error}</div>}
        {registrationError && (
          <div className="act-alert act-alert--error" role="alert">{registrationError}</div>
        )}
        {registrationMessage && (
          <div className="act-alert act-alert--success" role="status">{registrationMessage}</div>
        )}

        {isLoading && <LogoLoader label="טוען פעילויות..." />}

        {!isLoading && !error && filteredActivities.length === 0 && (
          <div className="act-empty">
            <p className="act-empty__title">לא נמצאו פעילויות התואמות לסינון שנבחר</p>
            <button type="button" className="act-btn act-btn--teal" onClick={resetFilters}>
              איפוס סינון
            </button>
          </div>
        )}

        {!isLoading && activitiesView === 'catalog' && filteredActivities.length > 0 && (
          <div className="act-grid">
            {filteredActivities.map((activity) => {
              const registration = registrationsByActivityId.get(activity.id);
              const recurringStatus = getRecurringActivityStatus(activity);
              const isExpired = isOneTimeActivityExpired(activity);
              const isEnded = recurringStatus === 'ended';
              const isUpcoming = recurringStatus === 'upcoming';
              const registrationClosed = isExpired || isEnded;
              const registrationPresentation = getRegistrationPresentation(
                registration,
                successfulRegistrationIds.includes(activity.id)
              );
              const oneTime = isOneTimeActivity(activity);
              const activityDate = getActivityDate(activity);
              const registeredCount = getRegisteredCount(activity);
              const availableSpots = getAvailableSpots(activity);
              const maxParticipants = Number(activity.maxParticipants || 0);
              const isFull = availableSpots <= 0;
              const fewSpots = !isFull && availableSpots <= 2;
              const registrationUnavailable = registrationClosed || isFull;
              const fillPercent = maxParticipants > 0
                ? Math.min(100, Math.round((registeredCount / maxParticipants) * 100))
                : 0;
              const recurringDays = getRecurringDays(activity);
              const recurringStart = getRecurringStartDate(activity);
              const recurringEnd = getRecurringEndDate(activity);
              const categoryLabel = getActivityCategoryLabel(activity).replace(' - ', ' · ');

              let badgeTop = '';
              let badgeMain = '';
              let whenLabel = '';
              if (oneTime) {
                if (activityDate) {
                  badgeTop = monthShortFormatter.format(activityDate);
                  badgeMain = String(activityDate.getDate());
                  whenLabel = weekdayFormatter.format(activityDate);
                }
              } else {
                badgeTop = 'כל יום';
                badgeMain = recurringDays.length ? recurringDays.join(', ') : '—';
                whenLabel = [recurringStart, recurringEnd].filter(Boolean).map(formatShortDate).join(' – ');
              }

              let statusLabel = '';
              let statusTone = 'open';
              if (canRegister) {
                if (isExpired) {
                  statusLabel = 'התאריך עבר';
                  statusTone = 'closed';
                } else if (isEnded) {
                  statusLabel = 'הפעילות הסתיימה';
                  statusTone = 'closed';
                } else if (registration) {
                  statusLabel = registrationPresentation.badgeLabel;
                  statusTone = 'mine';
                } else if (isFull) {
                  statusLabel = 'מלא';
                  statusTone = 'closed';
                } else if (isUpcoming) {
                  statusLabel = 'טרם התחילה';
                  statusTone = 'upcoming';
                } else {
                  statusLabel = registrationPresentation.badgeLabel;
                }
              } else if (canCreateActivity && isFull) {
                statusLabel = 'מלא';
                statusTone = 'closed';
              }

              const registerState = registrationClosed
                ? 'closed'
                : isFull
                  ? 'full'
                  : registration
                    ? 'registered'
                    : 'available';

              return (
                <article key={activity.id} className="act-card">
                  <div className="act-card__media">
                    {activity.imageUrl ? (
                      <img className="act-card__img" alt="" src={activity.imageUrl} loading="lazy" />
                    ) : (
                      <div className="act-card__img act-card__img--empty" aria-hidden="true">
                        <ImageIcon size={48} strokeWidth={1.3} />
                      </div>
                    )}
                    <div className="act-card__shade" aria-hidden="true" />
                    {statusLabel && (
                      <span className={`act-status act-status--${statusTone}`}>
                        {statusTone === 'mine' && <Check size={14} aria-hidden="true" />}
                        {statusLabel}
                      </span>
                    )}
                    <div className="act-card__media-bottom">
                      {(badgeTop || badgeMain) && (
                        <div className="act-card__when">
                          <div className="act-date-badge">
                            <span className="act-date-badge__top">{badgeTop}</span>
                            <span className="act-date-badge__main">{badgeMain}</span>
                          </div>
                          {whenLabel && <span className="act-card__when-label">{whenLabel}</span>}
                        </div>
                      )}
                      <span className={`act-card__type act-card__type--${oneTime ? 'one-time' : 'recurring'}`}>
                        {oneTime ? 'חד־פעמית' : 'קבועה'}
                      </span>
                    </div>
                  </div>

                  <div className="act-card__body">
                    <div>
                      {categoryLabel && <p className="act-card__category">{categoryLabel}</p>}
                      <h2 className="act-card__title" title={activity.title}>
                        {activity.title || 'פעילות ללא כותרת'}
                      </h2>
                    </div>

                    <ul className="act-meta">
                      {activity.time && (
                        <li><Clock size={16} aria-hidden="true" />{activity.time}</li>
                      )}
                      {activity.location && (
                        <li><MapPin size={16} aria-hidden="true" />{activity.location}</li>
                      )}
                      <li><CreditCard size={16} aria-hidden="true" />{formatPrice(activity)}</li>
                    </ul>

                    {activity.description && (
                      <p className="act-card__desc">{activity.description}</p>
                    )}

                    {maxParticipants > 0 && (
                      <div className="act-capacity">
                        <div className="act-capacity__labels">
                          <span className={`act-capacity__spots${isFull ? ' is-full' : fewSpots ? ' is-few' : ''}`}>
                            {isFull
                              ? 'הפעילות מלאה'
                              : fewSpots
                                ? `נשארו ${availableSpots} מקומות!`
                                : `${availableSpots} מקומות פנויים`}
                          </span>
                          <span>{registeredCount} מתוך {maxParticipants} רשומים</span>
                        </div>
                        <div
                          className="act-capacity__bar"
                          role="progressbar"
                          aria-label={`תפוסת ${activity.title || 'הפעילות'}`}
                          aria-valuemin={0}
                          aria-valuemax={maxParticipants}
                          aria-valuenow={registeredCount}
                        >
                          <div
                            className={`act-capacity__fill${isFull ? ' is-full' : fewSpots ? ' is-few' : ''}`}
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="act-card__actions">
                      <Link className="act-btn act-btn--ghost" to={`/activities/${activity.id}`}>
                        פרטים
                      </Link>

                      {canRegister && (
                        <button
                          type="button"
                          className="act-btn act-register"
                          data-state={registerState}
                          disabled={
                            registrationUnavailable ||
                            Boolean(registration) ||
                            registeringActivityId === activity.id
                          }
                          onClick={() => handleRegister(activity)}
                        >
                          {registerState === 'registered' && <Check size={18} aria-hidden="true" />}
                          {registrationClosed
                            ? 'ההרשמה נסגרה'
                            : isFull
                              ? 'הפעילות מלאה'
                              : registeringActivityId === activity.id
                                ? 'נרשם...'
                                : registrationPresentation.label}
                        </button>
                      )}

                      {canCreateActivity && (
                        <>
                          <Link className="act-btn act-btn--ghost" to={`/activities/${activity.id}/edit`}>
                            עריכה
                          </Link>
                          <button
                            type="button"
                            className="act-btn act-btn--teal"
                            aria-expanded={expandedRegistrationActivityId === activity.id}
                            disabled={loadingRegistrationActivityId === activity.id}
                            onClick={() => handleViewRegistrations(activity.id)}
                          >
                            נרשמים
                          </button>
                        </>
                      )}
                    </div>

                    {canCreateActivity && expandedRegistrationActivityId === activity.id && (
                      <div className="act-registrations">
                        <h3 className="act-registrations__title">
                          נרשמים לפעילות
                          {adminRegistrationsByActivity[activity.id]
                            ? ` (${adminRegistrationsByActivity[activity.id].length})`
                            : ''}
                        </h3>
                        {loadingRegistrationActivityId === activity.id && <LogoLoader label="טוען נרשמים..." />}
                        {loadingRegistrationActivityId !== activity.id &&
                          (adminRegistrationsByActivity[activity.id]?.length || 0) === 0 && (
                            <p className="act-registrations__empty">אין עדיין נרשמים לפעילות זו</p>
                          )}
                        {loadingRegistrationActivityId !== activity.id &&
                          (adminRegistrationsByActivity[activity.id]?.length || 0) > 0 && (
                            <div className="act-registrations__scroll">
                              <table className="act-table">
                                <thead>
                                  <tr>
                                    <th>שם מלא</th>
                                    <th>אימייל</th>
                                    <th>תאריך הרשמה</th>
                                    <th>תשלום</th>
                                    <th><span className="act-visually-hidden">פעולות</span></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {adminRegistrationsByActivity[activity.id].map((adminRegistration) => {
                                    const registeredUser = adminUsersById.get(adminRegistration.userId);
                                    const fullName =
                                      registeredUser?.fullName ||
                                      registeredUser?.displayName ||
                                      registeredUser?.name ||
                                      adminRegistration.userName ||
                                      'משתמש לא נמצא';
                                    const email =
                                      registeredUser?.email ||
                                      adminRegistration.userEmail ||
                                      '-';
                                    const paymentStatus =
                                      adminRegistration.paymentStatus === 'paid'
                                        ? 'שולם'
                                        : adminRegistration.paymentStatus === 'pending'
                                          ? 'ממתין'
                                          : 'לא צוין';

                                    return (
                                      <tr key={adminRegistration.id}>
                                        <td className="act-table__name">{fullName}</td>
                                        <td>{email}</td>
                                        <td>{formatActivityDate(adminRegistration.registeredAt)}</td>
                                        <td>{paymentStatus}</td>
                                        <td>
                                          <button
                                            className="act-table__remove"
                                            type="button"
                                            disabled={removingRegistrationId === adminRegistration.id}
                                            onClick={() => handleRemoveRegistration(activity, adminRegistration)}
                                            aria-label={`הסר את ${fullName} מהרישום לפעילות`}
                                          >
                                            {removingRegistrationId === adminRegistration.id ? 'מסיר...' : 'הסרה'}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && activitiesView === 'schedule' && filteredActivities.length > 0 && (
          <WeeklySchedule activitiesByScheduleDay={activitiesByScheduleDay} />
        )}
      </div>
    </main>
  );
}

function WeeklySchedule({ activitiesByScheduleDay }) {
  const visibleDays = [...dayOptions, noDayLabel].filter(
    (day) => day !== noDayLabel || activitiesByScheduleDay[day].length > 0
  );

  return (
    <div className="act-schedule">
      {visibleDays.map((day) => (
        <section key={day} className="act-day" aria-label={day}>
          <h2 className="act-day__title">{day}</h2>

          {activitiesByScheduleDay[day].length ? (
            <div className="act-day__list">
              {activitiesByScheduleDay[day].map(({ activity, occurrenceDate }) => (
                <Link
                  key={`${day}-${activity.id}-${occurrenceDate?.toISOString() || 'undefined'}`}
                  className="act-slot"
                  to={`/activities/${activity.id}`}
                >
                  <span className="act-slot__time">{activity.time || 'שעה לא הוגדרה'}</span>
                  <span className="act-slot__title">{activity.title || 'פעילות ללא כותרת'}</span>
                  <span className="act-slot__meta">
                    {[occurrenceDate ? formatActivityDate(occurrenceDate) : '', activity.location]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="act-day__empty">אין פעילויות ביום זה</p>
          )}
        </section>
      ))}
    </div>
  );
}

export default Activities;
