import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserPaidRegistrations } from '../services/activityRegistrationsService';
import { toDate } from '../utils/activityDateUtils';

const cardStyle = {
  padding: '20px',
  borderRadius: '12px',
  backgroundColor: '#fff',
  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
};

const sectionStyle = {
  marginBottom: '40px',
};

const getActivityDate = (activity, registration) =>
  toDate(activity?.activityDate || activity?.date || registration?.activityDate || registration?.date);

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

const getStartOfWeek = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const getCalendarDays = (view) => {
  const today = new Date();

  if (view === 'week') {
    const weekStart = getStartOfWeek(today);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    });
  }

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const gridStart = getStartOfWeek(monthStart);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
};

function PersonalCalendar({ events, view, onViewChange }) {
  const days = useMemo(() => getCalendarDays(view), [view]);
  const currentMonth = new Date().getMonth();
  const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '18px',
        }}
      >
        <h3 style={{ margin: 0, color: '#1a1a2e', fontSize: '20px' }}>
          {new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { value: 'month', label: 'חודשי' },
            { value: 'week', label: 'שבועי' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onViewChange(option.value)}
              style={{
                padding: '9px 15px',
                border: 0,
                borderRadius: '9px',
                backgroundColor: view === option.value ? '#008080' : '#eef2f3',
                color: view === option.value ? '#fff' : '#334155',
                fontWeight: 800,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="personal-area__calendar">
        {dayNames.map((day) => (
          <div key={day} className="personal-area__day-name">{day}</div>
        ))}
        {days.map((day) => {
          const dayEvents = events.filter((event) => (
            event.start.toDateString() === day.toDateString()
          ));
          const outsideMonth = view === 'month' && day.getMonth() !== currentMonth;

          return (
            <div
              key={day.toISOString()}
              className="personal-area__calendar-day"
              style={{ opacity: outsideMonth ? 0.45 : 1 }}
            >
              <strong style={{ color: '#475569', fontSize: '13px' }}>{day.getDate()}</strong>
              {dayEvents.map((event) => (
                <div
                  key={`${event.registrationId}-${event.start.toISOString()}`}
                  title={`${event.title}${event.location ? `, ${event.location}` : ''}`}
                  style={{
                    marginTop: '6px',
                    padding: '6px 8px',
                    borderRadius: '7px',
                    backgroundColor: '#d9f3f1',
                    color: '#006b6b',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}
                >
                  {event.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PersonalArea() {
  const { currentUser } = useAuth();
  const [paidRegistrations, setPaidRegistrations] = useState([]);
  const [calendarView, setCalendarView] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadPersonalArea() {
      if (!currentUser) return;

      setLoading(true);
      setError('');

      try {
        const paidData = await getUserPaidRegistrations(currentUser.uid);

        if (isMounted) {
          setPaidRegistrations(paidData);
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

  const calendarEvents = useMemo(() => (
    paidRegistrations
      .map(({ registration, activity }) => {
        const start = getActivityDate(activity, registration);
        if (!start) return null;

        return {
          registrationId: registration.id,
          title: activity?.title || registration.activityTitle || 'פעילות',
          start,
          end: toDate(activity?.endTime) || start,
          location: activity?.location || registration.location || '',
          type: activity?.type || '',
        };
      })
      .filter(Boolean)
  ), [paidRegistrations]);

  const nextActivity = useMemo(() => {
    const now = new Date();
    return [...calendarEvents]
      .filter((event) => event.start >= now)
      .sort((first, second) => first.start - second.start)[0] || null;
  }, [calendarEvents]);

  const now = new Date();
  const currentMonthPayments = paidRegistrations.filter(({ registration }) => {
    const registeredAt = toDate(registration.registeredAt);
    return (
      registeredAt &&
      registeredAt.getMonth() === now.getMonth() &&
      registeredAt.getFullYear() === now.getFullYear()
    );
  });
  const monthlyTotal = currentMonthPayments.reduce(
    (total, { activity }) => total + (Number(activity?.price) || 0),
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

        .personal-area__calendar {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 6px;
        }

        .personal-area__day-name {
          padding: 8px;
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
          text-align: center;
        }

        .personal-area__calendar-day {
          min-height: 94px;
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 9px;
          background: #fff;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .personal-area {
            padding: 24px 16px;
          }

          .personal-area__calendar {
            overflow-x: auto;
            grid-template-columns: repeat(7, minmax(100px, 1fr));
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
        <div style={{ ...cardStyle, color: '#475569', fontWeight: 800 }}>טוען את האזור האישי...</div>
      ) : (
        <>
          <section style={sectionStyle}>
            <h2 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '24px' }}>הלוח שלי</h2>

            <div style={{ ...cardStyle, marginBottom: '20px', borderInlineStart: '4px solid #008080' }}>
              <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>הפעילות הקרובה</p>
              {nextActivity ? (
                <>
                  <h3 style={{ margin: '8px 0 0', color: '#1a1a2e', fontSize: '22px' }}>
                    {nextActivity.title}
                  </h3>
                  <p style={{ margin: '7px 0 0', color: '#475569' }}>
                    {formatDate(nextActivity.start)}
                    {nextActivity.location ? ` · ${nextActivity.location}` : ''}
                  </p>
                </>
              ) : (
                <p style={{ margin: '8px 0 0', color: '#64748b' }}>
                  אין פעילויות רשומות ומשולמות עדיין
                </p>
              )}
            </div>

            {calendarEvents.length ? (
              <PersonalCalendar
                events={calendarEvents}
                view={calendarView}
                onViewChange={setCalendarView}
              />
            ) : (
              <div style={{ ...cardStyle, color: '#64748b', textAlign: 'center', fontWeight: 800 }}>
                אין פעילויות רשומות ומשולמות עדיין
              </div>
            )}
          </section>

          <section style={sectionStyle}>
            <h2 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '24px' }}>
              סיכום תשלומים חודשי
            </h2>

            <div style={{ ...cardStyle, borderInlineStart: '4px solid #008080' }}>
              <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>
                סה״כ תשלומים לחודש הנוכחי
              </p>
              {currentMonthPayments.length ? (
                <p style={{ margin: '8px 0 0', color: '#008080', fontSize: '32px', fontWeight: 900 }}>
                  {formatPrice(monthlyTotal)}
                </p>
              ) : (
                <p style={{ margin: '10px 0 0', color: '#64748b', fontWeight: 800 }}>
                  לא נמצאו תשלומים לחודש הנוכחי
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default PersonalArea;
