import React from 'react';

function AboutSection() {
  const highlights = ['אווירה מזמינה ונעימה', 'פעילויות חברתיות', 'הרצאות וסדנאות', 'תמיכה קהילתית'];

  return (
    <section
      id="about"
      dir="rtl"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '28px',
        padding: 'clamp(24px, 4vw, 44px)',
        boxShadow: '0 18px 44px rgba(15, 34, 64, 0.09)',
        border: '1px solid #e5e7eb',
      }}
      aria-labelledby="about-title"
    >
      <div className="home-about-layout">
        <div>
          <h2 id="about-title" className="home-section-title">
            אודות בית הופמן
          </h2>
          <p className="home-about-text">
            בית הופמן הוא מרכז קהילתי חם ומקצועי לבני ובנות הגיל השלישי בירושלים. המרכז מציע מרחב מזמין לפעילויות חברתיות, הרצאות, סדנאות יצירה, מפגשי תרבות ותמיכה קהילתית באווירה מכבדת ונגישה.
          </p>
          <p className="home-about-text">
            הצוות שלנו פועל כדי שכל מבקר ומבקרת ירגישו בבית, ימצאו עניין, קשר אנושי ותוכן איכותי המתאים לקצב ולצרכים שלהם.
          </p>
        </div>

        <div className="home-about-highlights" aria-label="תחומי פעילות מרכזיים">
          {highlights.map((item) => (
            <div className="home-highlight-card" key={item}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
