import React from 'react';

const sectionStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '28px',
  padding: 'clamp(24px, 4vw, 40px)',
  boxShadow: '0 18px 44px rgba(15, 34, 64, 0.09)',
  border: '1px solid #e5e7eb',
};

const demoAnnouncements = [
  {
    id: 'demo-hours',
    title: 'עדכון שעות פעילות',
    body: 'במהלך השבוע הקרוב המרכז יפעל בשעות מעודכנות. צוות הקבלה זמין לכל שאלה וסיוע.',
  },
  {
    id: 'demo-summer-trip',
    title: 'טיול קיץ לירושלים העתיקה',
    body: 'נפתחה הרשמה לטיול מודרך בירושלים העתיקה, כולל הסעה, ליווי וארוחת צהריים קלה.',
  },
  {
    id: 'demo-health-lecture',
    title: 'הרצאה מיוחדת בנושא בריאות',
    body: 'הרצאה חדשה תעסוק בהרגלי בריאות, תזונה ותנועה יומיומית בגיל השלישי.',
  },
];

function AnnouncementPreview({ announcements = [], loading }) {
  const visibleAnnouncements = announcements.length > 0 ? announcements : demoAnnouncements;

  return (
    <section dir="rtl" style={sectionStyle} aria-labelledby="announcements-title">
      <div style={{ marginBottom: '26px' }}>
        <h2 id="announcements-title" className="home-section-title">
          הודעות חשובות
        </h2>
        <p className="home-section-description">
          עדכונים חשובים מהמרכז, מרוכזים בצורה ברורה ונוחה לקריאה.
        </p>
      </div>

      {loading ? (
        <div className="home-state-card">טוען הודעות...</div>
      ) : (
        <div className="home-grid home-grid-announcements">
          {visibleAnnouncements.map((announcement) => (
            <article className="home-card home-card-hover" key={announcement.id}>
              <p className="home-card-label">
                {announcement.publishedAt?.toDate
                  ? announcement.publishedAt.toDate().toLocaleDateString('he-IL')
                  : 'עדכון מהמרכז'}
              </p>
              <h3 className="home-card-title">{announcement.title}</h3>
              <p className="home-card-text">{announcement.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AnnouncementPreview;
