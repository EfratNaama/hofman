import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteActivity, getActivityById } from '../services/activitiesService';
import { getActivityRegistrationCount } from '../services/activityRegistrationsService';
import { formatActivityDate } from '../utils/activityDateUtils';

function ActivityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const normalizedRole = (role || '').toLowerCase();
  const canManageActivity = normalizedRole === 'admin' || normalizedRole === 'manager';
  const [activity, setActivity] = useState(null);
  const [registrationsCount, setRegistrationsCount] = useState(null);
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

  const handleDelete = async () => {
    const confirmed = window.confirm('האם למחוק את הפעילות? לא ניתן לבטל פעולה זו.');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await deleteActivity(id);
      window.alert('׳”׳₪׳¢׳™׳׳•׳× ׳•׳”׳”׳¨׳©׳׳•׳× ׳”׳§׳©׳•׳¨׳•׳× ׳ ׳׳—׳§׳• ׳‘׳”׳¦׳׳—׳”');
      navigate('/activities');
    } catch (err) {
      setError('לא ניתן למחוק את הפעילות. נסו שוב.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 text-right" dir="rtl">
        <div className="rounded-lg bg-white p-6 text-xl font-semibold text-slate-700 shadow-sm">טוען פעילות...</div>
      </section>
    );
  }

  if (!activity) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 text-right" dir="rtl">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <p className="text-2xl font-black text-slate-900">הפעילות לא נמצאה.</p>
          <Link className="mt-5 inline-block rounded-lg bg-slate-100 px-6 py-3 text-lg font-bold text-slate-700 hover:bg-slate-200" to="/activities">
            חזרה לפעילויות
          </Link>
        </div>
      </section>
    );
  }

  const paymentRequired = Boolean(activity.paymentRequired ?? activity.requiresPayment);
  const paymentLabel = paymentRequired
    ? `מחיר: ₪${Number(activity.price || 0).toLocaleString('he-IL')}`
    : 'ללא תשלום';
  const categoryLabel = [activity.category, activity.subCategory]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' - ');
  const maxParticipants = Number(activity.maxParticipants || 0);
  const displayedRegisteredCount = registrationsCount ?? Number(activity.currentParticipants || 0);
  const displayedAvailableSpots = Math.max(maxParticipants - displayedRegisteredCount, 0);

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 text-right" dir="rtl">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-slate-500">פרטי פעילות</p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">{activity.title}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-lg bg-slate-100 px-5 py-3 text-lg font-bold text-slate-700 hover:bg-slate-200" to="/activities">
              חזרה
            </Link>
            {canManageActivity && (
              <>
                <Link className="rounded-lg bg-sky-800 px-5 py-3 text-lg font-bold text-white hover:bg-sky-900" to={`/activities/${id}/edit`}>
                  עריכה
                </Link>
                <button
                  className="rounded-lg bg-red-600 px-5 py-3 text-lg font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? 'מוחק...' : 'מחיקה'}
                </button>
              </>
            )}
          </div>
        </div>

        {activity.imageUrl && (
          <img
            alt={activity.title}
            className="mb-6 rounded-lg"
            style={{
              display: 'block',
              width: 'auto',
              maxWidth: '100%',
              height: 'auto',
              maxHeight: '300px',
              marginInline: 'auto',
              objectFit: 'contain',
              objectPosition: 'center',
            }}
            src={activity.imageUrl}
          />
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-lg font-semibold text-red-700">
            {error}
          </div>
        )}

        <p className="mb-6 text-xl leading-9 text-slate-700">{activity.description || 'אין תיאור לפעילות זו.'}</p>

        {activity.whatsappLink && (
          <a
            className="mb-6 inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-lg font-bold text-white shadow-sm hover:bg-green-700"
            href={activity.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden="true">💬</span>
            הצטרפות לקבוצת וואטסאפ
          </a>
        )}

        <dl className="grid gap-4 md:grid-cols-2">
          <DetailItem label="קטגוריה" value={categoryLabel} />
          <DetailItem label="מיקום" value={activity.location} />
          <DetailItem label="יום בשבוע" value={activity.dayOfWeek} />
          <DetailItem label="תאריך" value={formatActivityDate(activity.activityDate)} />
          <DetailItem label="שעה" value={activity.time} />
          <DetailItem label="מכסת משתתפים" value={activity.maxParticipants} />
          <DetailItem label="משתתפים רשומים" value={displayedRegisteredCount} />
          <DetailItem label="מקומות פנויים" value={displayedAvailableSpots} />
          <DetailItem label="סטטוס" value={activity.isActive ? 'פעילה' : 'לא פעילה'} />
          <DetailItem label="תשלום" value={paymentLabel} />
          <DetailItem label="קישור לתשלום" value={activity.paymentLink || '-'} />
        </dl>
      </div>
    </section>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <dt className="text-base font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-xl font-black text-slate-900">{value ?? '-'}</dd>
    </div>
  );
}

export default ActivityDetails;
