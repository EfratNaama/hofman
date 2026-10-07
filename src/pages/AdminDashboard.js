import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import LogoLoader from '../components/LogoLoader';
import {
  ACTIVITY_WEEKDAYS,
  generateActivityOccurrences,
  getActivityDaysOfWeek,
} from '../utils/activityDateUtils';
import {
  getActivityDate as getStartDate,
  isActivityRegistrationClosed,
  isOneTimeActivity,
} from '../utils/activityRegistrationUtils';
import './AdminDashboard.css';

const collectionNames = {
  users: 'users',
  activities: 'activities',
  registrations: 'activityRegistrations',
  gallery: 'gallery',
};

const initialData = {
  users: [],
  activities: [],
  registrations: [],
  gallery: [],
};

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_WEEKS = 8;
const SCHEDULE_DAYS = ACTIVITY_WEEKDAYS.slice(0, 6); // ראשון–שישי

const chartColors = {
  teal: '#00846F',
  tealDark: '#2C4D44',
  terra: '#D0703E',
  terraSoft: '#E3B79F',
  grid: '#F0E9E2',
  axis: '#E6DDD3',
  text: '#6B5A50',
};

// Validated categorical order (light surface, CVD-safe with labels); a 5th+ category folds into "אחר".
const categoryColors = ['#00846F', '#5B6CC0', '#D0703E', '#B8860B'];

const paymentColors = {
  paid: '#2F8F5B',
  pending: '#C98A12',
  none: '#B9B0A8',
};

