import { useEffect, useMemo, useRef, useState } from 'react';
import { HebrewCalendar } from '@hebcal/core/dist/esm/hebcal';
import { Calendar, Camera, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import PersonalCalendar from '../components/PersonalCalendar';
import LogoLoader from '../components/LogoLoader';
import { getUserAllRegistrations } from '../services/activityRegistrationsService';
import { getAnnouncements } from '../services/announcementService';
import { db } from '../firebase';
import {
  generateActivityOccurrences,
  getActivityDaysOfWeek,
  getActivityType,
  toDate,
} from '../utils/activityDateUtils';
import './PersonalArea.css';

const allowedImageTypes = ['image/png', 'image/jpeg', 'image/webp'];
const maxProfileImageSize = 500 * 1024;

const getProfileName = (profile, currentUser) => (
  profile?.fullName ||
  profile?.displayName ||
  currentUser?.displayName ||
  currentUser?.email?.split('@')[0] ||
  'משתמש'
);

const getProfileEmail = (profile, currentUser) => (
  profile?.email || currentUser?.email || ''
);

const getInitials = (name, email) => {
  const source = name || email?.split('@')[0] || '';
  const parts = String(source)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'מ';

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const readFileAsDataUrl = (file) => (
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  })
);

const applyActivityTime = (date, activity, registration) => {
  const start = new Date(date);
  const time = activity?.time || registration?.time;
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      start.setHours(hours, minutes, 0, 0);
    }
  }

  return start;
};

const getActivityEnd = (activity, start) => {
  if (activity?.endTime) {
    const explicitEnd = toDate(activity.endTime);
    if (explicitEnd) return explicitEnd;

    if (typeof activity.endTime === 'string' && activity.endTime.includes(':')) {
      const [hours, minutes] = activity.endTime.split(':').map(Number);
      if (Number.isFinite(hours) && Number.isFinite(minutes)) {
        const end = new Date(start);
        end.setHours(hours, minutes, 0, 0);
        return end;
      }
    }
  }

  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return end;
};

const formatDate = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString('he-IL') : 'תאריך לא זמין';
};

const formatTime = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '';
};

const formatAnnouncementDate = (createdAt) => (
  createdAt?.toDate ? createdAt.toDate().toLocaleDateString('he-IL') : ''
);

const formatPrice = (value) =>
  new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const WEEKDAY_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const NEW_ANNOUNCEMENT_DAYS = 14;

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (value, days) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const startOfWeekSunday = (value) => {
  const date = startOfDay(value);
  return addDays(date, -date.getDay());
};

const isSameDay = (first, second) => (
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate()
);

const getGreeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'בוקר טוב';
  if (hour >= 12 && hour < 17) return 'צהריים טובים';
  if (hour >= 17 && hour < 22) return 'ערב טוב';
  return 'לילה טוב';
};

const getCountdownLabel = (date) => {
  const days = Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000);
  if (days <= 0) return 'היום';
  if (days === 1) return 'מחר';
  if (days === 2) return 'מחרתיים';
  return `בעוד ${days} ימים`;
};

const formatShortDate = (date) => `${date.getDate()}.${date.getMonth() + 1}`;

