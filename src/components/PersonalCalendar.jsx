import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { he } from 'date-fns/locale';
import { HebrewCalendar } from '@hebcal/core/dist/esm/hebcal';
import { HDate } from '@hebcal/hdate';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './PersonalCalendar.css';

const locales = { 'he-IL': he };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 0 }),
  getDay,
  locales,
});

const messages = {
  allDay: 'כל היום',
  previous: 'הקודם',
  next: 'הבא',
  today: 'היום',
  month: 'חודש',
  week: 'שבוע',
  day: 'יום',
  agenda: 'סדר יום',
  date: 'תאריך',
  time: 'שעה',
  event: 'אירוע',
  noEventsInRange: 'אין אירועים בטווח זה',
  showMore: (total) => `+${total} נוספים`,
};

const getVisibleRange = (date, view) => {
  if (view === Views.WEEK) {
    const start = startOfWeek(date, { weekStartsOn: 0 });
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  }

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 41);
  return { start, end };
};

const formatHebrewDate = (date) => new HDate(date).renderGematriya(true, true);

function MonthDateHeader({ date }) {
  return (
    <span className="personal-calendar__date-header">
      <strong>{format(date, 'dd/MM')}</strong>
      <small>{formatHebrewDate(date)}</small>
    </span>
  );
}

function WeekHeader({ date }) {
  return (
    <span className="personal-calendar__week-header">
      <strong>{format(date, 'EEEE', { locale: he })}</strong>
      <span>{format(date, 'dd/MM')}</span>
      <small>{formatHebrewDate(date)}</small>
    </span>
  );
}

function CalendarEvent({ event, onDetails }) {
  return (
    <div className="personal-calendar__event-content">
      <span title={event.title}>{event.title}</span>
      {event.type === 'activity' && (
        <button
          type="button"
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onDetails(event.activityId);
          }}
        >
          לפרטים
        </button>
      )}
    </div>
  );
}

function PersonalCalendar({ activityEvents }) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(Views.WEEK);

  const holidays = useMemo(() => {
    const { start, end } = getVisibleRange(currentDate, currentView);

    try {
      return HebrewCalendar.calendar({
        start,
        end,
        il: true,
        locale: 'he',
        sedrot: false,
        omer: false,
      }).map((holiday, index) => {
        const holidayDate = holiday.getDate().greg();
        const holidayEnd = new Date(holidayDate);
        holidayEnd.setDate(holidayEnd.getDate() + 1);
        return {
          id: `holiday-${holidayDate.toISOString()}-${index}`,
          title: holiday.render('he'),
          start: holidayDate,
          end: holidayEnd,
          allDay: true,
          type: 'holiday',
        };
      });
    } catch (error) {
      console.error('Failed to load Hebrew calendar holidays:', error);
      return [];
    }
  }, [currentDate, currentView]);

  const events = useMemo(
    () => [...activityEvents, ...holidays],
    [activityEvents, holidays]
  );

  const components = useMemo(() => ({
    event: (props) => (
      <CalendarEvent
        {...props}
        onDetails={(activityId) => navigate(`/activities/${activityId}`)}
      />
    ),
    month: {
      dateHeader: MonthDateHeader,
    },
    week: {
      header: WeekHeader,
    },
  }), [navigate]);

  const eventPropGetter = (event) => {
    if (event.type === 'holiday') {
      return {
        className: 'personal-calendar__event personal-calendar__event--holiday',
      };
    }

    const isPast = event.end < new Date();
    return {
      className: `personal-calendar__event ${
        isPast ? 'personal-calendar__event--past' : 'personal-calendar__event--activity'
      }`,
    };
  };

  return (
    <div className="personal-calendar" dir="rtl">
      <Calendar
        localizer={localizer}
        culture="he-IL"
        date={currentDate}
        view={currentView}
        views={[Views.WEEK, Views.MONTH]}
        defaultView={Views.WEEK}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        allDayAccessor="allDay"
        rtl
        popup
        messages={messages}
        components={components}
        eventPropGetter={eventPropGetter}
        onNavigate={setCurrentDate}
        onView={setCurrentView}
        onSelectEvent={(event) => {
          if (event.type === 'activity') {
            navigate(`/activities/${event.activityId}`);
          }
        }}
        min={new Date(1970, 0, 1, 7, 0)}
        max={new Date(1970, 0, 1, 22, 0)}
        scrollToTime={new Date(1970, 0, 1, 8, 0)}
        step={30}
        timeslots={2}
      />
    </div>
  );
}

export default PersonalCalendar;
