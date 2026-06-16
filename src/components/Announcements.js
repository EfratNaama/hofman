import { useEffect, useState } from 'react';
import { getActiveAnnouncements } from '../services/announcementsService';

function formatAnnouncementDate(createdAt) {
  if (!createdAt?.toDate) {
    return '';
  }

  return createdAt.toDate().toLocaleDateString('he-IL');
}

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAnnouncements() {
      setIsLoading(true);
      setError('');

      try {
        const announcementsData = await getActiveAnnouncements(25);

        if (isMounted) {
          setAnnouncements(announcementsData);
        }
      } catch (err) {
        console.error('Failed to load active announcements', err);

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

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 text-right" dir="rtl">
      <div className="mb-6">
        <p className="text-lg font-bold text-slate-500">עדכונים לקהילה</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">הודעות חשובות</h1>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-lg font-semibold text-red-700">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-lg bg-white p-6 text-lg font-semibold text-slate-700 shadow-sm">
          טוען הודעות...
        </div>
      )}

      {!isLoading && !error && announcements.length === 0 && (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="text-xl font-black text-slate-900">אין הודעות חשובות כרגע</p>
        </div>
      )}

      {!isLoading && announcements.length > 0 && (
        <div className="grid gap-5">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-2xl font-black text-slate-900">{announcement.title}</h2>
                {formatAnnouncementDate(announcement.createdAt) && (
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-base font-bold text-slate-600">
                    {formatAnnouncementDate(announcement.createdAt)}
                  </span>
                )}
              </div>
              <p className="mt-4 whitespace-pre-wrap text-lg leading-8 text-slate-700">
                {announcement.message}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Announcements;
