import React from 'react';

const sectionStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '28px',
  padding: 'clamp(24px, 4vw, 44px)',
  boxShadow: '0 18px 44px rgba(15, 34, 64, 0.09)',
  border: '1px solid #e5e7eb',
};

const layoutStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
  gap: '32px',
  alignItems: 'center',
};

const titleStyle = {
  margin: 0,
  color: '#0f2240',
  fontSize: 'clamp(2rem, 4vw, 2.7rem)',
  lineHeight: 1.18,
  fontWeight: 900,
};

const textStyle = {
  margin: '16px 0 0',
  color: '#374151',
  fontSize: '1.2rem',
  lineHeight: 1.9,
};

const highlightsGridStyle = {
  display: 'grid',
  gap: '14px',
};

const highlightCardStyle = {
  padding: '18px 20px',
  borderRadius: '20px',
  backgroundColor: '#f8f5f0',
  border: '1px solid #e5e7eb',
  color: '#0f2240',
  fontSize: '1.12rem',
  fontWeight: 900,
};

function AboutSection() {
  const highlights = ['אווירה מזמינה ונעימה', 'פעילויות חברתיות', 'הרצאות וסדנאות', 'תמיכה קהילתית'];

  return (
    <section id="about" dir="rtl" style={sectionStyle} aria-labelledby="about-title">
      <div className="home-about-layout" style={layoutStyle}>
        <div>
          <h2 id="about-title" style={titleStyle}>
            אודות בית הופמן
          </h2>
          <p style={textStyle}>
            בית הופמן הוא מרכז קהילתי חם ומקצועי לבני ובנות הגיל השלישי בירושלים. המרכז מציע מרחב מזמין לפעילויות חברתיות, הרצאות, סדנאות יצירה, מפגשי תרבות ותמיכה קהילתית באווירה מכבדת ונגישה.
          </p>
          <p style={textStyle}>
            הצוות שלנו פועל כדי שכל מבקר ומבקרת ירגישו בבית, ימצאו עניין, קשר אנושי ותוכן איכותי המתאים לקצב ולצרכים שלהם.
          </p>
        </div>

        <div style={highlightsGridStyle} aria-label="תחומי פעילות מרכזיים">
          {highlights.map((item) => (
            <div style={highlightCardStyle} key={item}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
