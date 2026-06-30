import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      setRegistrationError('׳׳™׳ ׳׳ ׳”׳¨׳©׳׳” ׳׳”׳¡׳™׳¨ ׳ ׳¨׳©׳׳™׳ ׳׳₪׳¢׳™׳׳•׳×.');
      return;
    }

    const confirmed = window.confirm('׳”׳׳ ׳׳”׳¡׳™׳¨ ׳׳× ׳”׳׳©׳×׳׳© ׳׳”׳¨׳™׳©׳•׳ ׳׳₪׳¢׳™׳׳•׳×?');
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
      setRegistrationMessage('׳”׳ ׳¨׳©׳ ׳”׳•׳¡׳¨ ׳׳”׳₪׳¢׳™׳׳•׳× ׳‘׳”׳¦׳׳—׳”.');
    } catch (err) {
      console.error('Failed to remove activity registration', err);
      setRegistrationError('׳׳ ׳ ׳™׳×׳ ׳׳”׳¡׳™׳¨ ׳׳× ׳”׳ ׳¨׳©׳ ׳›׳¨׳’׳¢. ׳ ׳¡׳• ׳©׳•׳‘ ׳׳׳•׳—׳¨ ׳™׳•׳×׳¨.');
    } finally {
      setRemovingRegistrationId('');
    }
  };

  return (
    <main className="activities-catalog" dir="rtl">
      <style>{`
        .activities-catalog {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 36px 20px 64px;
        }

        .activities-catalog__filters {
          display: grid;
          grid-template-columns: minmax(220px, 1.5fr) repeat(4, minmax(160px, 1fr));
          gap: 14px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 4px 18px rgba(15, 34, 64, 0.07);
        }

        .activities-catalog__field {
          display: grid;
          gap: 7px;
          min-width: 0;
        }

        .activities-catalog__field label {
          color: #475569;
          font-size: 13px;
          font-weight: 600;
        }

        .activities-catalog__field input,
        .activities-catalog__field select {
          width: 100%;
          min-height: 46px;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 11px;
          background: #fff;
          color: #0f2240;
          font: inherit;
        }

        .activities-catalog__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 22px;
        }

        .activities-catalog__schedule {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
        }

        .activities-catalog__card {
          display: flex;
          min-width: 0;
          min-height: 100%;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 4px 18px rgba(15, 34, 64, 0.07);
        }

        .activities-catalog__card-body {
          display: flex;
          flex: 1;
          flex-direction: column;
          padding: 22px;
        }

        .activities-catalog__card-title {
          overflow: hidden;
          color: #0f2240;
          font-size: 23px;
          font-weight: 600;
          line-height: 1.3;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 1050px) {
          .activities-catalog__filters {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .activities-catalog {
            padding: 26px 14px 48px;
          }

          .activities-catalog__filters {
            grid-template-columns: 1fr;
          }

          .activities-catalog__grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '18px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: '#0f2240', fontSize: '38px', fontWeight: 950 }}>
            פעילויות
          </h1>
          <p style={{ margin: '9px 0 0', color: '#64748b', fontSize: '17px' }}>
            צפייה והרשמה לפעילויות וחוגים
          </p>
        </div>
        {canCreateActivity && (
          <Link
            to="/activities/new"
            style={{
              padding: '13px 20px',
              borderRadius: '12px',
              backgroundColor: '#0f2240',
              color: '#fff',
              fontWeight: 900,
            }}
          >
            פעילות חדשה
          </Link>
        )}
      </header>

      <section className="activities-catalog__filters" aria-label="סינון פעילויות">
        <div className="activities-catalog__field">
          <label htmlFor="activity-search">חיפוש חופשי</label>
          <input
            id="activity-search"
            type="search"
            value={filters.search}
            placeholder="שם, תיאור או מיקום"
            onChange={(event) => updateFilter('search', event.target.value)}
          />
        </div>

        <div className="activities-catalog__field">
          <label htmlFor="activity-type">סוג פעילות</label>
          <select
            id="activity-type"
            value={filters.activityType}
            onChange={(event) => updateFilter('activityType', event.target.value)}
          >
            <option value="all">כל הסוגים</option>
            {availableActivityTypes.map((activityType) => (
              <option key={activityType} value={activityType}>{activityType}</option>
            ))}
          </select>
        </div>

        <div className="activities-catalog__field">
          <label htmlFor="activity-date">תאריך</label>
          <select
            id="activity-date"
            value={filters.dateRange}
            onChange={(event) => updateFilter('dateRange', event.target.value)}
          >
            <option value="all">כל התאריכים</option>
            <option value="week">השבוע הקרוב</option>
            <option value="month">החודש הקרוב</option>
            <option value="future">תאריכים עתידיים בלבד</option>
          </select>
        </div>

        <div className="activities-catalog__field">
          <label htmlFor="registration-status">סטטוס הרשמה</label>
          <select
            id="registration-status"
            value={filters.registrationStatus}
            onChange={(event) => updateFilter('registrationStatus', event.target.value)}
          >
            <option value="all">כל הפעילויות</option>
            <option value="registered">פעילויות שנרשמתי אליהן</option>
            <option value="not-registered">פעילויות שלא נרשמתי אליהן</option>
          </select>
        </div>

        <div className="activities-catalog__field">
          <label htmlFor="activity-sort">מיון</label>
          <select
            id="activity-sort"
            value={filters.sortBy}
            onChange={(event) => updateFilter('sortBy', event.target.value)}
          >
            <option value="date-asc">תאריך קרוב ביותר</option>
            <option value="date-desc">תאריך רחוק ביותר</option>
            <option value="name-asc">שם א-ת</option>
            <option value="name-desc">שם ת-א</option>
          </select>
        </div>
      </section>

      <div
        role="group"
        aria-label="בחירת תצוגת פעילויות"
        style={{
          display: 'inline-flex',
          gap: '6px',
          marginTop: '18px',
          padding: '5px',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          backgroundColor: '#fff',
        }}
      >
        <button
          type="button"
          onClick={() => setActivitiesView('catalog')}
          style={{
            padding: '10px 16px',
            border: 0,
            borderRadius: '9px',
            backgroundColor: activitiesView === 'catalog' ? '#008080' : 'transparent',
            color: activitiesView === 'catalog' ? '#fff' : '#475569',
            fontWeight: 900,
          }}
        >
          קטלוג פעילויות
        </button>
        {!canCreateActivity && (
          <button
            type="button"
            onClick={() => setActivitiesView('schedule')}
            style={{
              padding: '10px 16px',
              border: 0,
              borderRadius: '9px',
              backgroundColor: activitiesView === 'schedule' ? '#008080' : 'transparent',
              color: activitiesView === 'schedule' ? '#fff' : '#475569',
              fontWeight: 900,
            }}
          >
            מערכת שבועית
          </button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          margin: '22px 0',
        }}
      >
        <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>
          {isLoading ? '' : `${filteredActivities.length} פעילויות נמצאו`}
        </p>
        <button
          type="button"
          onClick={resetFilters}
          style={{
            padding: '9px 14px',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            backgroundColor: '#fff',
            color: '#475569',
            fontWeight: 800,
          }}
        >
          איפוס סינון
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-lg font-semibold text-red-700">
          {error}
        </div>
      )}

      {registrationError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-lg font-semibold text-red-700">
          {registrationError}
        </div>
      )}

      {registrationMessage && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-lg font-semibold text-green-700">
          {registrationMessage}
        </div>
      )}

      {isLoading && <LogoLoader label="טוען פעילויות..." />}

      {!isLoading && !error && filteredActivities.length === 0 && (
        <div
          style={{
            padding: '42px 24px',
            border: '1px solid #e5e7eb',
            borderRadius: '18px',
            backgroundColor: '#fff',
            boxShadow: '0 4px 18px rgba(15, 34, 64, 0.07)',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, color: '#0f2240', fontSize: '21px', fontWeight: 900 }}>
            לא נמצאו פעילויות התואמות לסינון שנבחר
          </p>
          <button
            type="button"
            onClick={resetFilters}
            style={{
              marginTop: '18px',
              padding: '11px 18px',
              border: 0,
              borderRadius: '11px',
              backgroundColor: '#008080',
              color: '#fff',
              fontWeight: 900,
            }}
          >
            איפוס סינון
          </button>
        </div>
      )}

      {!isLoading && activitiesView === 'catalog' && filteredActivities.length > 0 && (
        <div className="activities-catalog__grid">
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
            const activityDate = getActivityDate(activity);
            const registeredCount = getRegisteredCount(activity);
            const availableSpots = getAvailableSpots(activity);
            const isFull = availableSpots <= 0;
            const registrationUnavailable = registrationClosed || isFull;

            return (
              <article key={activity.id} className="activities-catalog__card">
                {activity.imageUrl && (
                  <img
                    alt={activity.title}
                    src={activity.imageUrl}
                    style={{ width: '100%', height: '190px', objectFit: 'cover' }}
                  />
                )}

                <div className="activities-catalog__card-body">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <h2 className="activities-catalog__card-title" title={activity.title}>
                        {activity.title || 'פעילות ללא כותרת'}
                      </h2>
                      <span
                        style={{
                          display: 'inline-flex',
                          marginTop: '9px',
                          padding: '5px 10px',
                          borderRadius: '999px',
                          backgroundColor: '#eef2ff',
                          color: '#4338ca',
                          fontSize: '13px',
                          fontWeight: 800,
                        }}
                      >
                        {isOneTimeActivity(activity) ? 'פעילות חד פעמית' : 'פעילות קבועה'}
                      </span>
                    </div>
                    {canRegister && (
                      <span
                        style={{
                          flexShrink: 0,
                          padding: '5px 10px',
                          borderRadius: '999px',
                          backgroundColor: registrationClosed
                            ? '#fee2e2'
                            : isUpcoming
                              ? '#e0f2fe'
                            : registrationPresentation.backgroundColor,
                          color: registrationClosed
                            ? '#991b1b'
                            : isUpcoming
                              ? '#075985'
                            : registrationPresentation.color,
                          fontSize: '12px',
                          fontWeight: 900,
                        }}
                      >
                        {isExpired
                          ? 'התאריך עבר'
                          : isEnded
                            ? 'הפעילות הסתיימה'
                            : isUpcoming
                              ? 'טרם התחילה'
                              : registrationPresentation.badgeLabel}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: '10px',
                      marginTop: '18px',
                    }}
                  >
                    <Info label="קטגוריה" value={getActivityCategoryLabel(activity) || '-'} />
                    <Info label="מיקום" value={activity.location || '-'} />
                    {isOneTimeActivity(activity) ? (
                      <>
                        <Info label="תאריך" value={activityDate ? formatActivityDate(activityDate) : '-'} />
                        <Info label="שעה" value={activity.time || '-'} />
                      </>
                    ) : (
                      <>
                        <Info label="מתאריך" value={getRecurringStartDate(activity) ? formatActivityDate(getRecurringStartDate(activity)) : '-'} />
                        <Info label="עד תאריך" value={getRecurringEndDate(activity) ? formatActivityDate(getRecurringEndDate(activity)) : '-'} />
                        <Info label="ימים" value={getRecurringDays(activity).join(', ') || noDayLabel} />
                        <Info label="שעה" value={activity.time || '-'} />
                      </>
                    )}
                    <Info label="מחיר" value={formatPrice(activity)} />
                    <Info label="משתתפים רשומים" value={registeredCount} />
                    <Info label="מקומות פנויים" value={availableSpots} />
                  </div>

                  <p
                    style={{
                      display: '-webkit-box',
                      minHeight: '76px',
                      margin: '18px 0 0',
                      overflow: 'hidden',
                      color: '#475569',
                      fontSize: '15px',
                      lineHeight: 1.7,
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3,
                    }}
                  >
                    {activity.description || 'אין תיאור לפעילות זו.'}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexWrap: 'wrap',
                      marginTop: 'auto',
                      paddingTop: '20px',
                    }}
                  >
                    <Link
                      to={`/activities/${activity.id}`}
                      style={{
                        padding: '10px 15px',
                        borderRadius: '10px',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        fontWeight: 800,
                      }}
                    >
                      פרטים
                    </Link>

                    {canRegister && (
                      <button
                        type="button"
                        disabled={
                          registrationUnavailable ||
                          Boolean(registration) ||
                          registeringActivityId === activity.id
                        }
                        onClick={() => handleRegister(activity)}
                        style={{
                          padding: '10px 16px',
                          border: 0,
                          borderRadius: '10px',
                          backgroundColor: registrationClosed
                            ? '#e5e7eb'
                            : isFull
                              ? '#e5e7eb'
                            : registration
                              ? registrationPresentation.backgroundColor
                              : '#008080',
                          color: registrationClosed
                            ? '#6b7280'
                            : isFull
                              ? '#6b7280'
                            : registration
                              ? registrationPresentation.color
                              : '#fff',
                          cursor: registrationUnavailable || registration ? 'not-allowed' : 'pointer',
                          fontWeight: 900,
                        }}
                      >
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
                        <Link
                          to={`/activities/${activity.id}/edit`}
                          style={{
                            padding: '10px 15px',
                            borderRadius: '10px',
                            backgroundColor: '#e0f2fe',
                            color: '#075985',
                            fontWeight: 800,
                          }}
                        >
                          עריכה
                        </Link>
                        <button
                          type="button"
                          disabled={loadingRegistrationActivityId === activity.id}
                          onClick={() => handleViewRegistrations(activity.id)}
                          style={{
                            padding: '10px 15px',
                            border: 0,
                            borderRadius: '10px',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            fontWeight: 800,
                          }}
                        >
                          צפייה בנרשמים
                        </button>
                      </>
                    )}
                  </div>

                  {canCreateActivity && expandedRegistrationActivityId === activity.id && (
                    <div
                      style={{
                        marginTop: '18px',
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: '#f8fafc',
                      }}
                    >
                      <h3 style={{ margin: 0, color: '#0f2240', fontSize: '18px' }}>
                        נרשמים לפעילות
                        {adminRegistrationsByActivity[activity.id]
                          ? ` (${adminRegistrationsByActivity[activity.id].length})`
                          : ''}
                      </h3>
                      {loadingRegistrationActivityId === activity.id && <LogoLoader label="טוען נרשמים..." />}
                      {loadingRegistrationActivityId !== activity.id &&
                        (adminRegistrationsByActivity[activity.id]?.length || 0) === 0 && (
                          <p style={{ color: '#475569' }}>אין עדיין נרשמים לפעילות זו</p>
                        )}
                      {loadingRegistrationActivityId !== activity.id &&
                        (adminRegistrationsByActivity[activity.id]?.length || 0) > 0 && (
                          <div style={{ marginTop: '12px', overflowX: 'auto' }}>
                            <table className="min-w-full border-collapse text-right">
                              <thead>
                                <tr className="border-b border-slate-200 text-sm text-slate-500">
                                  <th className="px-3 py-2 font-bold">פעולות</th>
                                  <th className="px-3 py-2 font-bold">שם מלא</th>
                                  <th className="px-3 py-2 font-bold">אימייל</th>
                                  <th className="px-3 py-2 font-bold">תאריך הרשמה</th>
                                  <th className="px-3 py-2 font-bold">סטטוס תשלום</th>
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
                                    <tr key={adminRegistration.id} className="border-b border-slate-200">
                                      <td className="px-3 py-2 text-sm text-slate-700">
                                        <button
                                          className="activities-registration-remove-button"
                                          type="button"
                                          disabled={removingRegistrationId === adminRegistration.id}
                                          onClick={() => handleRemoveRegistration(activity, adminRegistration)}
                                          aria-label={`הסר את ${fullName} מהרישום לפעילות`}
                                        >
                                          {removingRegistrationId === adminRegistration.id ? 'מסיר...' : 'הסר'}
                                        </button>
                                      </td>
                                      <td className="px-3 py-2 text-sm font-semibold text-slate-900">
                                        {fullName}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-slate-700">
                                        {email}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-slate-700">
                                        {formatActivityDate(adminRegistration.registeredAt)}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-slate-700">
                                        {paymentStatus}
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
    </main>
  );
}

function WeeklySchedule({ activitiesByScheduleDay }) {
  const visibleDays = [...dayOptions, noDayLabel].filter(
    (day) => day !== noDayLabel || activitiesByScheduleDay[day].length > 0
  );

  return (
    <div className="activities-catalog__schedule">
      {visibleDays.map((day) => (
        <section
          key={day}
          style={{
            minWidth: 0,
            padding: '18px',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            backgroundColor: '#fff',
            boxShadow: '0 4px 18px rgba(15, 34, 64, 0.07)',
          }}
        >
          <h2
            style={{
              margin: 0,
              paddingBottom: '12px',
              borderBottom: '1px solid #e5e7eb',
              color: '#0f2240',
              fontSize: '23px',
              fontWeight: 900,
            }}
          >
            {day}
          </h2>

          {activitiesByScheduleDay[day].length ? (
            <div style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
              {activitiesByScheduleDay[day].map(({ activity, occurrenceDate }) => (
                <article
                  key={`${day}-${activity.id}-${occurrenceDate?.toISOString() || 'undefined'}`}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      color: '#0f2240',
                      fontSize: '17px',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activity.title || 'פעילות ללא כותרת'}
                  </strong>
                  <p style={{ margin: '7px 0 0', color: '#475569', fontWeight: 800 }}>
                    {activity.time || 'שעה לא הוגדרה'}
                  </p>
                  <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>
                    {occurrenceDate ? formatActivityDate(occurrenceDate) : '-'}
                  </p>
                  {activity.location && (
                    <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>
                      {activity.location}
                    </p>
                  )}
                  <Link
                    to={`/activities/${activity.id}`}
                    style={{
                      display: 'inline-flex',
                      marginTop: '10px',
                      color: '#006b6b',
                      fontWeight: 900,
                    }}
                  >
                    פרטים
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p style={{ margin: '14px 0 0', color: '#94a3b8', fontWeight: 700 }}>
              אין פעילויות ביום זה
            </p>
          )}
        </section>
      ))}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ minWidth: 0, padding: '11px', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
      <dt style={{ color: '#64748b', fontSize: '12px', fontWeight: 800 }}>{label}</dt>
      <dd
        title={String(value)}
        style={{
          margin: '4px 0 0',
          overflow: 'hidden',
          color: '#0f2240',
          fontSize: '14px',
          fontWeight: 900,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value ?? '-'}
      </dd>
    </div>
  );
}

export default Activities;