const todayFormatter = new Intl.DateTimeFormat('he-IL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortWeekdayFormatter = new Intl.DateTimeFormat('he-IL', { weekday: 'short' });

const toDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const startOfDay = (date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

const formatShortDate = (date) => `${date.getDate()}.${date.getMonth() + 1}`;

const isManagerUser = (user) => {
  const role = String(user.role || user.userType || '').trim().toLowerCase();
  return ['admin', 'manager', 'מנהל'].includes(role);
};

const percent = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

/*
 * All styles for this page live here, scoped under .adb, so the dashboard can be
 * redesigned without touching AdminDashboard.css. Sizes are in rem so the site's
 * accessibility font scale still applies.
 */
const DASHBOARD_STYLES = `
.adb * { font-size: inherit; box-sizing: border-box; }
.adb {
  min-height: 100vh; padding: 32px 20px 64px; background: #f6f2ec; color: #2b211c;
  font-size: 1rem; line-height: 1.5; text-align: right;
}
.adb-shell { max-width: 1240px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.adb-card { min-width: 0; background: #fff; border: 1px solid #ece3da; border-radius: 20px; }
.adb a:focus-visible { outline: 3px solid #d4a373; outline-offset: 2px; }

.adb-header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; }
.adb-title { margin: 0; font-size: clamp(1.8rem, 3vw, 2.2rem); font-weight: 800; line-height: 1.15; color: #2b211c; }
.adb-subtitle { margin: 4px 0 0; color: #6b5a50; font-size: 1rem; }
.adb-date {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px;
  background: #fff; border: 1px solid #ece3da; color: #6b5a50; font-size: 0.875rem; font-weight: 600;
}
.adb-alert { padding: 12px 16px; border-radius: 12px; background: #fdf0ee; border: 1px solid #f1c4bf; color: #b42318; font-weight: 600; }

/* KPI */
.adb-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.adb-kpi { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px; }
.adb-kpi__label { margin: 0; font-size: 0.95rem; font-weight: 600; color: #6b5a50; }
.adb-kpi__value { margin: 6px 0 0; font-size: 2.4rem; font-weight: 800; line-height: 1.1; color: #2b211c; }
.adb-kpi__of { font-size: 1.1rem; font-weight: 600; color: #6b5a50; }
.adb-kpi__note { margin: 4px 0 0; font-size: 0.875rem; color: #6b5a50; }
.adb-kpi__visual { flex: 0 0 auto; }

/* layout */
.adb-row { display: flex; flex-wrap: wrap; gap: 16px; align-items: stretch; }
.adb-row--three { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); }
.adb-panel { padding: 22px 24px; }
.adb-panel--wide { flex: 2 1 560px; }
.adb-panel--side { flex: 1 1 340px; }
.adb-panel__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; }
.adb-panel__title { margin: 0; font-size: 1.2rem; font-weight: 800; color: #2b211c; }
.adb-panel__sub { margin: 2px 0 16px; font-size: 0.875rem; color: #6b5a50; }
.adb-panel__link { font-size: 0.875rem; font-weight: 700; color: #3f6b5f; text-decoration: none; }
.adb-panel__link:hover { color: #2c4d44; text-decoration: underline; }
.adb-key { display: flex; gap: 14px; font-size: 0.8rem; color: #6b5a50; }
.adb-key span { display: inline-flex; align-items: center; gap: 6px; }
.adb-key i { display: inline-block; width: 12px; height: 8px; border-radius: 2px; }

/* occupancy */
.adb-occ { display: flex; flex-direction: column; gap: 14px; margin: 0; padding: 0; list-style: none; }
.adb-occ__row { display: grid; grid-template-columns: minmax(90px, 150px) minmax(0, 1fr) 128px; align-items: center; gap: 12px; }
.adb-occ__name { font-size: 0.95rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #2b211c; text-decoration: none; }
a.adb-occ__name:hover { color: #2c4d44; text-decoration: underline; }
.adb-occ__track { display: block; height: 16px; border-radius: 4px; background: #f0e9e2; overflow: hidden; }
.adb-occ__fill { display: block; height: 100%; border-radius: 4px; background: #00846f; }
.adb-occ__fill.is-full { background: #2c4d44; }
.adb-occ__row:hover .adb-occ__fill { filter: brightness(.92); }
.adb-occ__end { display: flex; align-items: center; gap: 6px; font-size: 0.875rem; }
.adb-occ__count { font-size: 0.95rem; font-weight: 800; }
.adb-tag { padding: 1px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
.adb-tag--full { background: #e6efec; color: #2c4d44; }
.adb-tag--almost { background: #fdf6ea; color: #7a5512; }
.adb-tag--low { background: #fbf1ec; color: #a84f3d; }

/* attention */
.adb-attn { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none; }
.adb-attn__item { display: flex; gap: 12px; padding: 12px 14px; border-radius: 14px; border: 1px solid; }
.adb-attn__icon { width: 32px; height: 32px; flex: 0 0 auto; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.adb-attn__title { margin: 0; font-weight: 700; color: #2b211c; }
.adb-attn__text { margin: 0; font-size: 0.875rem; color: #6b5a50; }
.adb-attn--warn { background: #fdf6ea; border-color: #f1e0be; }
.adb-attn--warn .adb-attn__icon { background: #f6e6c4; color: #7a5512; }
.adb-attn--low { background: #fbf1ec; border-color: #efd5c9; }
.adb-attn--low .adb-attn__icon { background: #f3dcd1; color: #a84f3d; }
.adb-attn--full { background: #eef5f2; border-color: #d3e4dd; }
.adb-attn--full .adb-attn__icon { background: #d9e9e3; color: #2c4d44; }

/* charts */
.adb-chart { height: 220px; }
.adb-chart--days { height: 210px; }
.adb-donut { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; }
.adb-donut__chart { position: relative; width: 140px; height: 140px; flex: 0 0 auto; }
.adb-donut__center {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  line-height: 1.1; pointer-events: none;
}
.adb-donut__total { font-size: 1.6rem; font-weight: 800; }
.adb-donut__caption { font-size: 0.75rem; color: #6b5a50; }
.adb-legend { flex: 1; min-width: 150px; display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; font-size: 0.95rem; }
.adb-legend li { display: flex; align-items: center; gap: 8px; }
.adb-legend__swatch { width: 12px; height: 12px; border-radius: 3px; flex: 0 0 auto; }
.adb-legend__value { margin-right: auto; font-weight: 800; }
.adb-legend__pct { width: 44px; text-align: left; color: #6b5a50; }

.adb-stack { display: flex; gap: 2px; height: 18px; border-radius: 6px; overflow: hidden; background: #f0e9e2; }
.adb-stack span { display: block; height: 100%; }

/* week */
.adb-week { display: flex; flex-direction: column; }
.adb-week__row {
  display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 12px;
  color: #2b211c; text-decoration: none; transition: background-color .15s ease;
}
.adb-week__row:hover { background: #faf5f0; color: #2b211c; }
.adb-week__badge {
  width: 46px; flex: 0 0 auto; display: flex; flex-direction: column; align-items: center;
  padding: 5px 0; border-radius: 12px; background: #f6eee8; line-height: 1.1;
}
.adb-week__day { font-size: 0.75rem; font-weight: 700; color: #a84f3d; }
.adb-week__date { font-size: 1.1rem; font-weight: 800; }
.adb-week__info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.adb-week__title { font-size: 1rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.adb-week__meta { font-size: 0.875rem; color: #6b5a50; }
.adb-week__spots { flex: 0 0 auto; padding: 2px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; white-space: nowrap; }

.adb-empty { padding: 20px; border-radius: 14px; background: #faf6f2; color: #6b5a50; text-align: center; font-size: 0.95rem; }
.adb-denied { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; padding: 32px; }
.adb-denied__title { margin: 0; font-size: 1.6rem; font-weight: 800; }
.adb-home-link {
  display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 12px;
  background: #2b211c; color: #fff; font-weight: 700; text-decoration: none;
}
.adb-home-link:hover { background: #000; color: #fff; }

.adb .recharts-tooltip-wrapper { direction: rtl; }

@media (max-width: 600px) {
  .adb { padding: 24px 14px 48px; }
  .adb-panel { padding: 18px; }
  .adb-occ__row { grid-template-columns: minmax(70px, 110px) minmax(0, 1fr); }
  .adb-occ__end { grid-column: 1 / -1; }
}
`;

const iconBase = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  width: 16,
  height: 16,
  'aria-hidden': 'true',
};

function AttentionIcon({ tone }) {
  if (tone === 'full') {
    return <svg {...iconBase}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
  }
  if (tone === 'low') {
    return (
      <svg {...iconBase}>
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      </svg>
    );
  }
  return (
    <svg {...iconBase}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function EmptyState({ children = 'אין פריטים להצגה כרגע' }) {
  return <div className="adb-empty">{children}</div>;
}

function LoadingDashboard() {
  return <LogoLoader label="טוען את נתוני לוח הבקרה..." />;
}

function ProgressRing({ value }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <svg width="64" height="64" viewBox="0 0 42 42" role="img" aria-label={`תפוסה ממוצעת ${safe}%`}>
      <circle cx="21" cy="21" r="15.9" fill="none" stroke="#F0E9E2" strokeWidth="5" />
      {safe > 0 && (
        <circle
          cx="21"
          cy="21"
          r="15.9"
          fill="none"
          stroke={chartColors.teal}
          strokeWidth="5"
          strokeDasharray={`${safe} ${100 - safe}`}
          strokeDashoffset="25"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

// Tiny trend line, newest point on the left (RTL reading order).
function Sparkline({ values }) {
  if (!values.length) return null;
  const width = 96;
  const height = 40;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? (width - 6) / (values.length - 1) : 0;
  const points = values.map((value, index) => {
    const x = width - 3 - index * step;
    const y = height - 4 - (value / max) * (height - 10);
    return [x, y];
  });
  const last = points[points.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke={chartColors.terra}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill={chartColors.terra} />
    </svg>
  );
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        direction: 'rtl',
        padding: '8px 12px',
        borderRadius: 10,
        background: '#fff',
        border: '1px solid #ece3da',
        boxShadow: '0 8px 20px rgba(43,33,28,.12)',
        fontSize: 14,
      }}
    >
      <div style={{ color: '#6b5a50' }}>{payload[0].payload.tooltipLabel || label}</div>
      <div style={{ fontWeight: 800, color: '#2b211c' }}>
        {payload[0].value} {unit}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { authLoading, currentUser } = useAuth();
  const [data, setData] = useState(initialData);
  const [hasAdminAccess, setHasAdminAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setHasAdminAccess(false);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      let userSnapshot;

      try {
        userSnapshot = await getDoc(doc(db, collectionNames.users, currentUser.uid));
      } catch (queryError) {
        console.error(
          `Admin Dashboard Firestore query failed for collection "${collectionNames.users}" while checking admin access:`,
          queryError
        );

        if (isMounted) {
          setHasAdminAccess(false);
          setError('לא ניתן לאמת את הרשאת מנהל המערכת כרגע.');
          setLoading(false);
        }
        return;
      }

      const userData = userSnapshot.exists() ? userSnapshot.data() : {};
      const isActiveAdmin =
        String(userData.role || '').trim().toLowerCase() === 'admin' &&
        String(userData.status || '').trim().toLowerCase() === 'active';

      if (!isActiveAdmin) {
        if (isMounted) {
          setHasAdminAccess(false);
          setLoading(false);
        }
        return;
      }

      if (!isMounted) return;
      setHasAdminAccess(true);

      const entries = Object.entries(collectionNames);
      const results = await Promise.allSettled(
        entries.map(([, collectionName]) => getDocs(collection(db, collectionName)))
      );

      if (!isMounted) return;

      const nextData = { ...initialData };
      let hasError = false;

      results.forEach((result, index) => {
        const [key] = entries[index];

        if (result.status === 'fulfilled') {
          nextData[key] = result.value.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }));
        } else {
          hasError = true;
          console.error(
            `Admin Dashboard Firestore query failed for collection "${collectionNames[key]}":`,
            result.reason
          );
        }
      });

      setData(nextData);
      setError(hasError ? 'חלק מנתוני לוח הבקרה אינם זמינים כרגע. שאר הנתונים נטענו כרגיל.' : '');
      setLoading(false);
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [authLoading, currentUser]);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const nowMs = Date.now();

    // registrations per activity
    const registrationsByActivity = new Map();
    data.registrations.forEach((registration) => {
      registrationsByActivity.set(
        registration.activityId,
        (registrationsByActivity.get(registration.activityId) || 0) + 1
      );
    });
    const countFor = (activity) => registrationsByActivity.get(activity.id) || 0;

    // users
    const managers = data.users.filter(isManagerUser).length;
    const participants = data.users.length - managers;

    // activities that are still running
    const runningActivities = data.activities.filter(
      (activity) => activity.isActive !== false && !isActivityRegistrationClosed(activity)
    );
    const openActivities = runningActivities.filter((activity) => {
      const max = Number(activity.maxParticipants || 0);
      return max === 0 || countFor(activity) < max;
    });

    // occupancy
    const occupancy = runningActivities
      .filter((activity) => Number(activity.maxParticipants || 0) > 0)
      .map((activity) => {
        const max = Number(activity.maxParticipants);
        const taken = Math.min(countFor(activity), max);
        const pct = percent(taken, max);
        let tag = '';
        if (taken >= max) tag = 'full';
        else if (pct >= 75) tag = 'almost';
        else if (pct < 20) tag = 'low';
        return {
          id: activity.id,
          title: activity.title || 'פעילות ללא כותרת',
          taken,
          max,
          pct,
          tag,
        };
      })
      .sort((first, second) => second.pct - first.pct);
    const seatsTaken = occupancy.reduce((sum, item) => sum + item.taken, 0);
    const seatsTotal = occupancy.reduce((sum, item) => sum + item.max, 0);

    // registrations over time (by registeredAt)
    const registrationDates = data.registrations
      .map((registration) => toDate(registration.registeredAt || registration.createdAt))
      .filter(Boolean);
    const last30Days = registrationDates.filter((date) => nowMs - date.getTime() <= 30 * DAY_MS).length;

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay()); // Sunday
    const weekly = Array.from({ length: TREND_WEEKS }, (_, index) => {
      const start = new Date(thisWeekStart);
      start.setDate(start.getDate() - (TREND_WEEKS - 1 - index) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const count = registrationDates.filter((date) => date >= start && date < end).length;
      const isCurrent = index === TREND_WEEKS - 1;
      return {
        label: isCurrent ? 'השבוע' : formatShortDate(start),
        tooltipLabel: isCurrent ? 'השבוע' : `שבוע שמתחיל ב־${formatShortDate(start)}`,
        count,
      };
    });

    // popular weekdays (registrations by the day the activity takes place)
    const dayCounts = new Map(SCHEDULE_DAYS.map((day) => [day, 0]));
    data.activities.forEach((activity) => {
      const registrations = countFor(activity);
      if (!registrations) return;
      let days = [];
      if (isOneTimeActivity(activity)) {
        const date = toDate(activity.date || activity.activityDate);
        if (date) days = [ACTIVITY_WEEKDAYS[date.getDay()]];
      } else {
        days = getActivityDaysOfWeek(activity);
      }
      days.forEach((day) => {
        if (dayCounts.has(day)) dayCounts.set(day, dayCounts.get(day) + registrations);
      });
    });
    const maxDayCount = Math.max(0, ...dayCounts.values());
    const popularDays = SCHEDULE_DAYS.map((day) => ({
      label: day,
      tooltipLabel: `יום ${day}`,
      count: dayCounts.get(day),
      isTop: maxDayCount > 0 && dayCounts.get(day) === maxDayCount,
    }));

    // categories (top 3 + "אחר")
    const categoryCounts = new Map();
    data.activities.forEach((activity) => {
      const category = String(activity.category || '').trim() || 'ללא קטגוריה';
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });
    const sortedCategories = Array.from(categoryCounts, ([name, value]) => ({ name, value }))
      .sort((first, second) => second.value - first.value);
    const categories = sortedCategories.length > 4
      ? [
          ...sortedCategories.slice(0, 3),
          {
            name: 'שאר הקטגוריות',
            value: sortedCategories.slice(3).reduce((sum, item) => sum + item.value, 0),
          },
        ]
      : sortedCategories;

    // payments
    const paid = data.registrations.filter((registration) => registration.paymentStatus === 'paid').length;
    const pendingRegistrations = data.registrations.filter(
      (registration) => registration.paymentStatus === 'pending'
    );
    const pending = pendingRegistrations.length;
    const noPayment = data.registrations.length - paid - pending;

    // needs attention
    const activityTitleById = new Map(
      data.activities.map((activity) => [activity.id, activity.title || 'פעילות ללא כותרת'])
    );
    const attention = [];
    if (pending > 0) {
      const names = Array.from(
        new Set(pendingRegistrations.map((registration) => (
          registration.activityTitle || activityTitleById.get(registration.activityId)
        )).filter(Boolean))
      );
      attention.push({
        tone: 'warn',
        title: `${pending} הרשמות ממתינות לתשלום`,
        text: names.length ? `ב${names.slice(0, 2).join(' וב')}${names.length > 2 ? ' ועוד' : ''}` : '',
      });
    }
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 14);
    occupancy
      .filter((item) => item.tag === 'low')
      .forEach((item) => {
        const activity = data.activities.find((candidate) => candidate.id === item.id);
        const start = toDate(getStartDate(activity));
        if (start && start >= today && start <= soon) {
          attention.push({
            tone: 'low',
            title: `${item.title}: רק ${item.taken} נרשמו`,
            text: `מתוך ${item.max} מקומות · מתחילה ב־${formatShortDate(start)}`,
          });
        }
      });
    occupancy
      .filter((item) => item.tag === 'full')
      .slice(0, 2)
      .forEach((item) => {
        attention.push({
          tone: 'full',
          title: `${item.title} מלאה (${item.taken}/${item.max})`,
          text: 'אפשר לשקול להגדיל את המכסה',
        });
      });

    // next 7 days, including recurring activities
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const upcoming = runningActivities
      .flatMap((activity) => generateActivityOccurrences(activity)
        .filter((date) => date >= today && date < weekEnd)
        .map((date) => ({ activity, date })))
      .sort((first, second) => first.date - second.date)
      .slice(0, 5)
      .map(({ activity, date }) => {
        const max = Number(activity.maxParticipants || 0);
        const free = Math.max(max - countFor(activity), 0);
        return {
          key: `${activity.id}-${date.getTime()}`,
          id: activity.id,
          title: activity.title || 'פעילות ללא כותרת',
          day: shortWeekdayFormatter.format(date),
          date: date.getDate(),
          meta: [activity.time, activity.location].filter(Boolean).join(' · '),
          max,
          free,
        };
      });

    return {
      managers,
      participants,
      runningCount: runningActivities.length,
      openCount: openActivities.length,
      occupancy,
      averageOccupancy: percent(seatsTaken, seatsTotal),
      seatsTaken,
      seatsTotal,
      last30Days,
      weekly,
      popularDays,
      categories,
      paid,
      pending,
      noPayment,
      attention: attention.slice(0, 4),
      upcoming,
    };
  }, [data]);

  if (authLoading || loading || hasAdminAccess === null) {
    return <LoadingDashboard />;
  }

  if (!currentUser || !hasAdminAccess) {
    return (
      <section className="adb" dir="rtl">
        <style>{DASHBOARD_STYLES}</style>
        <div className="adb-shell">
          <div className="adb-card adb-denied">
            <h1 className="adb-denied__title">אין לך הרשאה לצפות בעמוד זה</h1>
            <Link to="/" className="adb-home-link">חזרה לעמוד הבית</Link>
          </div>
        </div>
      </section>
    );
  }

  const totalRegistrations = data.registrations.length;
  const totalActivities = data.activities.length;
  const totalCategories = stats.categories.reduce((sum, item) => sum + item.value, 0);
  const roles = [
    { name: 'משתתפים', value: stats.participants, color: '#00846F' },
    { name: 'מנהלים', value: stats.managers, color: '#5B6CC0' },
  ];
  const payments = [
    { key: 'paid', name: 'שולם', value: stats.paid },
    { key: 'pending', name: 'ממתין לתשלום', value: stats.pending },
    { key: 'none', name: 'ללא תשלום / לא צוין', value: stats.noPayment },
  ];

  return (
    <main className="adb" dir="rtl">
      <style>{DASHBOARD_STYLES}</style>
      <div className="adb-shell">
        <header className="adb-header">
          <div>
            <h1 className="adb-title">לוח בקרה</h1>
            <p className="adb-subtitle">מה קורה בבית הופמן עכשיו, ומה דורש טיפול</p>
          </div>
          <span className="adb-date">{todayFormatter.format(new Date())}</span>
        </header>

        {error && <div role="alert" className="adb-alert">{error}</div>}

        <section className="adb-kpis" aria-label="נתוני סיכום">
          <article className="adb-card adb-kpi">
            <div>
              <p className="adb-kpi__label">משתמשים</p>
              <p className="adb-kpi__value">{data.users.length}</p>
              <p className="adb-kpi__note">{stats.participants} משתתפים · {stats.managers} מנהלים</p>
            </div>
          </article>

          <article className="adb-card adb-kpi">
            <div>
              <p className="adb-kpi__label">פעילויות פתוחות להרשמה</p>
              <p className="adb-kpi__value">
                {stats.openCount} <span className="adb-kpi__of">מתוך {totalActivities}</span>
              </p>
              <p className="adb-kpi__note">{totalActivities - stats.openCount} הסתיימו או מלאות</p>
            </div>
          </article>

          <article className="adb-card adb-kpi">
            <div>
              <p className="adb-kpi__label">תפוסה ממוצעת</p>
              <p className="adb-kpi__value">{stats.averageOccupancy}%</p>
              <p className="adb-kpi__note">{stats.seatsTaken} מקומות תפוסים מתוך {stats.seatsTotal}</p>
            </div>
            <span className="adb-kpi__visual"><ProgressRing value={stats.averageOccupancy} /></span>
          </article>

          <article className="adb-card adb-kpi">
            <div>
              <p className="adb-kpi__label">הרשמות ב־30 הימים האחרונים</p>
              <p className="adb-kpi__value">{stats.last30Days}</p>
              <p className="adb-kpi__note">{totalRegistrations} הרשמות בסך הכול</p>
            </div>
            <span className="adb-kpi__visual"><Sparkline values={stats.weekly.map((week) => week.count)} /></span>
          </article>
        </section>

        <div className="adb-row">
          <article className="adb-card adb-panel adb-panel--wide">
            <div className="adb-panel__head">
              <h2 className="adb-panel__title">תפוסה לפי פעילות</h2>
              <div className="adb-key" aria-hidden="true">
                <span><i style={{ background: chartColors.teal }} />נרשמו</span>
                <span><i style={{ background: chartColors.grid }} />מקומות פנויים</span>
              </div>
            </div>
            <p className="adb-panel__sub">כמה מקומות נתפסו מתוך המכסה של כל פעילות פעילה</p>
            {stats.occupancy.length ? (
              <ul className="adb-occ">
                {stats.occupancy.slice(0, 8).map((item) => (
                  <li className="adb-occ__row" key={item.id} title={`${item.title}: ${item.taken} מתוך ${item.max} (${item.pct}%)`}>
                    <Link className="adb-occ__name" to={`/activities/${item.id}`}>{item.title}</Link>
                    <span
                      className="adb-occ__track"
                      role="progressbar"
                      aria-label={`תפוסת ${item.title}`}
                      aria-valuemin={0}
                      aria-valuemax={item.max}
                      aria-valuenow={item.taken}
                    >
                      <span
                        className={`adb-occ__fill${item.tag === 'full' ? ' is-full' : ''}`}
                        style={{ width: `${item.taken > 0 ? Math.max(item.pct, 3) : 0}%` }}
                      />
                    </span>
                    <span className="adb-occ__end">
                      <span className="adb-occ__count">{item.taken}/{item.max}</span>
                      {item.tag === 'full' && <span className="adb-tag adb-tag--full">מלא</span>}
                      {item.tag === 'almost' && <span className="adb-tag adb-tag--almost">כמעט מלא</span>}
                      {item.tag === 'low' && <span className="adb-tag adb-tag--low">הרשמה נמוכה</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>אין פעילויות פעילות עם מכסת משתתפים.</EmptyState>
            )}
          </article>

          <article className="adb-card adb-panel adb-panel--side">
            <h2 className="adb-panel__title" style={{ marginBottom: 12 }}>דורש תשומת לב</h2>
            {stats.attention.length ? (
              <ul className="adb-attn">
                {stats.attention.map((item) => (
                  <li className={`adb-attn__item adb-attn--${item.tone}`} key={item.title}>
                    <span className="adb-attn__icon"><AttentionIcon tone={item.tone} /></span>
                    <div>
                      <p className="adb-attn__title">{item.title}</p>
                      {item.text && <p className="adb-attn__text">{item.text}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>הכול תקין, אין כרגע משהו שדורש טיפול.</EmptyState>
            )}
          </article>
        </div>

        <div className="adb-row">
          <article className="adb-card adb-panel adb-panel--wide">
            <h2 className="adb-panel__title">הרשמות לאורך זמן</h2>
            <p className="adb-panel__sub">הרשמות חדשות בכל שבוע · {TREND_WEEKS} השבועות האחרונים</p>
            {stats.weekly.some((week) => week.count > 0) ? (
              <div className="adb-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.weekly} margin={{ top: 22, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      reversed
                      tickLine={false}
                      axisLine={{ stroke: chartColors.axis }}
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                    />
                    <YAxis
                      orientation="right"
                      allowDecimals={false}
                      width={28}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                    />
                    <Tooltip content={<ChartTooltip unit="הרשמות" />} cursor={{ stroke: chartColors.axis }} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={chartColors.terra}
                      strokeWidth={2}
                      fill={chartColors.terra}
                      fillOpacity={0.12}
                      dot={{ r: 4, fill: chartColors.terra, stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState>אין הרשמות עם תאריך בשבועות האחרונים.</EmptyState>
            )}
          </article>

          <article className="adb-card adb-panel adb-panel--side">
            <h2 className="adb-panel__title">ימים פופולריים</h2>
            <p className="adb-panel__sub">הרשמות לפי יום הפעילות בשבוע</p>
            {stats.popularDays.some((day) => day.count > 0) ? (
              <div className="adb-chart adb-chart--days">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.popularDays} margin={{ top: 22, right: 4, left: 4, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      reversed
                      tickLine={false}
                      axisLine={{ stroke: chartColors.axis }}
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                    />
                    <YAxis hide allowDecimals={false} />
                    <Tooltip content={<ChartTooltip unit="הרשמות" />} cursor={{ fill: '#faf5f0' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                      {stats.popularDays.map((day) => (
                        <Cell key={day.label} fill={day.isTop ? chartColors.terra : chartColors.terraSoft} />
                      ))}
                      <LabelList dataKey="count" position="top" style={{ fill: '#2b211c', fontSize: 13, fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState>אין עדיין מספיק הרשמות.</EmptyState>
            )}
          </article>
        </div>

        <div className="adb-row adb-row--three">
          <article className="adb-card adb-panel">
            <h2 className="adb-panel__title">משתמשים לפי תפקיד</h2>
            <p className="adb-panel__sub">{data.users.length} משתמשים</p>
            {data.users.length ? (
              <div className="adb-donut">
                <div className="adb-donut__chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roles}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="62%"
                        outerRadius="100%"
                        paddingAngle={roles.filter((item) => item.value > 0).length > 1 ? 3 : 0}
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {roles.map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="adb-donut__center" aria-hidden="true">
                    <span className="adb-donut__total">{data.users.length}</span>
                    <span className="adb-donut__caption">משתמשים</span>
                  </div>
                </div>
                <ul className="adb-legend">
                  {roles.map((item) => (
                    <li key={item.name}>
                      <span className="adb-legend__swatch" style={{ backgroundColor: item.color }} />
                      {item.name}
                      <b className="adb-legend__value">{item.value}</b>
                      <span className="adb-legend__pct">{percent(item.value, data.users.length)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyState>אין עדיין משתמשים.</EmptyState>
            )}
          </article>

          <article className="adb-card adb-panel">
            <h2 className="adb-panel__title">פעילויות לפי קטגוריה</h2>
            <p className="adb-panel__sub">{totalActivities} פעילויות</p>
            {totalCategories ? (
              <div className="adb-donut">
                <div className="adb-donut__chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categories}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="62%"
                        outerRadius="100%"
                        paddingAngle={stats.categories.length > 1 ? 3 : 0}
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {stats.categories.map((item, index) => (
                          <Cell key={item.name} fill={categoryColors[index % categoryColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="adb-donut__center" aria-hidden="true">
                    <span className="adb-donut__total">{totalActivities}</span>
                    <span className="adb-donut__caption">פעילויות</span>
                  </div>
                </div>
                <ul className="adb-legend">
                  {stats.categories.map((item, index) => (
                    <li key={item.name}>
                      <span className="adb-legend__swatch" style={{ backgroundColor: categoryColors[index % categoryColors.length] }} />
                      {item.name}
                      <b className="adb-legend__value">{item.value}</b>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyState>אין עדיין פעילויות.</EmptyState>
            )}
          </article>

          <article className="adb-card adb-panel">
            <h2 className="adb-panel__title">סטטוס תשלומים</h2>
            <p className="adb-panel__sub">{totalRegistrations} הרשמות</p>
            {totalRegistrations ? (
              <>
                <div className="adb-stack" role="img" aria-label={payments.map((item) => `${item.name}: ${item.value}`).join(', ')}>
                  {payments.filter((item) => item.value > 0).map((item) => (
                    <span
                      key={item.key}
                      title={`${item.name}: ${item.value}`}
                      style={{ flex: item.value, background: paymentColors[item.key] }}
                    />
                  ))}
                </div>
                <ul className="adb-legend" style={{ marginTop: 18 }}>
                  {payments.map((item) => (
                    <li key={item.key}>
                      <span className="adb-legend__swatch" style={{ backgroundColor: paymentColors[item.key] }} />
                      {item.name}
                      <b className="adb-legend__value">{item.value}</b>
                      <span className="adb-legend__pct">{percent(item.value, totalRegistrations)}%</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <EmptyState>אין עדיין הרשמות.</EmptyState>
            )}
          </article>

          <article className="adb-card adb-panel">
            <div className="adb-panel__head" style={{ marginBottom: 8 }}>
              <h2 className="adb-panel__title">השבוע הקרוב</h2>
              <Link to="/activities" className="adb-panel__link">לכל הפעילויות</Link>
            </div>
            {stats.upcoming.length ? (
              <div className="adb-week">
                {stats.upcoming.map((item) => {
                  const full = item.max > 0 && item.free === 0;
                  const few = item.max > 0 && !full && item.free <= 2;
                  return (
                    <Link to={`/activities/${item.id}`} className="adb-week__row" key={item.key}>
                      <span className="adb-week__badge">
                        <span className="adb-week__day">{item.day}</span>
                        <span className="adb-week__date">{item.date}</span>
                      </span>
                      <span className="adb-week__info">
                        <span className="adb-week__title">{item.title}</span>
                        {item.meta && <span className="adb-week__meta">{item.meta}</span>}
                      </span>
                      {item.max > 0 && (
                        <span
                          className="adb-week__spots"
                          style={{
                            background: full ? '#efebe6' : few ? '#fdf6ea' : '#e6efec',
                            color: full ? '#5c524c' : few ? '#7a5512' : '#2c4d44',
                          }}
                        >
                          {full ? 'מלא' : `${item.free} פנויים`}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState>אין פעילויות בשבעת הימים הקרובים.</EmptyState>
            )}
          </article>
        </div>
      </div>
    </main>
  );
}

export default AdminDashboard;
