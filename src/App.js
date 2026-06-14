import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Users from './components/Users';
import Events from './components/Events';
import Gallery from './components/Gallery';
import Login from './components/Login';

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
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="users" element={<Users />} />
          <Route path="events" element={<Events />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="login" element={<Login />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#f5f1ec', color: '#1f2933', fontFamily: 'system-ui, sans-serif', padding: '0 12px 36px' }}>
      <header style={{ padding: '24px 0 18px', maxWidth: '1080px', margin: '0 auto' }}>
        <div style={{ textAlign: 'right', marginBottom: '18px' }}>
          <p style={{ margin: 0, fontSize: '1rem', color: '#5d6d7b' }}>בית הופמן</p>
          <h1 style={{ margin: '8px 0', fontSize: '2.6rem', lineHeight: 1.05 }}>מרכז קהילתי לבני הגיל השלישי</h1>
          <p style={{ margin: '10px 0 0', fontSize: '1.15rem', maxWidth: '760px', lineHeight: 1.8 }}>
            מידע על אירועים, הודעות חשובות וגלריה ידידותית לצפייה. ניווט פשוט, טקסט גדול ונגישות בראש סדר העדיפויות.
          </p>
        </div>
        <Navbar />
      </header>
      <main style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

function NotFoundPage() {
  return (
    <section style={sectionStyle}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>העמוד לא נמצא</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#4c5663' }}>
        הקישור אינו תקין. לחצו כדי לחזור לעמוד הבית.
      </p>
      <Link to="/" style={buttonStyle}>לעמוד הבית</Link>
    </section>
  );
}

export default App;
