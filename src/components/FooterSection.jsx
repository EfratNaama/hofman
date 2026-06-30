import React from 'react';

const sectionStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '28px',
  padding: 'clamp(24px, 4vw, 40px)',
  boxShadow: '0 18px 44px rgba(15, 34, 64, 0.09)',
  border: '1px solid #e5e7eb',
};

function Icon({ type }) {
  const commonProps = {
    width: 30,
    height: 30,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  if (type === 'phone') {
    return (
      <svg {...commonProps}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.89.66 2.78a2 2 0 0 1-.45 2.11L8.09 9.84a16 16 0 0 0 6.07 6.07l1.23-1.23a2 2 0 0 1 2.11-.45c.89.31 1.82.53 2.78.66A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }

  if (type === 'clock') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function FooterSection({ centerInfo, loading }) {
  const openingHours = centerInfo?.openingHours || [];
  const hoursValue = openingHours.length > 0
    ? openingHours.map((slot) => `${slot.day}: ${slot.open} - ${slot.close}`).join('\n')
    : 'ראשון-חמישי, 09:00-17:00';

  const contactCards = [
    {
      icon: 'location',
      title: 'כתובת',
      content: (
        <>
          <span>אליעזר הגדול 4, ירושלים</span>
          <br />
          <span>Waze: בית הופמן</span>
        </>
      ),
    },
    {
      icon: 'phone',
      title: 'טלפון ראשי',
      content: <a href="tel:026788848" aria-label="התקשרות לבית הופמן בטלפון 02-6788848">02-6788848</a>,
    },
    {
      icon: 'phone',
      title: 'אנשי קשר',
      content: (
        <>
          <span>
            סיון עץ הדר מנהלת בית הופמן -{' '}
            <a href="tel:0503082593" aria-label="התקשרות לסיון עץ הדר בטלפון 050-3082593">
              050-3082593
            </a>
          </span>
          <br />
          <span>
            שרה שירן רכזת גיל שלישי ומזכירה -{' '}
            <a href="tel:0504483859" aria-label="התקשרות לשרה שירן בטלפון 050-4483859">
              050-4483859
            </a>
          </span>
        </>
      ),
    },
    {
      icon: 'clock',
      title: 'שעות פעילות',
      content: hoursValue.split('\n').map((line, index) => (
        <React.Fragment key={`${line}-${index}`}>
          {index > 0 && <br />}
          {line}
        </React.Fragment>
      )),
    },
  ];

  return (
    <footer id="contact-info" dir="rtl" style={sectionStyle} aria-label="פרטי קשר בית הופמן">
      <div style={{ marginBottom: '26px' }}>
        <p className="home-section-description" style={{ margin: '0 auto', textAlign: 'center' }}>
          נשמח לעזור, לענות על שאלות ולכוון לפעילות המתאימה.
        </p>
      </div>

      <div className="home-contact-grid">
        {contactCards.map((card) => (
          <article className="home-contact-card home-card-hover" key={card.title}>
            <div className="home-contact-icon">
              <Icon type={card.icon} />
            </div>
            <h3>{card.title}</h3>
            <p>{card.content}</p>
          </article>
        ))}
      </div>
    </footer>
  );
}

export default FooterSection;
