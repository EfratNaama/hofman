import { Link } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import { formatActivityDate } from '../utils/activityDateUtils';
import LogoLoader from './LogoLoader';

const sectionStyle = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '20px',
  marginBottom: '24px',
  boxShadow: '0 10px 22px rgba(0,0,0,0.08)',
};

const buttonStyle = {
  display: 'inline-block',
  marginTop: '16px',
  padding: '12px 20px',
  borderRadius: '16px',
  background: '#3f6378',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '1rem',
};

function Events() {
  const { activities, isLoading, error } = useActivities();
  const events = activities.filter((activity) => activity.type === 'חד פעמי');

  return (
    <section style={sectionStyle} dir="rtl">
      <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>אירועים</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#4c5663' }}>
        כאן תוצג רשימת האירועים החד פעמיים.
      </p>

      {isLoading && <LogoLoader label="טוען אירועים..." />}

      {error && (
        <p style={{ marginTop: '18px', fontSize: '1rem', color: '#b91c1c' }}>{error}</p>
      )}

      {!isLoading && !error && events.length === 0 && (
        <p style={{ marginTop: '18px', fontSize: '1rem', color: '#4c5663' }}>אין אירועים להצגה כרגע.</p>
      )}

      {!isLoading && !error && events.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '18px' }}>
          {events.map((event) => (
            <li key={event.id} style={{ marginBottom: '14px', padding: '14px', background: '#f8f6f1', borderRadius: '14px' }}>
              <strong style={{ fontSize: '1.05rem' }}>
                {formatActivityDate(event.activityDate || event.date)} - {event.title}
              </strong>
              <p style={{ margin: '8px 0 0', fontSize: '1rem', lineHeight: 1.7 }}>{event.description}</p>
              <span style={{ color: '#5d6d7b', fontSize: '0.97rem' }}>שעה: {event.time}</span>
            </li>
          ))}
        </ul>
      )}

      <Link to="/activities" style={buttonStyle}>לכל הפעילויות</Link>
    </section>
  );
}

export default Events;
