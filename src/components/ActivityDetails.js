import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteActivity, getActivityById } from '../services/activitiesService';
import {
  getActivityRegistrationCount,
  getUserActivityRegistrations,
  registerForActivity,
} from '../services/activityRegistrationsService';
import { formatActivityDate } from '../utils/activityDateUtils';
import {
  getRecurringEndDate,
  getRecurringStartDate,
  getRegistrationPresentation,
  isActivityRegistrationClosed,
  isOneTimeActivity,
} from '../utils/activityRegistrationUtils';
import './ActivityDetails.css';

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
      window.alert('׳”׳₪׳¢׳™׳׳•׳× ׳•׳”׳”׳¨׳©׳׳•׳× ׳”׳§׳©׳•׳¨׳•׳× ׳ ׳׳—׳§׳• ׳‘׳”׳¦׳׳—׳”');
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
  const displayedRegisteredCount = registrationsCount ?? Number(activity.currentParticipants || 0);
  const displayedAvailableSpots = getAvailableSpots(activity);
  const lecturer = activity.lecturer || {};
  const lecturerName = lecturer.name?.trim() || '';
  const lecturerDescription = lecturer.description?.trim() || '';
  const lecturerImage = lecturer.imageBase64?.trim() || '';
  const hasLecturerDetails = Boolean(lecturerName || lecturerDescription || lecturerImage);
  const registrationClosed = isActivityRegistrationClosed(activity);
  const isFull = displayedAvailableSpots <= 0;
  const registrationUnavailable = registrationClosed || isFull;
  const registrationPresentation = getRegistrationPresentation(userRegistration, wasJustRegistered);
  const isOneTime = isOneTimeActivity(activity);
  const recurringStartDate = getRecurringStartDate(activity);
  const recurringEndDate = getRecurringEndDate(activity);
  const activityDateValue = isOneTime ? activity.date || activity.activityDate : recurringStartDate;
  const formattedActivityDateValue = formatActivityDate(activityDateValue);
  const shouldShowDateItem = formattedActivityDateValue !== '-';
  const shouldShowCategoryItem = Boolean(categoryLabel);

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

        {hasLecturerDetails && (
          <section className="activity-lecturer-card" aria-labelledby="activity-lecturer-title">
            {lecturerImage && (
              <img
                className="activity-lecturer-card__image"
                src={lecturerImage}
                alt={lecturerName || 'תמונת המרצה'}
              />
            )}
            <div className="activity-lecturer-card__content">
              <p className="activity-lecturer-card__eyebrow">פרטים על המרצה</p>
              <h2 id="activity-lecturer-title">{lecturerName || 'מרצה הפעילות'}</h2>
              {lecturerDescription && (
                <p className="activity-lecturer-card__description">{lecturerDescription}</p>
              )}
            </div>
          </section>
        )}

        <dl className="activity-details-grid grid gap-4 md:grid-cols-2">
          <DetailItem
            className="activity-details-grid__item--type"
            label="סוג פעילות"
            value={isOneTime ? 'פעילות חד פעמית' : 'פעילות קבועה'}
          />
          {shouldShowCategoryItem && (
            <DetailItem
              className="activity-details-grid__item--category"
              label="קטגוריה"
              value={categoryLabel}
            />
          )}
          {shouldShowDateItem && (
            <DetailItem
              className="activity-details-grid__item--date"
              label={isOneTime ? 'תאריך' : 'מתאריך'}
              value={formatActivityDate(activityDateValue)}
            />
          )}
          {!isOneTime && recurringEndDate && (
            <DetailItem
              className="activity-details-grid__item--end-date"
              label="עד תאריך"
              value={formatActivityDate(recurringEndDate)}
            />
          )}
          <DetailItem label="מיקום" value={activity.location} />
          <DetailItem label="יום בשבוע" value={activity.dayOfWeek} />
          <DetailItem label="שעה" value={activity.time} />
          <DetailItem label="מכסת משתתפים" value={activity.maxParticipants} />
          <DetailItem label="משתתפים רשומים" value={displayedRegisteredCount} />
          <DetailItem label="מקומות פנויים" value={displayedAvailableSpots} />
          <DetailItem label="סטטוס" value={activity.isActive ? 'פעילה' : 'לא פעילה'} />
          <DetailItem label="תשלום" value={paymentLabel} />
          <DetailItem label="קישור לתשלום" value={activity.paymentLink || '-'} />
        </dl>

        {canRegister && (
          <section className="activity-details-registration" aria-label="הרשמה לפעילות">
            {registrationError && (
              <div className="activity-details-registration__alert activity-details-registration__alert--error" role="alert">
                {registrationError}
              </div>
            )}
            {registrationMessage && (
              <div className="activity-details-registration__alert activity-details-registration__alert--success" role="status">
                {registrationMessage}
              </div>
            )}
            <button
              className="activity-details-registration__button"
              type="button"
              disabled={
                registrationUnavailable ||
                Boolean(userRegistration) ||
                registeringActivityId === activity.id
              }
              data-state={
                registrationClosed
                  ? 'closed'
                  : isFull
                    ? 'full'
                    : userRegistration
                      ? 'registered'
                      : 'available'
              }
              onClick={handleRegister}
            >
              {registrationClosed
                ? 'ההרשמה נסגרה'
                : isFull
                  ? 'הפעילות מלאה'
                  : registeringActivityId === activity.id
                    ? 'נרשם...'
                    : registrationPresentation.label}
            </button>
          </section>
        )}
      </div>
    </section>
  );
}

function DetailItem({ label, value, className = '' }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-5 ${className}`}>
      <dt className="text-base font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-xl font-black text-slate-900">{value ?? '-'}</dd>
    </div>
  );
}

export default ActivityDetails;
