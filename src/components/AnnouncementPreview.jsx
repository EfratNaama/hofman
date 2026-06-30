import LogoLoader from './LogoLoader';

const sectionStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '28px',
  padding: 'clamp(24px, 4vw, 40px)',
  boxShadow: '0 18px 44px rgba(15, 34, 64, 0.09)',
  border: '1px solid #e5e7eb',
};

function AnnouncementPreview({ announcements = [], loading }) {
  if (!loading && announcements.length === 0) {
    return null;
  }

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
        <LogoLoader label="טוען הודעות..." />
      ) : (
        <div className="home-grid home-grid-announcements">
          {announcements.map((announcement) => (
            <article className="home-card home-card-hover" key={announcement.id}>
              <p className="home-card-label">
                {announcement.createdAt?.toDate
                  ? announcement.createdAt.toDate().toLocaleDateString('he-IL')
                  : 'הודעה חשובה'}
              </p>
              <h3 className="home-card-title">{announcement.title}</h3>
              <p className="home-card-text">{announcement.content || announcement.message || ''}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AnnouncementPreview;
