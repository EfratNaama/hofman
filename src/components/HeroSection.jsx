import React from 'react';
import { Link } from 'react-router-dom';

function HeroSection() {
  return (
    <section dir="rtl" style={{ maxWidth: '1200px', margin: '16px auto 40px' }}>
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: 'clamp(32px, 6vw, 72px)',
          borderRadius: '32px',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(15, 34, 64, 0.12)',
          border: '1px solid #e5e7eb',
        }}
      >
        <p
          style={{
            margin: '0 auto 18px',
            width: 'fit-content',
            padding: '8px 18px',
            borderRadius: '999px',
            backgroundColor: '#f8f5f0',
            color: '#0f2240',
            fontSize: '1.05rem',
            fontWeight: 800,
          }}
        >
          קהילה, תרבות ותמיכה בירושלים
        </p>

        <h1
          style={{
            margin: 0,
            color: '#0f2240',
            fontSize: 'clamp(2.5rem, 6vw, 4.8rem)',
            lineHeight: 1.08,
            fontWeight: 900,
          }}
        >
          מרכז קהילתי בית הופמן
        </h1>

        <p
          style={{
            margin: '22px auto 0',
            maxWidth: '820px',
            color: '#1f2937',
            fontSize: 'clamp(1.35rem, 3vw, 2rem)',
            lineHeight: 1.45,
            fontWeight: 800,
          }}
        >
          מידע, פעילויות והרשמה לבני הגיל השלישי
        </p>

        <p
          style={{
            margin: '18px auto 0',
            maxWidth: '850px',
            color: '#374151',
            fontSize: '1.25rem',
            lineHeight: 1.9,
          }}
        >
          מרכז קהילתי בירושלים המספק פעילויות חברתיות, תרבותיות ויצירתיות בסביבה נוחה ומכילה לכל בני וחברות הגיל השלישי.
        </p>

        <div
          style={{
            marginTop: '34px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          <Link className="home-cta home-cta-primary" to="/events">
            לוח פעילויות
          </Link>
          <Link className="home-cta home-cta-secondary" to="/login">
            אזור אישי
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
