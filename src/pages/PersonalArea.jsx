import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PersonalCalendar from '../components/PersonalCalendar';
import { getUserAllRegistrations } from '../services/activityRegistrationsService';
import {
  generateActivityOccurrences,
  getActivityType,
  toDate,
} from '../utils/activityDateUtils';

const cardStyle = {
  padding: '20px',
  borderRadius: '12px',
  backgroundColor: '#fff',
  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
};

const sectionStyle = {
  marginBottom: '40px',
};

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

const formatPrice = (value) =>
  new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function PersonalArea() {
  const { currentUser } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadPersonalArea() {
      if (!currentUser) return;

      setLoading(true);
      setError('');

      try {
        const registrationData = await getUserAllRegistrations(currentUser.uid);
        if (isMounted) {
          setRegistrations(registrationData);
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
  }, [currentUser]);

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
            start,
            end: getActivityEnd(activity, start),
            type: 'activity',
            activityType: getActivityType(sourceActivity),
            allDay: false,
          };
        });
      })
  ), [registrations]);

  const nextActivity = useMemo(() => {
    const now = new Date();
    return [...activityEvents]
      .filter((event) => event.start >= now)
      .sort((first, second) => first.start - second.start)[0] || null;
  }, [activityEvents]);

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

  return (
    <main className="personal-area" dir="rtl">
      <style>{`
        .personal-area {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px;
        }

        .personal-area__payment-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        @media (max-width: 768px) {
          .personal-area {
            padding: 24px 16px;
          }

          .personal-area__payment-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header style={{ ...sectionStyle, borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#1a1a2e', fontSize: '32px', fontWeight: 900 }}>
          אזור אישי
        </h1>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            ...cardStyle,
            marginBottom: '24px',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            fontWeight: 800,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ ...cardStyle, color: '#475569', fontWeight: 800 }}>
          טוען את האזור האישי...
        </div>
      ) : (
        <>
          <section style={sectionStyle}>
            <h2 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '24px' }}>
              הלוח האישי שלי
            </h2>

            <div style={{ ...cardStyle, marginBottom: '20px', borderInlineStart: '4px solid #008080' }}>
              <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>הפעילות הקרובה</p>
              {nextActivity ? (
                <>
                  <h3 style={{ margin: '8px 0 0', color: '#1a1a2e', fontSize: '22px' }}>
                    {nextActivity.title}
                  </h3>
                  <p style={{ margin: '7px 0 0', color: '#475569' }}>
                    {formatDate(nextActivity.start)}
                  </p>
                </>
              ) : (
                <p style={{ margin: '8px 0 0', color: '#64748b' }}>
                  אין פעילויות רשומות
                </p>
              )}
            </div>

            {!activityEvents.length && (
              <div style={{ ...cardStyle, color: '#64748b', textAlign: 'center', fontWeight: 800 }}>
                אין פעילויות רשומות
              </div>
            )}
            <div style={{ marginTop: activityEvents.length ? 0 : '20px' }}>
              <PersonalCalendar activityEvents={activityEvents} />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '24px' }}>
              סיכום תשלומים חודשי
            </h2>

            {currentMonthPaidActivities.length ? (
              <div className="personal-area__payment-grid">
                <div style={{ ...cardStyle, borderInlineStart: '4px solid #008080' }}>
                  <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>
                    סה״כ לתשלום החודש
                  </p>
                  <p style={{ margin: '8px 0 0', color: '#008080', fontSize: '32px', fontWeight: 900 }}>
                    {formatPrice(monthlyTotal)}
                  </p>
                </div>

                <div style={{ ...cardStyle, borderInlineStart: '4px solid #5B6FE6' }}>
                  <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>
                    מספר פעילויות בתשלום
                  </p>
                  <p style={{ margin: '8px 0 0', color: '#5B6FE6', fontSize: '32px', fontWeight: 900 }}>
                    {currentMonthPaidActivities.length}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ ...cardStyle, color: '#64748b', textAlign: 'center', fontWeight: 800 }}>
                לא נמצאו תשלומים לחודש הנוכחי
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default PersonalArea;
