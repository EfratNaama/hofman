import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserActivityRegistrations } from '../services/activityRegistrationsService';
import { formatActivityDate } from '../utils/activityDateUtils';

function MyActivities() {
  const { currentUser } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadMyActivities() {
      if (!currentUser) {
        setRegistrations([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const registrationsData = await getUserActivityRegistrations(currentUser.uid);
        if (isMounted) {
          setRegistrations(registrationsData);
        }
      } catch (err) {
        console.error('Failed to load registered activities', err);
        if (isMounted) {
          setError('לא ניתן לטעון את הפעילויות שלך כרגע. נסו שוב מאוחר יותר.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMyActivities();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 text-right" dir="rtl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-slate-500">האזור האישי</p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">הפעילויות שלי</h1>
        </div>
        <Link className="rounded-lg bg-slate-100 px-6 py-3 text-lg font-bold text-slate-700 hover:bg-slate-200" to="/activities">
          לכל הפעילויות
        </Link>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-lg font-semibold text-red-700">
          {error}
        </div>
      )}

      {isLoading && (
        <p className="rounded-lg bg-white p-6 text-xl font-semibold text-slate-700 shadow-sm">
          טוען פעילויות...
        </p>
      )}

      {!isLoading && !error && registrations.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-2xl font-black text-slate-900">עדיין לא נרשמת לפעילויות.</p>
          <p className="mt-3 text-lg text-slate-600">אפשר לבחור פעילות מהרשימה ולהירשם בלחיצה אחת.</p>
          <Link className="mt-5 inline-block rounded-lg bg-[#d4a373] px-6 py-3 text-lg font-bold text-[#0f2240] hover:bg-[#c38a5a]" to="/activities">
            מצאו פעילות
          </Link>
        </div>
      )}

      {!isLoading && registrations.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {registrations.map((registration) => (
            <article key={registration.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900">{registration.activityTitle}</h2>
              <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                <Info label="תאריך" value={formatActivityDate(registration.activityDate || registration.date)} />
                <Info label="שעה" value={registration.time} />
                <Info label="מיקום" value={registration.location} />
              </dl>
              {registration.description && (
                <p className="mt-5 text-lg leading-8 text-slate-700">{registration.description}</p>
              )}
              <Link className="mt-6 inline-block rounded-lg bg-slate-100 px-5 py-3 text-lg font-bold text-slate-800 hover:bg-slate-200" to={`/activities/${registration.activityId}`}>
                פרטי הפעילות
              </Link>
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
      <dd className="mt-1 text-xl font-black text-slate-900">{value || '-'}</dd>
    </div>
  );
}

export default MyActivities;
