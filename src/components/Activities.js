import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { getActivityRegistrations, getUserActivityRegistrations, registerForActivity } from '../services/activityRegistrationsService';
import { formatActivityDate, toDate } from '../utils/activityDateUtils';

const getActivityType = (activity) => activity.type || 'קבוע';
const getActivityTypeBadge = (activity) => (
  getActivityType(activity) === 'חד פעמי' ? 'אירוע חד פעמי' : 'פעילות קבועה'
);
const scheduleDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const noDayLabel = 'ללא יום מוגדר';
const dateDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const normalizeDayName = (value) => {
  if (!value) return '';
  const dayName = String(value).trim();
  return scheduleDays.find((day) => dayName.includes(day)) || '';
};

const getScheduleDay = (activity) => {
  const explicitDay = normalizeDayName(activity.dayOfWeek);
  if (explicitDay) return explicitDay;

  const activityDate = toDate(activity.activityDate || activity.date);
  if (!activityDate) return noDayLabel;

  const dateDayName = dateDayNames[activityDate.getDay()];
  return scheduleDays.includes(dateDayName) ? dateDayName : noDayLabel;
};

function Activities() {
  const navigate = useNavigate();
  const { activities, isLoading, error } = useActivities();
  const { currentUser, role: authRole } = useAuth();
  const role = (authRole ?? currentUser?.role ?? '').toLowerCase();
  const canCreateActivity = Boolean(currentUser) && (role === 'admin' || role === 'manager');
  const canRegister = Boolean(currentUser) && !canCreateActivity;
  const [registeredActivityIds, setRegisteredActivityIds] = useState([]);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [registeringActivityId, setRegisteringActivityId] = useState('');
  const [adminRegistrationsByActivity, setAdminRegistrationsByActivity] = useState({});
  const [expandedRegistrationActivityId, setExpandedRegistrationActivityId] = useState('');
  const [loadingRegistrationActivityId, setLoadingRegistrationActivityId] = useState('');
  const [activitiesView, setActivitiesView] = useState('cards');

  const registeredActivityIdSet = useMemo(
    () => new Set(registeredActivityIds),
    [registeredActivityIds]
  );
  const activitiesByScheduleDay = useMemo(() => (
    activities.reduce((groupedActivities, activity) => {
      const day = getScheduleDay(activity);
      return {
        ...groupedActivities,
        [day]: [...(groupedActivities[day] || []), activity],
      };
    }, {})
  ), [activities]);

  useEffect(() => {
    let isMounted = true;

    async function loadRegistrations() {
      if (!currentUser) {
        setRegisteredActivityIds([]);
        return;
      }

      try {
        const registrations = await getUserActivityRegistrations(currentUser.uid);
        if (isMounted) {
          setRegisteredActivityIds(registrations.map((registration) => registration.activityId));
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

    setRegisteringActivityId(activity.id);

    try {
      const result = await registerForActivity(activity, currentUser);
      setRegisteredActivityIds((currentIds) => (
        currentIds.includes(activity.id) ? currentIds : [...currentIds, activity.id]
      ));
      setRegistrationMessage(result.alreadyRegistered ? 'כבר נרשמת לפעילות זו.' : 'נרשמת לפעילות בהצלחה.');
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

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 text-right" dir="rtl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-slate-500">ניהול פעילויות</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">פעילויות בית הופמן</h1>
        </div>
        {canCreateActivity && (
          <Link className="rounded-lg bg-sky-800 px-7 py-4 text-lg font-bold text-white shadow-sm hover:bg-sky-900" to="/activities/new">
            פעילות חדשה
          </Link>
        )}
      </div>

      <div className="mb-6 inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="תצוגת פעילויות">
        <button
          className={activitiesView === 'cards' ? 'rounded-md bg-sky-800 px-6 py-3 text-lg font-bold text-white' : 'rounded-md px-6 py-3 text-lg font-bold text-slate-700 hover:bg-slate-100'}
          type="button"
          onClick={() => setActivitiesView('cards')}
        >
          פעילויות
        </button>
        <button
          className={activitiesView === 'schedule' ? 'rounded-md bg-sky-800 px-6 py-3 text-lg font-bold text-white' : 'rounded-md px-6 py-3 text-lg font-bold text-slate-700 hover:bg-slate-100'}
          type="button"
          onClick={() => setActivitiesView('schedule')}
        >
          מערכת שבועית
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

      {isLoading && <p className="rounded-lg bg-white p-6 text-xl font-semibold text-slate-700 shadow-sm">טוען פעילויות...</p>}

      {!isLoading && !error && activities.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-2xl font-black text-slate-900">אין פעילויות להצגה.</p>
          <p className="mt-3 text-lg text-slate-600">צרו פעילות חדשה כדי להתחיל לנהל את לוח הפעילויות.</p>
        </div>
      )}

      {!isLoading && activitiesView === 'cards' && activities.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {activities.map((activity) => (
            <article key={activity.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              {activity.imageUrl && (
                <img
                  alt={activity.title}
                  className="mb-5 h-56 w-full rounded-lg object-cover"
                  src={activity.imageUrl}
                />
              )}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{activity.title}</h2>
                  <p className="mt-2 text-lg font-semibold text-slate-600">
                    {activity.dayOfWeek} · {formatActivityDate(activity.activityDate)} · {activity.time}
                  </p>
                </div>
                <span className={activity.isActive ? 'rounded-full bg-green-100 px-4 py-2 text-base font-bold text-green-700' : 'rounded-full bg-slate-100 px-4 py-2 text-base font-bold text-slate-600'}>
                  {activity.isActive ? 'פעילה' : 'לא פעילה'}
                </span>
              </div>

              <p className="mt-4 line-clamp-3 text-lg leading-8 text-slate-700">{activity.description || 'אין תיאור לפעילות זו.'}</p>

              <span className="mt-4 inline-flex rounded-full bg-amber-100 px-4 py-2 text-base font-bold text-amber-800">
                {getActivityTypeBadge(activity)}
              </span>

              <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                <Info label="קטגוריה" value={activity.category} />
                <Info label="מיקום" value={activity.location} />
                <Info label="מכסה" value={activity.maxParticipants} />
                <Info label="פנויים" value={activity.availableSpots} />
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="rounded-lg bg-slate-100 px-5 py-3 text-lg font-bold text-slate-800 hover:bg-slate-200" to={`/activities/${activity.id}`}>
                  צפייה
                </Link>
                {canRegister && (
                  <button
                    className="rounded-lg bg-[#d4a373] px-5 py-3 text-lg font-bold text-[#0f2240] hover:bg-[#c38a5a] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    type="button"
                    disabled={registeredActivityIdSet.has(activity.id) || registeringActivityId === activity.id}
                    onClick={() => handleRegister(activity)}
                  >
                    {registeredActivityIdSet.has(activity.id)
                      ? 'נרשמת'
                      : registeringActivityId === activity.id
                        ? 'נרשם...'
                        : 'הרשמה לפעילות'}
                  </button>
                )}
                {canCreateActivity && (
                  <>
                    <Link className="rounded-lg bg-sky-100 px-5 py-3 text-lg font-bold text-sky-800 hover:bg-sky-200" to={`/activities/${activity.id}/edit`}>
                      עריכה
                    </Link>
                    <button
                      className="rounded-lg bg-slate-100 px-5 py-3 text-lg font-bold text-slate-800 hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      type="button"
                      disabled={loadingRegistrationActivityId === activity.id}
                      onClick={() => handleViewRegistrations(activity.id)}
                    >
                      {loadingRegistrationActivityId === activity.id ? 'טוען נרשמים...' : 'צפייה בנרשמים'}
                    </button>
                  </>
                )}
              </div>

              {canCreateActivity && expandedRegistrationActivityId === activity.id && (
                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-xl font-black text-slate-900">נרשמים לפעילות</h3>
                  {loadingRegistrationActivityId === activity.id && (
                    <p className="mt-3 text-lg font-semibold text-slate-700">טוען נרשמים...</p>
                  )}
                  {loadingRegistrationActivityId !== activity.id && (adminRegistrationsByActivity[activity.id]?.length || 0) === 0 && (
                    <p className="mt-3 text-lg font-semibold text-slate-700">אין עדיין נרשמים לפעילות זו</p>
                  )}
                  {loadingRegistrationActivityId !== activity.id && (adminRegistrationsByActivity[activity.id]?.length || 0) > 0 && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full border-collapse text-right">
                        <thead>
                          <tr className="border-b border-slate-200 text-base text-slate-500">
                            <th className="px-4 py-3 font-bold">אימייל</th>
                            <th className="px-4 py-3 font-bold">מזהה משתמש</th>
                            <th className="px-4 py-3 font-bold">תאריך הרשמה</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminRegistrationsByActivity[activity.id].map((registration) => (
                            <tr key={registration.id} className="border-b border-slate-200">
                              <td className="px-4 py-3 text-base font-semibold text-slate-900">{registration.userEmail || '-'}</td>
                              <td className="px-4 py-3 text-base text-slate-700">{registration.userId || '-'}</td>
                              <td className="px-4 py-3 text-base text-slate-700">{formatActivityDate(registration.registeredAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {!isLoading && activitiesView === 'schedule' && activities.length > 0 && (
        <WeeklySchedule activitiesByScheduleDay={activitiesByScheduleDay} />
      )}
    </section>
  );
}

function WeeklySchedule({ activitiesByScheduleDay }) {
  const visibleDays = [...scheduleDays, noDayLabel].filter((day) => (
    day !== noDayLabel || (activitiesByScheduleDay[day]?.length || 0) > 0
  ));

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {visibleDays.map((day) => {
        const dayActivities = activitiesByScheduleDay[day] || [];

        return (
          <section key={day} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="border-b border-slate-100 pb-3 text-2xl font-black text-slate-900">{day}</h2>

            {dayActivities.length === 0 && (
              <p className="mt-4 rounded-lg bg-slate-50 p-4 text-lg font-semibold text-slate-500">
                אין פעילויות ליום זה
              </p>
            )}

            <div className="mt-4 space-y-3">
              {dayActivities.map((activity) => (
                <article key={activity.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xl font-black text-slate-900">{activity.title}</p>
                  <p className="mt-2 text-lg font-bold text-slate-700">{activity.time || '-'}</p>
                  {activity.activityDate || activity.date ? (
                    <p className="mt-1 text-base font-semibold text-slate-500">
                      {formatActivityDate(activity.activityDate || activity.date)}
                    </p>
                  ) : null}
                  {activity.location && (
                    <p className="mt-3 text-base font-semibold text-slate-600">{activity.location}</p>
                  )}
                  <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                    {getActivityTypeBadge(activity)}
                  </span>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <dt className="text-base font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 text-xl font-black text-slate-900">{value ?? '-'}</dd>
    </div>
  );
}

export default Activities;
