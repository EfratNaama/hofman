import { useEffect, useState } from 'react';
import {
  getUpcomingActivities,
  getLatestAnnouncements,
  getCenterInfo,
} from '../services/homeService';
import { subscribeLatestGalleryImages } from '../services/galleryService';

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
        const [nextActivities, latestAnnouncements, info] = await Promise.all([
          getUpcomingActivities(),
          getLatestAnnouncements(),
          getCenterInfo(),
        ]);

        if (!active) return;
        setActivities(nextActivities);
        setAnnouncements(latestAnnouncements);
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

  useEffect(() => {
    const unsubscribe = subscribeLatestGalleryImages(
      (gallery) => {
        setGalleryImages(gallery);
      },
      (galleryError) => {
        console.error('Failed to load home gallery images', galleryError);
        setError('לא ניתן לטעון את תוכן הבית ברגע זה. נסה שוב מאוחר יותר.');
      },
      4
    );

    return unsubscribe;
  }, []);

  return { activities, announcements, galleryImages, centerInfo, loading, error };
}
