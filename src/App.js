import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import './App.css';

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

const navLinkStyle = ({ isActive }) => ({
  display: 'inline-block',
  padding: '12px 18px',
  margin: '4px',
  borderRadius: '14px',
  textDecoration: 'none',
  fontSize: '1.05rem',
  fontWeight: isActive ? 700 : 600,
  color: isActive ? '#1b3f5b' : '#0d1f2f',
  background: isActive ? '#f0d1a2' : '#e9e5df',
});

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

function App() {
  return (
    <BrowserRouter>
      <div dir="rtl" style={{ minHeight: '100vh', background: '#f5f1ec', color: '#1f2933', fontFamily: 'system-ui, sans-serif', padding: '0 12px 36px' }}>
        <header style={{ padding: '24px 0 18px', maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ textAlign: 'right', marginBottom: '18px' }}>
            <p style={{ margin: 0, fontSize: '1rem', color: '#5d6d7b' }}>בית הופמן</p>
            <h1 style={{ margin: '8px 0', fontSize: '2.6rem', lineHeight: 1.05 }}>מרכז קהילתי לבני הגיל השלישי</h1>
            <p style={{ margin: '10px 0 0', fontSize: '1.15rem', maxWidth: '760px', lineHeight: 1.8 }}>מידע על אירועים, הודעות חשובות וגלריה ידידותית לצפייה. ניווט פשוט, טקסט גדול ונגישות בראש סדר העדיפויות.</p>
          </div>
          <nav aria-label="תפריט ראשי" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '8px' }}>
            <NavLink end to="/" style={navLinkStyle}>בית</NavLink>
            <NavLink to="/users" style={navLinkStyle}>משתמשים</NavLink>
            <NavLink to="/events" style={navLinkStyle}>אירועים</NavLink>
            <NavLink to="/gallery" style={navLinkStyle}>גלריה</NavLink>
            <NavLink to="/login" style={navLinkStyle}>כניסה</NavLink>
          </nav>
        </header>

        <main style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function HomePage() {
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

function UsersPage() {
  return (
    <section style={sectionStyle}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>משתמשים</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#4c5663' }}>פרופילי משתמשים נוצרים רק על ידי מנהלים. אין רישום עצמי באתר.</p>
      <Link to="/" style={buttonStyle}>חזרה לדף הבית</Link>
    </section>
  );
}

function EventsPage() {
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

function GalleryPage() {
  return (
    <section style={sectionStyle}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>גלריה</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#4c5663' }}>תמונות מהאירועים והמפגשים שלנו.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '18px' }}>
        {galleryItems.map((item) => (
          <div key={item.id} style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <img src={item.src} alt={item.alt} style={{ width: '100%', display: 'block' }} />
          </div>
        ))}
      </div>
      <Link to="/" style={buttonStyle}>חזרה לדף הבית</Link>
    </section>
  );
}

function LoginPage() {
  return (
    <section style={sectionStyle}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>כניסה</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#4c5663' }}>התחברו באמצעות פרטי משתמש מנהל. אין רישום עצמי באתר.</p>
      <Link to="/" style={buttonStyle}>חזרה לדף הבית</Link>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section style={sectionStyle}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>העמוד לא נמצא</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#4c5663' }}>הקישור אינו תקין. לחצו כדי לחזור לעמוד הבית.</p>
      <Link to="/" style={buttonStyle}>לעמוד הבית</Link>
    </section>
  );
}

export default App;
