import { useEffect, useState } from 'react';
import {
  getUpcomingActivities,
  getLatestAnnouncements,
  getLatestGalleryImages,
  getCenterInfo,
} from '../services/homeService';

export default function useHomeData() {
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [centerInfo, setCenterInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadHomeData() {
      setLoading(true);
      try {
        const [nextActivities, latestAnnouncements, gallery, info] = await Promise.all([
          getUpcomingActivities(),
          getLatestAnnouncements(),
          getLatestGalleryImages(),
          getCenterInfo(),
        ]);

        if (!active) return;
        setActivities(nextActivities);
        setAnnouncements(latestAnnouncements);
        setGalleryImages(gallery);
        setCenterInfo(info);
      } catch (fetchError) {
        if (!active) return;
        setError('לא ניתן לטעון את תוכן הבית ברגע זה. נסה שוב מאוחר יותר.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHomeData();
    return () => {
      active = false;
    };
  }, []);

  return { activities, announcements, galleryImages, centerInfo, loading, error };
}
