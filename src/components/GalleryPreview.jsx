import React from 'react';
import { Link } from 'react-router-dom';

const sectionStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '28px',
  padding: 'clamp(24px, 4vw, 40px)',
  boxShadow: '0 18px 44px rgba(15, 34, 64, 0.09)',
  border: '1px solid #e5e7eb',
};

const demoImages = [
  { id: 'demo-gallery-1', url: 'https://picsum.photos/seed/hofman-activity-1/700/520', altText: 'פעילות קהילתית בבית הופמן' },
  { id: 'demo-gallery-2', url: 'https://picsum.photos/seed/hofman-activity-2/700/520', altText: 'סדנה יצירתית במרכז' },
  { id: 'demo-gallery-3', url: 'https://picsum.photos/seed/hofman-activity-3/700/520', altText: 'מפגש חברתי' },
  { id: 'demo-gallery-4', url: 'https://picsum.photos/seed/hofman-activity-4/700/520', altText: 'הרצאה לקהילה' },
  { id: 'demo-gallery-5', url: 'https://picsum.photos/seed/hofman-activity-5/700/520', altText: 'פעילות תרבות' },
  { id: 'demo-gallery-6', url: 'https://picsum.photos/seed/hofman-activity-6/700/520', altText: 'רגעים מהמרכז' },
];

function GalleryPreview({ images = [], loading }) {
  const visibleImages = images.length > 0 ? images : demoImages;

  return (
    <section dir="rtl" style={sectionStyle} aria-labelledby="gallery-title">
      <div
        style={{
          marginBottom: '26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 id="gallery-title" className="home-section-title">
            רגעים מהפעילויות שלנו
          </h2>
          <p className="home-section-description">
            מבט קצר על האווירה החמה, המפגשים והעשייה היומיומית במרכז.
          </p>
        </div>
        <Link className="home-small-link" to="/gallery">
          גלריה מלאה
        </Link>
      </div>

      {loading ? (
        <div className="home-state-card">טוען תמונות...</div>
      ) : (
        <div className="home-gallery-grid">
          {visibleImages.map((image) => (
            <figure className="home-gallery-item home-card-hover" key={image.id}>
              <img src={image.url} alt={image.altText || 'תמונה מהגלריה'} />
              <figcaption>{image.altText || 'תמונה מהגלריה'}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}

export default GalleryPreview;