const formatWeekRange = (weekStart) => {
  const weekEnd = addDays(weekStart, 6);
  const endMonth = weekEnd.toLocaleDateString('he-IL', { month: 'long' });
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${weekStart.getDate()}–${weekEnd.getDate()} ב${endMonth}`;
  }
  const startMonth = weekStart.toLocaleDateString('he-IL', { month: 'long' });
  return `${weekStart.getDate()} ב${startMonth} – ${weekEnd.getDate()} ב${endMonth}`;
};

// Hebrew holidays for the visible week (same source and settings as PersonalCalendar).
const getWeekHolidays = (weekStart) => {
  try {
    return HebrewCalendar.calendar({
      start: weekStart,
      end: addDays(weekStart, 6),
      il: true,
      locale: 'he',
      sedrot: false,
      omer: false,
    }).map((holiday, index) => ({
      id: `holiday-${index}`,
      title: holiday.render('he'),
      start: startOfDay(holiday.getDate().greg()),
      type: 'holiday',
    }));
  } catch (error) {
    console.error('Failed to load Hebrew holidays for the week:', error);
    return [];
  }
};

const isPaymentRequired = (activity) => Boolean(activity?.paymentRequired ?? activity?.requiresPayment);

const getPaymentChip = (registration, activity) => {
  if (!isPaymentRequired(activity)) return { label: 'ללא תשלום', tone: 'free' };
  if (registration.paymentStatus === 'paid') return { label: 'שולם', tone: 'ok' };
  return { label: 'ממתין לתשלום', tone: 'wait' };
};

const getScheduleLabel = (activity) => {
  if (getActivityType(activity) === 'חד פעמי') {
    const date = toDate(activity?.date || activity?.activityDate);
    return date ? date.toLocaleDateString('he-IL') : 'חד פעמי';
  }
  const days = getActivityDaysOfWeek(activity);
  return days.length ? `כל יום ${days.join(', ')}` : 'פעילות קבועה';
};

const THUMB_GRADIENTS = [
  'linear-gradient(135deg,#9fc2b6,#3f6b5f)',
  'linear-gradient(135deg,#f0c3a8,#a84f3d)',
  'linear-gradient(135deg,#c9cff0,#5b6cc0)',
  'linear-gradient(135deg,#ecd9a4,#b8860b)',
];

/*
 * Personal-area styles, scoped under .pa so PersonalArea.css and the rest of the site are untouched.
 * Sizes are in rem so the site's accessibility font scale still applies.
 */
const PA_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700&display=swap');
.pa * { font-size: inherit; box-sizing: border-box; }
.pa { width: min(100%, 1280px); margin: 0 auto; padding: 32px 20px 64px; color: #2b211c; font-size: 1rem; line-height: 1.55; text-align: right; }
.pa-ltr { direction: ltr; unicode-bidi: isolate; white-space: nowrap; }
.pa-card { background: #fff; border: 1px solid #ece3da; border-radius: 22px; }
.pa-eyebrow { margin: 0; font-size: 0.82rem; font-weight: 700; color: #a84f3d; letter-spacing: .3px; }
.pa-h2 { margin: 2px 0 0; font-size: 1.4rem; font-weight: 800; color: #2b211c; }
.pa-alert { margin-top: 16px; padding: 12px 16px; border-radius: 12px; background: #fdf0ee; border: 1px solid #f1c4bf; color: #b42318; font-weight: 600; }

/* hero */
.pa-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 440px); gap: 20px; align-items: stretch; }
.pa-me { position: relative; overflow: hidden; display: flex; align-items: center; gap: 24px; padding: 28px 30px; background: #fbf7f1; }
.pa-me::after { content: ""; position: absolute; inset-inline-end: -80px; top: -90px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, #f2dccf 0, rgba(242,220,207,0) 70%); pointer-events: none; }
.pa-avatar { position: relative; flex: none; width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(140deg, #3f6b5f, #2c4d44); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 800; box-shadow: 0 0 0 5px #fff, 0 10px 24px rgba(44,77,68,.25); }
.pa-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.pa-cam { position: absolute; bottom: -2px; inset-inline-start: -2px; width: 36px; height: 36px; padding: 0; border-radius: 50%; background: #2b211c; color: #fff; border: 3px solid #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.pa-cam:hover:not(:disabled) { background: #a84f3d; }
.pa-cam:disabled { opacity: .7; cursor: wait; }
.pa-me__text { position: relative; z-index: 1; min-width: 0; }
.pa-hello { margin: 2px 0 0; font-family: inherit; font-size: clamp(1.9rem, 3.4vw, 2.5rem); font-weight: 700; line-height: 1.15; color: #2b211c; overflow-wrap: anywhere; }
.pa-mail { margin: 6px 0 0; color: #6b5a50; font-size: 0.95rem; overflow-wrap: anywhere; }
.pa-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.pa-chip { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 14px; border-radius: 999px; background: #fff; border: 1px solid #ece3da; font: inherit; font-size: 0.9rem; font-weight: 700; color: #5c4a40; text-decoration: none; cursor: pointer; }
.pa-chip:hover:not(:disabled) { border-color: #c9b6a8; color: #2b211c; }
.pa-upload { margin: 8px 0 0; font-size: 0.88rem; font-weight: 600; color: #6b5a50; }
.pa-upload--error { color: #b42318; }
.pa-upload--ok { color: #1f6b3a; }

.pa-next { position: relative; overflow: hidden; display: flex; gap: 20px; align-items: center; padding: 24px 26px; border-radius: 22px; background: #2c4d44; color: #f3efe8; }
.pa-next::before { content: ""; position: absolute; inset-inline-start: -40px; bottom: -60px; width: 180px; height: 180px; border-radius: 50%; border: 28px solid rgba(255,255,255,.06); pointer-events: none; }
.pa-next .pa-eyebrow { color: #b9d6cd; }
.pa-next__date { flex: none; width: 88px; padding: 10px 0; border-radius: 16px; background: #f3efe8; color: #2c4d44; text-align: center; line-height: 1.15; }
.pa-next__date b { display: block; font-size: 2.2rem; font-weight: 800; }
.pa-next__date span { font-size: 0.82rem; font-weight: 700; }
.pa-next__body { position: relative; min-width: 0; }
.pa-next h3 { margin: 4px 0 2px; font-size: 1.4rem; font-weight: 800; color: #fff; overflow-wrap: anywhere; }
.pa-next p { margin: 0; color: #cfe0da; font-size: 0.95rem; }
.pa-next__foot { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
.pa-soon { padding: 3px 10px; border-radius: 999px; background: #e8a48f; color: #2b211c; font-size: 0.82rem; font-weight: 800; }
.pa-next a { color: #fff; font-weight: 700; font-size: 0.9rem; }
.pa-next a:hover { color: #f3c9b8; }
.pa-next--empty { flex-direction: column; align-items: flex-start; justify-content: center; }

.pa-count { display: inline-flex; align-items: center; gap: 6px; margin: 8px 0 0; padding: 4px 12px; border-radius: 999px; background: #f8e9e4; color: #93422f; font-size: 0.9rem; font-weight: 800; }

/* main grid */
.pa-body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 380px); gap: 20px; margin-top: 20px; align-items: start; }
.pa-week { padding: 24px 26px; min-width: 0; }
.pa-week__top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; }
.pa-seg { display: inline-flex; padding: 4px; border-radius: 12px; background: #f3ede6; }
.pa-seg button { min-height: 36px; padding: 0 14px; border: 0; border-radius: 9px; background: none; font: inherit; font-size: 0.9rem; font-weight: 700; color: #5c4a40; cursor: pointer; }
.pa-seg button[aria-pressed="true"] { background: #fff; color: #2b211c; box-shadow: 0 2px 6px rgba(60,40,25,.1); }
.pa-nav { display: flex; align-items: center; gap: 6px; margin-top: 18px; color: #5c4a40; font-weight: 700; }
.pa-nav button { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; padding: 0 10px; border-radius: 9px; border: 1px solid #e3d7cc; background: #fff; color: #2b211c; font: inherit; font-size: 0.88rem; font-weight: 700; cursor: pointer; }
.pa-nav button:hover { border-color: #c9b6a8; }
.pa-nav__label { margin: 0 6px; }
.pa-strip { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; margin-top: 14px; }
.pa-day { padding: 10px 0 12px; border-radius: 14px; border: 1px solid #ece3da; background: #fbf8f4; text-align: center; font: inherit; color: #2b211c; cursor: pointer; }
.pa-day:hover { border-color: #c9b6a8; }
.pa-day small { display: block; font-size: 0.75rem; font-weight: 700; color: #6b5a50; }
.pa-day b { display: block; font-size: 1.25rem; font-weight: 800; }
.pa-dots { display: flex; justify-content: center; gap: 3px; height: 6px; margin-top: 4px; }
.pa-dots i { width: 6px; height: 6px; border-radius: 50%; background: #3f6b5f; }
.pa-dots i.is-holiday { background: #5b6cc0; }
.pa-day.is-holiday { background: #eef1fb; border-color: #d9def4; }
.pa-day.is-today { background: #2b211c; border-color: #2b211c; color: #fff; }
.pa-day.is-today small { color: #d9cfc6; }
.pa-day.is-today .pa-dots i { background: #e8a48f; }
.pa-day.is-today .pa-dots i.is-holiday { background: #aab4ec; }
.pa-day.is-selected { outline: 3px solid #d4a373; outline-offset: 1px; }

.pa-agenda { display: flex; flex-direction: column; gap: 18px; margin-top: 22px; }
.pa-ag-day { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 16px; }
.pa-ag-day h4 { margin: 8px 0 0; font-size: 0.95rem; font-weight: 800; }
.pa-ag-day h4 span { display: block; font-size: 0.82rem; font-weight: 600; color: #6b5a50; }
.pa-ag-list { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.pa-ev { display: grid; grid-template-columns: 104px 4px minmax(0, 1fr) auto; gap: 14px; align-items: center; padding: 12px 16px; border-radius: 14px; background: #fbf8f4; border: 1px solid #f0e8df; color: inherit; text-decoration: none; transition: background-color .15s ease, border-color .15s ease; }
a.pa-ev:hover { background: #fff; border-color: #e3d7cc; color: inherit; }
.pa-ev time { font-size: 0.95rem; font-weight: 800; }
.pa-ev__bar { height: 36px; border-radius: 4px; background: #3f6b5f; }
.pa-ev__bar.is-once { background: #a84f3d; }
.pa-ev h5 { margin: 0; font-size: 1rem; font-weight: 800; overflow-wrap: anywhere; }
.pa-ev p { margin: 0; font-size: 0.82rem; color: #6b5a50; }
.pa-ev--holiday { background: #f6f7fd; border-color: #e3e7f7; }
.pa-ev--holiday .pa-ev__bar { background: #5b6cc0; }
.pa-tag { padding: 3px 10px; border-radius: 999px; background: #e6efec; color: #2c4d44; font-size: 0.75rem; font-weight: 800; white-space: nowrap; }
.pa-tag.is-once { background: #f8e9e4; color: #93422f; }
.pa-tag.is-holiday { background: #eef1fb; color: #3d4a8f; }
.pa-empty { padding: 12px 16px; border-radius: 14px; border: 1px dashed #e3d7cc; color: #6b5a50; font-size: 0.9rem; }
.pa-empty a, .pa-link { color: #a84f3d; font-weight: 700; }
.pa-link-btn { border: 0; background: none; padding: 0; font: inherit; color: #a84f3d; font-weight: 700; cursor: pointer; text-decoration: underline; }
.pa-cal { margin-top: 18px; }

/* side */
.pa-side { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.pa-box { padding: 22px; }
.pa-box__head { display: flex; justify-content: space-between; align-items: flex-end; gap: 10px; margin-bottom: 12px; }
.pa-box__head a { font-size: 0.9rem; font-weight: 700; color: #a84f3d; }
.pa-my { margin: 0; padding: 0; list-style: none; }
.pa-my li + li { border-top: 1px solid #f0e8df; }
.pa-my a { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 11px 0; color: inherit; text-decoration: none; }
.pa-my a:hover h5 { color: #a84f3d; }
.pa-thumb { width: 44px; height: 44px; border-radius: 12px; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; }
.pa-my h5 { margin: 0; font-size: 0.95rem; font-weight: 800; overflow-wrap: anywhere; }
.pa-my p { margin: 0; font-size: 0.82rem; color: #6b5a50; }
.pa-pay { padding: 3px 9px; border-radius: 999px; font-size: 0.75rem; font-weight: 800; white-space: nowrap; }
.pa-pay--ok { background: #e3f1e8; color: #1f6b3a; }
.pa-pay--wait { background: #fdf6ea; color: #7a5512; }
.pa-pay--free { background: #f3ede6; color: #5c524c; }
.pa-sum { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 12px; padding: 14px 16px; border-radius: 14px; background: #fbf7f1; }
.pa-sum span { font-size: 0.9rem; color: #6b5a50; }
.pa-sum b { font-size: 1.35rem; font-weight: 800; }
.pa-msg { padding: 12px 0; }
.pa-msg + .pa-msg { border-top: 1px solid #f0e8df; }
.pa-msg:first-of-type { padding-top: 0; }
.pa-msg__top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.pa-msg h5 { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 0.95rem; font-weight: 800; }
.pa-msg__new { flex: none; width: 8px; height: 8px; border-radius: 50%; background: #a84f3d; }
.pa-msg time { font-size: 0.75rem; color: #8a7a70; white-space: nowrap; }
.pa-msg p { margin: 3px 0 0; font-size: 0.9rem; color: #5c4a40; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pa-muted { margin: 0; color: #6b5a50; font-size: 0.9rem; }
.pa a:focus-visible, .pa button:focus-visible { outline: 3px solid #d4a373; outline-offset: 2px; }

@media (max-width: 1080px) {
  .pa-hero, .pa-body { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .pa { padding: 20px 14px 48px; }
  .pa-me { flex-direction: column; align-items: flex-start; padding: 22px; }
  .pa-week { padding: 18px 16px; }
  .pa-strip { gap: 4px; }
  .pa-day b { font-size: 1.05rem; }
  .pa-ag-day { grid-template-columns: 1fr; gap: 6px; }
  .pa-ag-day h4 { margin: 0; }
  .pa-ag-day h4 span { display: inline; margin-inline-start: 6px; }
  .pa-ev { grid-template-columns: 4px minmax(0, 1fr) auto; }
  .pa-ev time { grid-column: 2; grid-row: 2; font-size: 0.85rem; color: #5c4a40; }
  .pa-ev__bar { grid-row: 1 / span 2; height: 100%; }
  .pa-ev .pa-tag { grid-row: 1 / span 2; }
}
`;

function PersonalArea() {
  const { currentUser } = useAuth();
  const currentUserUid = currentUser?.uid;
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [error, setError] = useState('');
  const [announcementsError, setAnnouncementsError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeekSunday(new Date()));
  const [selectedDay, setSelectedDay] = useState(null);
  const [scheduleView, setScheduleView] = useState('agenda'); // 'agenda' | 'calendar'

  useEffect(() => {
    let isMounted = true;

    async function loadPersonalArea() {
      if (!currentUserUid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const registrationData = await getUserAllRegistrations(currentUserUid);
        const userSnap = await getDoc(doc(db, 'users', currentUserUid));
        const profileData = userSnap.exists()
          ? { id: userSnap.id, ...userSnap.data() }
          : null;
        const firestorePhoto = profileData?.photoURL || '';

        if (isMounted) {
          setRegistrations(registrationData);
          setProfile(profileData);
          setProfilePhoto(firestorePhoto || '');
        }
      } catch (loadError) {
        console.error('Failed to load personal area:', loadError);
        if (isMounted) {
          setError('לא ניתן לטעון את האזור האישי כרגע.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPersonalArea();

    return () => {
      isMounted = false;
    };
  }, [currentUserUid]);

  useEffect(() => {
    let isMounted = true;

    async function loadAnnouncementsPreview() {
      setAnnouncementsLoading(true);
      setAnnouncementsError('');

      try {
        const announcementsData = await getAnnouncements();

        if (isMounted) {
          setAnnouncements(
            announcementsData
              .filter((announcement) => announcement.isActive !== false)
              .slice(0, 3)
          );
        }
      } catch (loadError) {
        console.error('Failed to load announcements preview:', loadError);
        if (isMounted) {
          setAnnouncementsError('לא ניתן לטעון את ההודעות כרגע.');
        }
      } finally {
        if (isMounted) setAnnouncementsLoading(false);
      }
    }

    loadAnnouncementsPreview();

    return () => {
      isMounted = false;
    };
  }, []);

  const profileName = getProfileName(profile, currentUser);
  const profileEmail = getProfileEmail(profile, currentUser);
  const explicitProfileName = profile?.fullName || profile?.displayName || currentUser?.displayName || '';
  const profileInitials = getInitials(explicitProfileName, profileEmail);

  const handlePhotoButtonClick = () => {
    setUploadError('');
    setUploadMessage('');
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !currentUser) return;

    setUploadError('');
    setUploadMessage('');

    if (!allowedImageTypes.includes(file.type)) {
      setUploadError('ניתן להעלות קובץ תמונה בלבד');
      return;
    }

    if (file.size > maxProfileImageSize) {
      setUploadError('גודל התמונה גדול מדי. ניתן להעלות תמונה עד 500KB');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const base64 = await readFileAsDataUrl(file);
      const userRef = doc(db, 'users', currentUser.uid);

      await setDoc(userRef, {
        photoURL: base64,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const savedSnap = await getDoc(userRef);
      const savedProfile = savedSnap.exists()
        ? { id: savedSnap.id, ...savedSnap.data() }
        : null;
      const savedPhoto = savedProfile?.photoURL || base64;

      setProfile(savedProfile || {
        id: currentUser.uid,
        email: profileEmail || currentUser.email || '',
        fullName: explicitProfileName || profileName,
        photoURL: base64,
      });
      setProfilePhoto(savedPhoto || '');
      setUploadMessage('תמונת הפרופיל עודכנה בהצלחה');
    } catch (photoError) {
      console.error('Failed to update profile photo:', photoError);
      setUploadError('לא ניתן לעדכן את תמונת הפרופיל כרגע');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const activityEvents = useMemo(() => (
    registrations
      .flatMap(({ registration, activity }) => {
        const sourceActivity = activity || {
          type: 'חד פעמי',
          date: registration.date,
          activityDate: registration.activityDate,
        };
        const occurrences = generateActivityOccurrences(sourceActivity);

        return occurrences.map((occurrenceDate, index) => {
          const start = applyActivityTime(occurrenceDate, activity, registration);
          return {
            id: `${registration.id}-${index}`,
            registrationId: registration.id,
            activityId: activity?.id || registration.activityId,
            title: activity?.title || registration.activityTitle || 'פעילות',
            location: activity?.location || '',
            start,
            end: getActivityEnd(activity, start),
            type: 'activity',
            activityType: getActivityType(sourceActivity),
            allDay: false,
          };
        });
      })
  ), [registrations]);

  const upcomingActivities = useMemo(() => {
    const now = new Date();
    return [...activityEvents]
      .filter((event) => event.start >= now)
      .sort((first, second) => first.start - second.start)
      .slice(0, 4);
  }, [activityEvents]);

  const nextActivity = upcomingActivities[0] || null;

  const currentMonthPaidActivities = useMemo(() => {
    const now = new Date();

    return registrations.filter(({ registration, activity }) => {
      const registeredAt = toDate(registration.registeredAt);
      const paymentRequired = Boolean(
        activity?.paymentRequired ?? activity?.requiresPayment
      );

      return (
        paymentRequired &&
        registeredAt &&
        registeredAt.getMonth() === now.getMonth() &&
        registeredAt.getFullYear() === now.getFullYear()
      );
    });
  }, [registrations]);

  const monthlyTotal = currentMonthPaidActivities.reduce(
    (total, { activity }) => total + Number(activity?.price ?? activity?.cost ?? 0),
    0
  );

  const today = startOfDay(new Date());
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );
  const weekHolidays = useMemo(() => getWeekHolidays(weekStart), [weekStart]);

  const weekItemsByDay = useMemo(() => weekDays.map((day) => {
    const holidays = weekHolidays.filter((holiday) => isSameDay(holiday.start, day));
    const activities = activityEvents
      .filter((event) => isSameDay(event.start, day))
      .sort((first, second) => first.start - second.start);
    return { day, holidays, activities };
  }), [weekDays, weekHolidays, activityEvents]);

  const visibleDays = selectedDay
    ? weekItemsByDay.filter(({ day }) => isSameDay(day, selectedDay))
    : weekItemsByDay;
  const busyDays = visibleDays.filter(({ holidays, activities }) => holidays.length || activities.length);
  const quietDays = visibleDays.filter(({ holidays, activities }) => !holidays.length && !activities.length);

  const goToWeek = (offset) => {
    setSelectedDay(null);
    setWeekStart((current) => addDays(current, offset * 7));
  };

  const goToToday = () => {
    setSelectedDay(null);
    setWeekStart(startOfWeekSunday(new Date()));
  };

  const toggleDay = (day) => {
    setSelectedDay((current) => (current && isSameDay(current, day) ? null : day));
  };

  const getDayHeading = (day) => {
    if (isSameDay(day, today)) return 'היום';
    if (isSameDay(day, addDays(today, 1))) return 'מחר';
    return `יום ${WEEKDAY_SHORT[day.getDay()]}`;
  };

  return (
    <main className="pa" dir="rtl">
      <style>{PA_STYLES}</style>

      <section className="pa-hero" aria-label="פרופיל והפעילות הבאה">
        <div className="pa-card pa-me">
          <div className="pa-avatar">
            {profilePhoto ? <img alt={profileName} src={profilePhoto} /> : <span>{profileInitials}</span>}
            <button
              aria-label="עדכון תמונת פרופיל"
              className="pa-cam"
              disabled={isUploadingPhoto}
              type="button"
              onClick={handlePhotoButtonClick}
            >
              <Camera size={16} aria-hidden="true" />
            </button>
            <input
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              hidden
              type="file"
              onChange={handlePhotoChange}
            />
          </div>

          <div className="pa-me__text">
            <p className="pa-eyebrow">אזור אישי</p>
            <h1 className="pa-hello">{getGreeting()}, {profileName}</h1>
            {profileEmail && <p className="pa-mail"><span className="pa-ltr">{profileEmail}</span></p>}
            {!loading && (
              <p className="pa-count">
                <Calendar size={16} aria-hidden="true" />
                {registrations.length === 1 ? 'רשום/ה לפעילות אחת' : `רשום/ה ל־${registrations.length} פעילויות`}
              </p>
            )}
            <div className="pa-chips">
              <button className="pa-chip" type="button" disabled={isUploadingPhoto} onClick={handlePhotoButtonClick}>
                {isUploadingPhoto ? 'מעלה תמונה...' : 'שינוי תמונה'}
              </button>
              <Link className="pa-chip" to="/activities">לקטלוג הפעילויות ←</Link>
            </div>
            {uploadError && <p className="pa-upload pa-upload--error" role="alert">{uploadError}</p>}
            {uploadMessage && <p className="pa-upload pa-upload--ok">{uploadMessage}</p>}
          </div>
        </div>

        {nextActivity ? (
          <div className="pa-next">
            <div className="pa-next__date" aria-hidden="true">
              <span>יום {WEEKDAY_SHORT[nextActivity.start.getDay()]}</span>
              <b>{nextActivity.start.getDate()}</b>
              <span>{nextActivity.start.toLocaleDateString('he-IL', { month: 'long' })}</span>
            </div>
            <div className="pa-next__body">
              <p className="pa-eyebrow">הפעילות הבאה שלך</p>
              <h3>{nextActivity.title}</h3>
              <p>
                {formatDate(nextActivity.start)}
                {' · '}
                <span className="pa-ltr">{formatTime(nextActivity.start)}</span>
                {nextActivity.location && ` · ${nextActivity.location}`}
              </p>
              <div className="pa-next__foot">
                <span className="pa-soon">{getCountdownLabel(nextActivity.start)}</span>
                {nextActivity.activityId && <Link to={`/activities/${nextActivity.activityId}`}>פרטים</Link>}
              </div>
            </div>
          </div>
        ) : (
          <div className="pa-next pa-next--empty">
            <p className="pa-eyebrow">הפעילות הבאה שלך</p>
            <h3>{loading ? 'טוען...' : 'אין פעילויות קרובות'}</h3>
            {!loading && <Link to="/activities">מצאו פעילות שמתאימה לכם ←</Link>}
          </div>
        )}
      </section>

      {error && <div className="pa-alert" role="alert">{error}</div>}

      {loading ? (
        <LogoLoader label="טוען את האזור האישי..." />
      ) : (
        <>
          <section className="pa-body">
            <div className="pa-card pa-week">
              <div className="pa-week__top">
                <div>
                  <p className="pa-eyebrow">הלוח שלי</p>
                  <h2 className="pa-h2">{scheduleView === 'agenda' ? 'השבוע שלי' : 'הלו"ז האישי'}</h2>
                </div>
                <div className="pa-seg" role="group" aria-label="תצוגת הלוח">
                  <button type="button" aria-pressed={scheduleView === 'agenda'} onClick={() => setScheduleView('agenda')}>
                    סדר יום
                  </button>
                  <button type="button" aria-pressed={scheduleView === 'calendar'} onClick={() => setScheduleView('calendar')}>
                    יומן מלא
                  </button>
                </div>
              </div>

              {scheduleView === 'calendar' ? (
                <div className="personal-area__panel--calendar pa-cal">
                  <PersonalCalendar activityEvents={activityEvents} />
                </div>
              ) : (
                <>
                  <div className="pa-nav">
                    <button type="button" aria-label="השבוע הקודם" onClick={() => goToWeek(-1)}>
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                    <span className="pa-nav__label">{formatWeekRange(weekStart)}</span>
                    <button type="button" aria-label="השבוע הבא" onClick={() => goToWeek(1)}>
                      <ChevronLeft size={18} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={goToToday}>היום</button>
                  </div>

                  <div className="pa-strip">
                    {weekItemsByDay.map(({ day, holidays, activities }) => {
                      const isToday = isSameDay(day, today);
                      const isSelected = selectedDay && isSameDay(day, selectedDay);
                      const classes = [
                        'pa-day',
                        isToday ? 'is-today' : '',
                        holidays.length ? 'is-holiday' : '',
                        isSelected ? 'is-selected' : '',
                      ].filter(Boolean).join(' ');
                      return (
                        <button
                          key={day.toISOString()}
                          className={classes}
                          type="button"
                          aria-pressed={Boolean(isSelected)}
                          aria-label={`${day.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}: ${activities.length} פעילויות`}
                          onClick={() => toggleDay(day)}
                        >
                          <small>{WEEKDAY_SHORT[day.getDay()]}{isToday ? ' · היום' : ''}</small>
                          <b>{day.getDate()}</b>
                          <span className="pa-dots" aria-hidden="true">
                            {holidays.slice(0, 1).map((holiday) => <i key={holiday.id} className="is-holiday" />)}
                            {activities.slice(0, 3).map((event) => <i key={event.id} />)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pa-agenda">
                    {busyDays.map(({ day, holidays, activities }) => (
                      <div className="pa-ag-day" key={day.toISOString()}>
                        <h4>{getDayHeading(day)}<span>{WEEKDAY_SHORT[day.getDay()]} {formatShortDate(day)}</span></h4>
                        <div className="pa-ag-list">
                          {holidays.map((holiday) => (
                            <div className="pa-ev pa-ev--holiday" key={holiday.id}>
                              <time>כל היום</time>
                              <span className="pa-ev__bar" aria-hidden="true" />
                              <div><h5>{holiday.title}</h5><p>לוח עברי</p></div>
                              <span className="pa-tag is-holiday">חג / מועד</span>
                            </div>
                          ))}
                          {activities.map((event) => {
                            const isOnce = event.activityType === 'חד פעמי';
                            const content = (
                              <>
                                <time className="pa-ltr">{formatTime(event.start)}–{formatTime(event.end)}</time>
                                <span className={`pa-ev__bar${isOnce ? ' is-once' : ''}`} aria-hidden="true" />
                                <div>
                                  <h5>{event.title}</h5>
                                  {event.location && <p><MapPin size={12} aria-hidden="true" /> {event.location}</p>}
                                </div>
                                <span className={`pa-tag${isOnce ? ' is-once' : ''}`}>{isOnce ? 'חד פעמי' : 'קבוע'}</span>
                              </>
                            );
                            return event.activityId ? (
                              <Link className="pa-ev" key={event.id} to={`/activities/${event.activityId}`}>{content}</Link>
                            ) : (
                              <div className="pa-ev" key={event.id}>{content}</div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {quietDays.length > 0 && (
                      <div className="pa-ag-day">
                        <h4>
                          {quietDays.length === 7 ? 'כל השבוע' : quietDays.map(({ day }) => WEEKDAY_SHORT[day.getDay()]).join(', ')}
                        </h4>
                        <div className="pa-ag-list">
                          <div className="pa-empty">
                            {quietDays.length === 1 ? 'אין פעילויות ביום הזה.' : 'אין פעילויות בימים האלה.'}{' '}
                            <Link to="/activities">מצאו משהו חדש ←</Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedDay && (
                      <button className="pa-link-btn" type="button" onClick={() => setSelectedDay(null)}>
                        הצגת כל השבוע
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <aside className="pa-side" aria-label="הפעילויות וההודעות שלי">
              <section className="pa-card pa-box" aria-labelledby="pa-my-title">
                <div className="pa-box__head">
                  <div>
                    <p className="pa-eyebrow">הרשמות</p>
                    <h2 id="pa-my-title" className="pa-h2">הפעילויות שלי</h2>
                  </div>
                  <Link to="/activities">לכל הפעילויות</Link>
                </div>

                {registrations.length ? (
                  <ul className="pa-my">
                    {registrations.map(({ registration, activity }, index) => {
                      const chip = getPaymentChip(registration, activity);
                      const title = activity?.title || registration.activityTitle || 'פעילות';
                      const price = isPaymentRequired(activity) ? Number(activity?.price ?? activity?.cost ?? 0) : 0;
                      const thumbStyle = activity?.imageUrl
                        ? { backgroundImage: `url("${activity.imageUrl}")` }
                        : { background: THUMB_GRADIENTS[index % THUMB_GRADIENTS.length] };
                      return (
                        <li key={registration.id}>
                          <Link to={`/activities/${activity?.id || registration.activityId}`}>
                            <span className="pa-thumb" style={thumbStyle} aria-hidden="true">
                              {!activity?.imageUrl && title.charAt(0)}
                            </span>
                            <div>
                              <h5>{title}</h5>
                              <p>
                                {getScheduleLabel(activity)}
                                {activity?.time && <> · <span className="pa-ltr">{activity.time}</span></>}
                                {price > 0 && ` · ${formatPrice(price)}`}
                              </p>
                            </div>
                            <span className={`pa-pay pa-pay--${chip.tone}`}>{chip.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="pa-muted">
                    עדיין לא נרשמת לפעילויות. <Link className="pa-link" to="/activities">לקטלוג ←</Link>
                  </p>
                )}

                {currentMonthPaidActivities.length > 0 && (
                  <div className="pa-sum">
                    <span>סה״כ לתשלום החודש ({currentMonthPaidActivities.length} פעילויות)</span>
                    <b>{formatPrice(monthlyTotal)}</b>
                  </div>
                )}
              </section>

              <section className="pa-card pa-box" aria-labelledby="pa-msg-title">
                <div className="pa-box__head">
                  <div>
                    <p className="pa-eyebrow">עדכונים</p>
                    <h2 id="pa-msg-title" className="pa-h2">הודעות</h2>
                  </div>
                  <Link to="/announcements">כל ההודעות</Link>
                </div>

                {announcementsError && <p className="pa-upload pa-upload--error">{announcementsError}</p>}
                {announcementsLoading && <LogoLoader label="טוען הודעות..." />}
                {!announcementsLoading && !announcementsError && announcements.length === 0 && (
                  <p className="pa-muted">אין הודעות חדשות כרגע.</p>
                )}

                {!announcementsLoading && announcements.map((announcement) => {
                  const createdAt = toDate(announcement.createdAt);
                  const isNew = createdAt && today - startOfDay(createdAt) <= NEW_ANNOUNCEMENT_DAYS * 86400000;
                  return (
                    <article className="pa-msg" key={announcement.id}>
                      <div className="pa-msg__top">
                        <h5>
                          {isNew && <span className="pa-msg__new" aria-label="חדש" />}
                          {announcement.title}
                        </h5>
                        {formatAnnouncementDate(announcement.createdAt) && (
                          <time>{formatAnnouncementDate(announcement.createdAt)}</time>
                        )}
                      </div>
                      <p>{announcement.content || announcement.message || ''}</p>
                    </article>
                  );
                })}
              </section>
            </aside>
          </section>
        </>
      )}
    </main>
  );
}

export default PersonalArea;
