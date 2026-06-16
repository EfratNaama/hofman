import React from 'react';
import HeroSection from '../components/HeroSection';
import ActivitiesPreview from '../components/ActivitiesPreview';
import AnnouncementPreview from '../components/AnnouncementPreview';
import GalleryPreview from '../components/GalleryPreview';
import AboutSection from '../components/AboutSection';
import FooterSection from '../components/FooterSection';
import useHomeData from '../hooks/useHomeData';

function Home() {
  const { activities, announcements, galleryImages, centerInfo, loading, error } = useHomeData();

  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8f5f0',
        color: '#0f2240',
        padding: '24px 20px 56px',
      }}
    >
      <HeroSection />

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '40px' }}>
        {error && (
          <div
            role="status"
            style={{
              padding: '18px 22px',
              borderRadius: '20px',
              border: '1px solid #fecaca',
              backgroundColor: '#fff1f2',
              color: '#991b1b',
              fontSize: '1.1rem',
              lineHeight: 1.7,
            }}
          >
            לא ניתן היה לטעון נתונים עדכניים כרגע, ולכן מוצגים נתוני הדגמה להצגה.
          </div>
        )}

        <ActivitiesPreview activities={activities} loading={loading} />
        <AnnouncementPreview announcements={announcements} loading={loading} />
        <GalleryPreview images={galleryImages} loading={loading} />
        <AboutSection />
        <FooterSection centerInfo={centerInfo} loading={loading} />
      </div>
    </main>
  );
}

export default Home;
