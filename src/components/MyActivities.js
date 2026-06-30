import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cancelActivityRegistration, getUserAllRegistrations } from '../services/activityRegistrationsService';
import { formatActivityDate } from '../utils/activityDateUtils';
import LogoLoader from './LogoLoader';

function MyActivities() {
  const { currentUser } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cancelingActivityId, setCancelingActivityId] = useState('');

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
      setSuccessMessage('');

      try {
        const registrationsData = await getUserAllRegistrations(currentUser.uid);
        if (isMounted) {
          setRegistrations(
            registrationsData.map(({ registration, activity }) => ({
              ...registration,
              activityTitle: activity.title || registration.activityTitle,
              activityDate: activity.activityDate || registration.activityDate,
              date: activity.date || registration.date,
              time: activity.time || registration.time,
              location: activity.location || registration.location,
              description: activity.description || registration.description,
            }))
          );
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

  const handleCancelRegistration = async (registration) => {
    const confirmed = window.confirm('האם את/ה בטוח/ה שברצונך לבטל את ההרשמה לפעילות?');

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccessMessage('');
    setCancelingActivityId(registration.activityId);

    try {
      await cancelActivityRegistration(registration.activityId, currentUser.uid);
      setRegistrations((currentRegistrations) => (
        currentRegistrations.filter((currentRegistration) => currentRegistration.id !== registration.id)
      ));
      setSuccessMessage('ההרשמה בוטלה בהצלחה');
    } catch (err) {
      console.error('Failed to cancel activity registration', err);
      setError('לא ניתן לבטל את ההרשמה כרגע. נסו שוב מאוחר יותר.');
    } finally {
      setCancelingActivityId('');
    }
  };

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

      {successMessage && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-lg font-semibold text-green-700">
          {successMessage}
        </div>
      )}

      {isLoading && <LogoLoader label="טוען פעילויות..." />}

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
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="inline-block rounded-lg bg-slate-100 px-5 py-3 text-lg font-bold text-slate-800 hover:bg-slate-200" to={`/activities/${registration.activityId}`}>
                  פרטי הפעילות
                </Link>
                <button
                  className="rounded-lg bg-red-50 px-5 py-3 text-lg font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  type="button"
                  disabled={cancelingActivityId === registration.activityId}
                  onClick={() => handleCancelRegistration(registration)}
                >
                  {cancelingActivityId === registration.activityId ? 'מבטל...' : 'ביטול הרשמה'}
                </button>
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
      <dd className="mt-1 text-xl font-black text-slate-900">{value || '-'}</dd>
    </div>
  );
}

export default MyActivities;
