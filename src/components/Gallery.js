import { Link } from 'react-router-dom';

const galleryItems = [
  { id: 1, alt: 'מפגש יצירה', src: 'https://via.placeholder.com/360x240?text=%D7%99%D7%A6%D7%99%D7%A8%D7%94' },
  { id: 2, alt: 'שיעור ריקוד', src: 'https://via.placeholder.com/360x240?text=%D7%A8%D7%99%D7%A7%D7%95%D7%93' },
  { id: 3, alt: 'הרצאת בריאות', src: 'https://via.placeholder.com/360x240?text=%D7%91%D7%A8%D7%99%D7%A0%D7%94' },
];

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

function Gallery() {
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

export default Gallery;
