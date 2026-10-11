import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarPlus,
  ClipboardList,
  MapPin,
  Pencil,
} from 'lucide-react';
import { useActivities } from '../../hooks/useActivities';
import { getActivityRegistrationCounts } from '../../services/activityRegistrationsService';
import { generateActivityOccurrences } from '../../utils/activityDateUtils';
import { isActivityRegistrationClosed } from '../../utils/activityRegistrationUtils';

const shortWeekdayFormatter = new Intl.DateTimeFormat('he-IL', { weekday: 'short' });
const longWeekdayFormatter = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

const UPCOMING_DAYS = 7;

/*
 * All styles for this page live here, scoped under .amh, in the same visual
 * language as the admin dashboard. Sizes are in rem so the site's
 * accessibility font scale still applies.
 */
const PAGE_STYLES = `
.amh * { font-size: inherit; box-sizing: border-box; }
.amh {
  min-height: calc(100vh - 96px); padding: 32px 20px 64px; background: #f6f2ec; color: #2b211c;
  font-size: 1rem; line-height: 1.5; text-align: right;
}
.amh-shell { max-width: 1120px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.amh a:focus-visible, .amh button:focus-visible { outline: 3px solid #d4a373; outline-offset: 3px; }
.amh-in { animation: amh-in .6s cubic-bezier(.2,.7,.2,1) both; }

.amh-header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; }
.amh-title { margin: 0; font-size: clamp(1.8rem, 3vw, 2.2rem); font-weight: 800; line-height: 1.15; color: #2b211c; }
.amh-subtitle { margin: 4px 0 0; font-size: 1rem; color: #6b5a50; }
.amh-date {
  display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 999px;
  background: #fff; border: 1px solid #ece3da; color: #6b5a50; font-size: 0.875rem; font-weight: 600;
}

/* stats */
.amh-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
.amh-stat {
  display: flex; align-items: center; gap: 14px; padding: 16px 18px;
  background: #fff; border: 1px solid #ece3da; border-radius: 18px;
}
.amh-stat__icon { width: 46px; height: 46px; flex: 0 0 auto; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.amh-stat__label { margin: 0; font-size: 0.9rem; font-weight: 600; color: #6b5a50; }
.amh-stat__value { margin: 0; font-size: 1.9rem; font-weight: 800; line-height: 1.1; color: #2b211c; }
.amh-tone--teal { background: #e6efec; color: #2c4d44; }
.amh-tone--terra { background: #f6eee8; color: #a84f3d; }
.amh-tone--blue { background: #eceef8; color: #3e4c94; }
.amh-tone--gold { background: #f6efdf; color: #7a5512; }

/* action cards */
.amh-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.amh-action {
  position: relative; overflow: hidden; isolation: isolate; display: flex; flex-direction: column; gap: 14px;
  min-height: 270px; padding: clamp(24px, 3vw, 32px);
  border-radius: 26px; border: 1px solid #ece3da; background: #fff;
  color: #2b211c; text-decoration: none;
  transition: translate .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s ease, border-color .35s ease;
}
.amh-action:hover { translate: 0 -6px; box-shadow: 0 24px 48px rgba(90,51,39,.14); color: #2b211c; }
.amh-action__blob {
  position: absolute; z-index: -1; border-radius: 50%; pointer-events: none;
  transition: transform .6s cubic-bezier(.2,.7,.2,1);
}
.amh-action__blob--1 { width: 260px; height: 260px; left: -90px; bottom: -120px; }
.amh-action__blob--2 { width: 120px; height: 120px; left: 120px; top: -50px; }
.amh-action:hover .amh-action__blob--1 { transform: scale(1.18); }
.amh-action:hover .amh-action__blob--2 { transform: translate(-16px, 10px); }
.amh-action--add { background: linear-gradient(135deg, #b85b45 0%, #a84f3d 55%, #93422f 100%); border-color: #a84f3d; color: #fff; }
.amh-action--add:hover { color: #fff; }
.amh-action--add .amh-action__blob { background: rgba(255,255,255,.08); }
.amh-action--manage .amh-action__blob--1 { background: #eef5f2; }
.amh-action--manage .amh-action__blob--2 { background: #f6eee8; }
.amh-action--manage:hover { border-color: #c9ddd5; }

.amh-action__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.amh-action__icon { width: 60px; height: 60px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
.amh-action--add .amh-action__icon { background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.35); color: #fff; }
.amh-action--manage .amh-action__icon { background: #e6efec; color: #2c4d44; }
.amh-action__big { font-size: 3.2rem; font-weight: 800; line-height: 1; opacity: .9; }
.amh-action--add .amh-action__big { color: rgba(255,255,255,.22); }
.amh-action--manage .amh-action__big { color: #e3ece8; }
.amh-action__title { margin: 0; font-size: 1.7rem; font-weight: 800; line-height: 1.2; }
.amh-action__text { margin: 0; font-size: 1.05rem; line-height: 1.6; }
.amh-action--add .amh-action__text { color: rgba(255,255,255,.92); }
.amh-action--manage .amh-action__text { color: #5c4a40; }
.amh-action__meta { display: flex; flex-wrap: wrap; gap: 8px; }
.amh-chip { padding: 3px 12px; border-radius: 999px; font-size: 0.85rem; font-weight: 700; white-space: nowrap; }
.amh-chip--teal { background: #e6efec; color: #2c4d44; }
.amh-chip--terra { background: #fbf1ec; color: #a84f3d; }
.amh-chip--gray { background: #f3ede6; color: #5c524c; }
.amh-chip--light { background: rgba(255,255,255,.18); color: #fff; border: 1px solid rgba(255,255,255,.35); }
.amh-action__cta {
  display: inline-flex; align-items: center; gap: 8px; margin-top: auto; align-self: flex-start;
  padding: 10px 18px; border-radius: 999px; font-size: 1rem; font-weight: 800;
}
.amh-action--add .amh-action__cta { background: #fff; color: #93422f; }
.amh-action--manage .amh-action__cta { background: #2c4d44; color: #fff; }
.amh-action__cta svg { transition: transform .25s ease; }
.amh-action:hover .amh-action__cta svg { transform: translateX(-5px); }

/* week planner */
.amh-panel { padding: 22px 24px; background: #fff; border: 1px solid #ece3da; border-radius: 22px; }
.amh-panel__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 14px; }
.amh-panel__title { margin: 0; font-size: 1.25rem; font-weight: 800; color: #2b211c; }
.amh-panel__sub { font-size: 0.875rem; color: #6b5a50; }
.amh-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; margin-bottom: 16px; }
.amh-day {
  position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 10px 4px 12px; border-radius: 16px; border: 1px solid #ece3da; background: #fbf8f4;
  color: #2b211c; cursor: pointer; font: inherit;
  transition: background-color .15s ease, border-color .15s ease, translate .2s ease;
}
.amh-day:hover { border-color: #c9b6a8; translate: 0 -2px; }
.amh-day[aria-pressed="true"] { background: #2b211c; border-color: #2b211c; color: #fff; }
.amh-day__name { font-size: 0.8rem; font-weight: 700; color: #a84f3d; }
.amh-day[aria-pressed="true"] .amh-day__name { color: #f3c9b8; }
.amh-day__num { font-size: 1.35rem; font-weight: 800; line-height: 1.1; }
.amh-day__dots { display: flex; gap: 3px; height: 6px; margin-top: 4px; }
.amh-day__dot { width: 6px; height: 6px; border-radius: 50%; background: #00846f; }
.amh-day[aria-pressed="true"] .amh-day__dot { background: #8fd3c4; }
.amh-day__today {
  position: absolute; top: -8px; padding: 0 8px; border-radius: 999px; background: #a84f3d; color: #fff;
  font-size: 0.7rem; font-weight: 700; line-height: 1.6;
}

.amh-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
.amh-item {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; padding: 14px 16px;
  border-radius: 16px; background: #fbf8f4; border: 1px solid #f0e8df;
  border-inline-start: 4px solid #00846f;
  animation: amh-in .4s cubic-bezier(.2,.7,.2,1) both;
}
.amh-item.is-full { border-inline-start-color: #a39a93; }
.amh-item__time { min-width: 56px; font-size: 1.1rem; font-weight: 800; color: #2c4d44; }
.amh-item__info { flex: 1 1 220px; min-width: 0; }
.amh-item__title { margin: 0; font-size: 1.05rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.amh-item__meta { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 2px 0 0; font-size: 0.875rem; color: #6b5a50; }
.amh-item__meta span { display: inline-flex; align-items: center; gap: 4px; }
.amh-item__capacity { display: flex; align-items: center; gap: 8px; min-width: 150px; }
.amh-item__bar { flex: 1; height: 8px; border-radius: 999px; background: #ece3da; overflow: hidden; }
.amh-item__fill { display: block; height: 100%; border-radius: 999px; background: #00846f; }
.is-full .amh-item__fill { background: #a39a93; }
.amh-item__count { font-size: 0.85rem; font-weight: 700; color: #5c4a40; white-space: nowrap; }
.amh-item__side { display: flex; align-items: center; gap: 8px; }
.amh-item__btn {
  display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: 10px;
  border: 1px solid #e3d7cc; background: #fff; color: #2b211c; font-size: 0.9rem; font-weight: 700;
  text-decoration: none; transition: background-color .15s ease, border-color .15s ease;
}
.amh-item__btn:hover { border-color: #c9b6a8; color: #2b211c; }
.amh-empty { padding: 24px; border-radius: 16px; background: #faf6f2; color: #6b5a50; text-align: center; }
.amh-error { padding: 12px 16px; border-radius: 12px; background: #fdf0ee; border: 1px solid #f1c4bf; color: #b42318; font-weight: 600; }

@keyframes amh-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

@media (max-width: 760px) {
  .amh-actions { grid-template-columns: 1fr; }
  .amh-action { min-height: 0; }
  .amh-days { grid-template-columns: repeat(7, minmax(44px, 1fr)); overflow-x: auto; padding-top: 8px; }
}
@media (prefers-reduced-motion: reduce) {
  .amh-in, .amh-item { animation: none; }
  .amh-action, .amh-action__blob, .amh-action__cta svg, .amh-day { transition: none; }
  .amh-action:hover, .amh-day:hover { translate: none; }
}
`;

