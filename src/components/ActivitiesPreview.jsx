import React from 'react';
import { Link } from 'react-router-dom';
import LogoLoader from './LogoLoader';

const sectionStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '28px',
  padding: 'clamp(24px, 4vw, 40px)',
  boxShadow: '0 18px 44px rgba(15, 34, 64, 0.09)',
  border: '1px solid #e5e7eb',
};

const sectionHeaderStyle = {
  marginBottom: '26px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'end',
  gap: '20px',
  flexWrap: 'wrap',
};

const demoActivities = [
  {
    id: 'demo-yoga',
    title: 'יוגה לגיל השלישי',
    category: 'בריאות ותנועה',
    dayOfWeek: 'ראשון',
    time: '09:30',
    availableSpots: 8,
  },
  {
    id: 'demo-watercolor',
    title: 'סדנת ציור בצבעי מים',
    category: 'יצירה',
    dayOfWeek: 'שני',
    time: '11:00',
    availableSpots: 6,
  },
  {
    id: 'demo-nutrition',
    title: 'הרצאה: תזונה ובריאות',
    category: 'הרצאות',
    dayOfWeek: 'שלישי',
    time: '17:00',
    availableSpots: 14,
  },
  {
    id: 'demo-folk-dance',
    title: 'ריקודי עם',
    category: 'מחול',
    dayOfWeek: 'רביעי',
    time: '18:30',
    availableSpots: 10,
  },
  {
    id: 'demo-book-club',
    title: 'מועדון קריאה',
    category: 'תרבות',
    dayOfWeek: 'חמישי',
    time: '10:00',
    availableSpots: 12,
  },
];

function formatActivityDate(activity) {
  if (activity.activityDate?.toDate) {
    return activity.activityDate.toDate().toLocaleDateString('he-IL');
  }

  return activity.dayOfWeek || 'יתעדכן בקרוב';
}

function ActivitiesPreview({ activities = [], loading }) {
  const visibleActivities = (activities.length > 0 ? activities : demoActivities).slice(0, 5);

  return (
    <section dir="rtl" style={sectionStyle} aria-labelledby="activities-title">
      <div style={sectionHeaderStyle}>
        <div>
          <h2 id="activities-title" className="home-section-title">
            הפעילויות הקרובות
          </h2>
          <p className="home-section-description">
            פעילויות קרובות לבחירה מהירה, עם פרטים ברורים והרשמה נגישה.
          </p>
        </div>
        <Link className="home-small-link" to="/events">
          לכל הפעילויות
        </Link>
      </div>

      {loading ? (
        <LogoLoader label="טוען פעילויות..." />
      ) : (
        <div className="home-grid home-grid-activities">
          {visibleActivities.map((activity) => (
            <article className="home-card home-card-hover" key={activity.id}>
              <div>
                <p className="home-card-label">{activity.category || 'כללי'}</p>
                <h3 className="home-card-title">{activity.title}</h3>
              </div>

              <div className="home-details-list">
                <p>
                  <strong>תאריך:</strong> {formatActivityDate(activity)}
                </p>
                <p>
                  <strong>שעה:</strong> {activity.time || 'יתעדכן בקרוב'}
                </p>
                <p>
                  <strong>מקומות פנויים:</strong>{' '}
                  {activity.availableSpots > 0 ? activity.availableSpots : 'מלא'}
                </p>
              </div>

              <button className="home-card-button" type="button" disabled={activity.availableSpots <= 0}>
                {activity.availableSpots > 0 ? 'הרשמה לפעילות' : 'הפעילות מלאה'}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ActivitiesPreview;
