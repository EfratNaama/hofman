import { Link } from 'react-router-dom';

const events = [
  { id: 1, date: '10 ביולי', title: 'סדנת יצירה', time: '10:00', description: 'פעילות אמנותית נעימה לגיל השלישי' },
  { id: 2, date: '12 ביולי', title: 'ריקודי שבט', time: '11:30', description: 'מפגש ריקוד קל וחברותי' },
  { id: 3, date: '14 ביולי', title: 'הרצאת בריאות', time: '09:30', description: 'שיחה על תזונה ושינה טובה' },
  { id: 4, date: '16 ביולי', title: 'קבוצת קריאה', time: '14:00', description: 'דיון על ספרים ושיתוף חוויות' },
  { id: 5, date: '18 ביולי', title: 'שעת סיפור', time: '15:30', description: 'מפגש סיפורים עם קפה ועוגה' },
];

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
  return (
    <section style={sectionStyle}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>אירועים</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#4c5663' }}>כאן תוצג רשימת כל האירועים והפעילויות.</p>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '18px' }}>
        {events.map((event) => (
          <li key={event.id} style={{ marginBottom: '14px', padding: '14px', background: '#f8f6f1', borderRadius: '14px' }}>
            <strong style={{ fontSize: '1.05rem' }}>{event.date} – {event.title}</strong>
            <p style={{ margin: '8px 0 0', fontSize: '1rem', lineHeight: 1.7 }}>{event.description}</p>
            <span style={{ color: '#5d6d7b', fontSize: '0.97rem' }}>שעה: {event.time}</span>
          </li>
        ))}
      </ul>
      <Link to="/" style={buttonStyle}>חזרה לדף הבית</Link>
    </section>
  );
}

export default Events;