function ActivityManagementHub() {
  const { activities, isLoading, error } = useActivities();
  const [registrationCounts, setRegistrationCounts] = useState({});
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (!activities.length) {
      setRegistrationCounts({});
      return undefined;
    }

    getActivityRegistrationCounts(activities.map((activity) => activity.id))
      .then((counts) => {
        if (isMounted) setRegistrationCounts(counts);
      })
      .catch((err) => console.error('Failed to load registration counts', err));

    return () => {
      isMounted = false;
    };
  }, [activities]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const windowEnd = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + UPCOMING_DAYS);

    const countFor = (activity) => Number(registrationCounts[activity.id] ?? activity.currentParticipants ?? 0);
    const running = activities.filter(
      (activity) => activity.isActive !== false && !isActivityRegistrationClosed(activity)
    );
    const full = running.filter((activity) => {
      const max = Number(activity.maxParticipants || 0);
      return max > 0 && countFor(activity) >= max;
    });
    const totalRegistrations = activities.reduce((sum, activity) => sum + countFor(activity), 0);

    const days = Array.from({ length: UPCOMING_DAYS }, (_, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() + index);
      return { date, items: [] };
    });

    running.forEach((activity) => {
      generateActivityOccurrences(activity)
        .filter((date) => date >= today && date < windowEnd)
        .forEach((date) => {
          const index = Math.round((date - today) / (24 * 60 * 60 * 1000));
          const max = Number(activity.maxParticipants || 0);
          const taken = countFor(activity);
          days[index]?.items.push({
            key: `${activity.id}-${date.getTime()}`,
            id: activity.id,
            title: activity.title || 'פעילות ללא כותרת',
            time: activity.time || '',
            location: activity.location,
            max,
            taken,
          });
        });
    });
    days.forEach((day) => day.items.sort((first, second) => first.time.localeCompare(second.time)));

    return {
      total: activities.length,
      openCount: running.length - full.length,
      fullCount: full.length,
      endedCount: activities.length - running.length,
      totalRegistrations,
      upcomingCount: days.reduce((sum, day) => sum + day.items.length, 0),
      days,
    };
  }, [activities, registrationCounts]);

  const activeDay = stats.days[selectedDay] || stats.days[0];

  return (
    <main className="amh" dir="rtl">
      <style>{PAGE_STYLES}</style>
      <div className="amh-shell">
        <header className="amh-header amh-in">
          <div>
            <h1 className="amh-title">ניהול פעילויות</h1>
            <p className="amh-subtitle">הוספה, עריכה ומעקב אחרי כל הפעילויות באתר</p>
          </div>
        </header>

        {error && <div className="amh-error" role="alert">{error}</div>}

        <section className="amh-actions amh-in" style={{ animationDelay: '.05s' }} aria-label="פעולות">
          <Link to="/activities/new" className="amh-action amh-action--add">
            <span className="amh-action__blob amh-action__blob--1" aria-hidden="true" />
            <span className="amh-action__blob amh-action__blob--2" aria-hidden="true" />
            <div className="amh-action__top">
              <span className="amh-action__icon" aria-hidden="true">
                <CalendarPlus size={30} strokeWidth={1.9} />
              </span>
              <span className="amh-action__big" aria-hidden="true">+</span>
            </div>
            <h2 className="amh-action__title">הוספת פעילות</h2>
            <p className="amh-action__text">יצירת פעילות חדשה: חוג קבוע, סדנה או אירוע חד־פעמי.</p>
            <span className="amh-action__meta">
              <span className="amh-chip amh-chip--light">חוג קבוע</span>
              <span className="amh-chip amh-chip--light">סדנה</span>
              <span className="amh-chip amh-chip--light">אירוע</span>
            </span>
            <span className="amh-action__cta">
              ליצירת פעילות
              <ArrowLeft size={18} aria-hidden="true" />
            </span>
          </Link>

          <Link to="/activities" className="amh-action amh-action--manage">
            <span className="amh-action__blob amh-action__blob--1" aria-hidden="true" />
            <span className="amh-action__blob amh-action__blob--2" aria-hidden="true" />
            <div className="amh-action__top">
              <span className="amh-action__icon" aria-hidden="true">
                <ClipboardList size={30} strokeWidth={1.9} />
              </span>
              <span className="amh-action__big" aria-hidden="true">{isLoading ? '' : stats.total}</span>
            </div>
            <h2 className="amh-action__title">ניהול פעילויות</h2>
            <p className="amh-action__text">צפייה, עריכה, מחיקה וניהול נרשמים לפעילויות.</p>
            {!isLoading && (
              <span className="amh-action__meta">
                <span className="amh-chip amh-chip--teal">{stats.openCount} פתוחות</span>
                {stats.fullCount > 0 && <span className="amh-chip amh-chip--terra">{stats.fullCount} מלאות</span>}
                {stats.endedCount > 0 && <span className="amh-chip amh-chip--gray">{stats.endedCount} הסתיימו</span>}
              </span>
            )}
            <span className="amh-action__cta">
              לכל הפעילויות
              <ArrowLeft size={18} aria-hidden="true" />
            </span>
          </Link>
        </section>

        <section className="amh-panel amh-in" style={{ animationDelay: '.1s' }} aria-labelledby="amh-week-title">
          <div className="amh-panel__head">
            <h2 id="amh-week-title" className="amh-panel__title">השבוע הקרוב</h2>
            <span className="amh-panel__sub">בחרו יום כדי לראות מה מתקיים בו</span>
          </div>

          <div className="amh-days" role="group" aria-label="בחירת יום">
            {stats.days.map((day, index) => (
              <button
                key={day.date.getTime()}
                type="button"
                className="amh-day"
                aria-pressed={selectedDay === index}
                aria-label={`${longWeekdayFormatter.format(day.date)}, ${day.items.length} פעילויות`}
                onClick={() => setSelectedDay(index)}
              >
                {index === 0 && <span className="amh-day__today">היום</span>}
                <span className="amh-day__name">{shortWeekdayFormatter.format(day.date)}</span>
                <span className="amh-day__num">{day.date.getDate()}</span>
                <span className="amh-day__dots" aria-hidden="true">
                  {day.items.slice(0, 4).map((item) => <span className="amh-day__dot" key={item.key} />)}
                </span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="amh-empty">טוען פעילויות...</div>
          ) : activeDay.items.length ? (
            <ul className="amh-list" key={selectedDay}>
              {activeDay.items.map((item, index) => {
                const isFull = item.max > 0 && item.taken >= item.max;
                const pct = item.max > 0 ? Math.min(100, Math.round((item.taken / item.max) * 100)) : 0;
                return (
                  <li
                    className={`amh-item${isFull ? ' is-full' : ''}`}
                    key={item.key}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <span className="amh-item__time">{item.time || '—'}</span>
                    <div className="amh-item__info">
                      <p className="amh-item__title">{item.title}</p>
                      {item.location && (
                        <p className="amh-item__meta">
                          <span><MapPin size={14} aria-hidden="true" />{item.location}</span>
                        </p>
                      )}
                    </div>
                    {item.max > 0 && (
                      <div className="amh-item__capacity" title={`${item.taken} מתוך ${item.max}`}>
                        <span className="amh-item__bar"><span className="amh-item__fill" style={{ width: `${pct}%` }} /></span>
                        <span className="amh-item__count">{isFull ? 'מלא' : `${item.taken}/${item.max}`}</span>
                      </div>
                    )}
                    <div className="amh-item__side">
                      <Link to={`/activities/${item.id}/edit`} className="amh-item__btn">
                        <Pencil size={14} aria-hidden="true" />
                        עריכה
                      </Link>
                      <Link to={`/activities/${item.id}`} className="amh-item__btn">פרטים</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="amh-empty">אין פעילויות ב{longWeekdayFormatter.format(activeDay.date)}.</div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ActivityManagementHub;
