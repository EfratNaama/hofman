import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAnnouncements, markAnnouncementsRead } from '../services/announcementService';
import './Announcements.css';

function formatAnnouncementDate(createdAt) {
  if (!createdAt?.toDate) {
    return '';
  }

  return createdAt.toDate().toLocaleDateString('he-IL');
}

function Announcements() {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAnnouncements() {
      setIsLoading(true);
      setError('');

      try {
        const announcementsData = await getAnnouncements();

        if (isMounted) {
          setAnnouncements(
            announcementsData
              .filter((announcement) => announcement.isActive !== false)
              .slice(0, 25)
          );
        }
      } catch (err) {
        console.error('Firestore "announcements" query failed while loading user announcements:', err);

        if (isMounted) {
          setError('לא ניתן לטעון את ההודעות כרגע.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.uid || isLoading || error || !announcements.length) return;

    markAnnouncementsRead(
      currentUser.uid,
      announcements.map((announcement) => announcement.id)
    ).catch((err) => {
      console.error('Firestore "users" document write failed while marking announcements as read:', err);
    });
  }, [announcements, currentUser?.uid, error, isLoading]);

  return (
    <section className="user-announcements-page" dir="rtl">
      <div className="user-announcements-header">
        <p>עדכונים לקהילה</p>
        <h1>הודעות חשובות</h1>
      </div>

      {error && (
        <div className="user-announcements-state user-announcements-state--error">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="user-announcements-state">
          טוען הודעות...
        </div>
      )}

      {!isLoading && !error && announcements.length === 0 && (
        <div className="user-announcements-state user-announcements-state--empty">
          <p>אין הודעות חשובות כרגע</p>
        </div>
      )}

      {!isLoading && announcements.length > 0 && (
        <div className="user-announcements-list">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="user-announcement-card">
              <div className="user-announcement-card__header">
                <h2>{announcement.title}</h2>
                {formatAnnouncementDate(announcement.createdAt) && (
                  <span className="user-announcement-card__date">
                    {formatAnnouncementDate(announcement.createdAt)}
                  </span>
                )}
              </div>
              <p className="user-announcement-card__content">
                {announcement.content || announcement.message || ''}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Announcements;
