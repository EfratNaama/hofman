import { Link } from 'react-router-dom';

const events = [
  { id: 1, date: '10 ביולי', title: 'סדנת יצירה', time: '10:00', description: 'פעילות אמנותית נעימה לגיל השלישי' },
  { id: 2, date: '12 ביולי', title: 'ריקודי שבט', time: '11:30', description: 'מפגש ריקוד קל וחברותי' },
  { id: 3, date: '14 ביולי', title: 'הרצאת בריאות', time: '09:30', description: 'שיחה על תזונה ושינה טובה' },
  { id: 4, date: '16 ביולי', title: 'קבוצת קריאה', time: '14:00', description: 'דיון על ספרים ושיתוף חוויות' },
  { id: 5, date: '18 ביולי', title: 'שעת סיפור', time: '15:30', description: 'מפגש סיפורים עם קפה ועוגה' },
];

const announcements = [
  { id: 1, title: 'שעות פעילות מעודכנות', detail: 'המרכז ייסגר ב-17:00 בימי חמישי.', date: '08/07' },
  { id: 2, title: 'תערוכת צילום חדשה', detail: 'הגלריה מציגה עבודות של חברים מהקהילה.', date: '05/07' },
  { id: 3, title: 'פעילות בוקר ללא תשלום', detail: 'הצטרפו לקפה ושיחה פתוחה ברוח טובה.', date: '02/07' },
];

const galleryItems = [
  { id: 1, alt: 'מפגש יצירה', src: 'https://via.placeholder.com/360x240?text=%D7%99%D7%A6%D7%99%D7%A8%D7%94' },
  { id: 2, alt: 'שיעור ריקוד', src: 'https://via.placeholder.com/360x240?text=%D7%A8%D7%99%D7%A7%D7%95%D7%93' },
  { id: 3, alt: 'הרצאת בריאות', src: 'https://via.placeholder.com/360x240?text=%D7%91%D7%A8%D7%99%D7%90%D7%95%D7%AA' },
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

function Home() {
  return (
    <section>
      <article style={sectionStyle}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>אירועים קרובים</h2>
        <p style={{ margin: '0 0 18px', fontSize: '1rem', color: '#4c5663' }}>חמישה אירועים קרובים, מסודרים לפי תאריך.</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {events.map((event) => (
            <li key={event.id} style={{ marginBottom: '14px', padding: '12px', background: '#f8f6f1', borderRadius: '14px' }}>
              <strong style={{ display: 'block', fontSize: '1.05rem' }}>{event.date} – {event.title}</strong>
              <p style={{ margin: '8px 0 0', fontSize: '1rem', lineHeight: 1.7 }}>{event.description}</p>
              <span style={{ display: 'block', marginTop: '8px', color: '#5d6d7b', fontSize: '0.97rem' }}>שעה: {event.time}</span>
            </li>
          ))}
        </ul>
      </article>

      <article style={sectionStyle}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>הודעות אחרונות</h2>
        <p style={{ margin: '0 0 18px', fontSize: '1rem', color: '#4c5663' }}>שלוש ההודעות האחרונות לקהילה.</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {announcements.map((item) => (
            <li key={item.id} style={{ marginBottom: '14px', padding: '12px', background: '#f8f6f1', borderRadius: '14px' }}>
              <strong style={{ display: 'block', fontSize: '1.05rem' }}>{item.title}</strong>
              <p style={{ margin: '8px 0 0', fontSize: '1rem', lineHeight: 1.7 }}>{item.detail}</p>
              <span style={{ display: 'block', marginTop: '8px', color: '#5d6d7b', fontSize: '0.97rem' }}>{item.date}</span>
            </li>
          ))}
        </ul>
      </article>

      <article style={sectionStyle}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>תצוגת גלריה</h2>
        <p style={{ margin: '0 0 18px', fontSize: '1rem', color: '#4c5663' }}>רגעים מהפעילויות והמפגשים שלנו.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {galleryItems.map((item) => (
            <div key={item.id} style={{ borderRadius: '16px', overflow: 'hidden', background: '#e6e2dc' }}>
              <img src={item.src} alt={item.alt} style={{ width: '100%', display: 'block' }} />
            </div>
          ))}
        </div>
        <Link to="/gallery" style={buttonStyle}>לגלריה המלאה</Link>
      </article>
    </section>
  );
}

export default Home;
