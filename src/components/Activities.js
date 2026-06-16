import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { formatActivityDate } from '../utils/activityDateUtils';

function Activities() {
  const { activities, isLoading, error } = useActivities();
  const { currentUser, role: authRole } = useAuth() || {};
  const role = (authRole ?? currentUser?.role ?? '').toLowerCase();
  const canCreateActivity = Boolean(currentUser) && (role === 'admin' || role === 'manager');

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

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-lg font-semibold text-red-700">
          {error}
        </div>
      )}

      {isLoading && <p className="rounded-lg bg-white p-6 text-xl font-semibold text-slate-700 shadow-sm">טוען פעילויות...</p>}

      {!isLoading && !error && activities.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-2xl font-black text-slate-900">אין פעילויות להצגה.</p>
          <p className="mt-3 text-lg text-slate-600">צרו פעילות חדשה כדי להתחיל לנהל את לוח הפעילויות.</p>
        </div>
      )}

      {!isLoading && activities.length > 0 && (
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
                {canCreateActivity && (
                  <Link className="rounded-lg bg-sky-100 px-5 py-3 text-lg font-bold text-sky-800 hover:bg-sky-200" to={`/activities/${activity.id}/edit`}>
                    עריכה
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
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
