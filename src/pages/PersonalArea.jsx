import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import PersonalCalendar from '../components/PersonalCalendar';
import { getUserAllRegistrations } from '../services/activityRegistrationsService';
import { getAnnouncements } from '../services/announcementService';
import { db } from '../firebase';
import {
  generateActivityOccurrences,
  getActivityType,
  toDate,
} from '../utils/activityDateUtils';
import './PersonalArea.css';

const allowedImageTypes = ['image/png', 'image/jpeg', 'image/webp'];
const maxProfileImageSize = 500 * 1024;

const getProfileName = (profile, currentUser) => (
  profile?.fullName ||
  profile?.displayName ||
  currentUser?.displayName ||
  currentUser?.email?.split('@')[0] ||
  'משתמש'
);

const getProfileEmail = (profile, currentUser) => (
  profile?.email || currentUser?.email || ''
);

const getInitials = (name, email) => {
  const source = name || email?.split('@')[0] || '';
  const parts = String(source)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'מ';

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const readFileAsDataUrl = (file) => (
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  })
);

const applyActivityTime = (date, activity, registration) => {
  const start = new Date(date);
  const time = activity?.time || registration?.time;
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      start.setHours(hours, minutes, 0, 0);
    }
  }

  return start;
};

const getActivityEnd = (activity, start) => {
  if (activity?.endTime) {
    const explicitEnd = toDate(activity.endTime);
    if (explicitEnd) return explicitEnd;

    if (typeof activity.endTime === 'string' && activity.endTime.includes(':')) {
      const [hours, minutes] = activity.endTime.split(':').map(Number);
      if (Number.isFinite(hours) && Number.isFinite(minutes)) {
        const end = new Date(start);
        end.setHours(hours, minutes, 0, 0);
        return end;
      }
    }
  }

  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return end;
};

const formatDate = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString('he-IL') : 'תאריך לא זמין';
};

const formatTime = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '';
};

const formatAnnouncementDate = (createdAt) => (
  createdAt?.toDate ? createdAt.toDate().toLocaleDateString('he-IL') : ''
);

const formatPrice = (value) =>
  new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function PersonalArea() {
  const { currentUser } = useAuth();
  const currentUserUid = currentUser?.uid;
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [error, setError] = useState('');
  const [announcementsError, setAnnouncementsError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPersonalArea() {
      if (!currentUserUid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const registrationData = await getUserAllRegistrations(currentUserUid);
        const userSnap = await getDoc(doc(db, 'users', currentUserUid));
        const profileData = userSnap.exists()
          ? { id: userSnap.id, ...userSnap.data() }
          : null;
        const firestorePhoto = profileData?.photoURL || '';

        if (isMounted) {
          setRegistrations(registrationData);
          setProfile(profileData);
          setProfilePhoto(firestorePhoto || '');
        }
      } catch (loadError) {
        console.error('Failed to load personal area:', loadError);
        if (isMounted) {
          setError('לא ניתן לטעון את האזור האישי כרגע.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPersonalArea();

    return () => {
      isMounted = false;
    };
  }, [currentUserUid]);

  useEffect(() => {
    let isMounted = true;

    async function loadAnnouncementsPreview() {
      setAnnouncementsLoading(true);
      setAnnouncementsError('');

      try {
        const announcementsData = await getAnnouncements();

        if (isMounted) {
          setAnnouncements(
            announcementsData
              .filter((announcement) => announcement.isActive !== false)
              .slice(0, 3)
          );
        }
      } catch (loadError) {
        console.error('Failed to load announcements preview:', loadError);
        if (isMounted) {
          setAnnouncementsError('לא ניתן לטעון את ההודעות כרגע.');
        }
      } finally {
        if (isMounted) setAnnouncementsLoading(false);
      }
    }

    loadAnnouncementsPreview();

    return () => {
      isMounted = false;
    };
  }, []);

  const profileName = getProfileName(profile, currentUser);
  const profileEmail = getProfileEmail(profile, currentUser);
  const explicitProfileName = profile?.fullName || profile?.displayName || currentUser?.displayName || '';
  const profileInitials = getInitials(explicitProfileName, profileEmail);

  const handlePhotoButtonClick = () => {
    setUploadError('');
    setUploadMessage('');
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !currentUser) return;

    setUploadError('');
    setUploadMessage('');

    if (!allowedImageTypes.includes(file.type)) {
      setUploadError('ניתן להעלות קובץ תמונה בלבד');
      return;
    }

    if (file.size > maxProfileImageSize) {
      setUploadError('גודל התמונה גדול מדי. ניתן להעלות תמונה עד 500KB');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const base64 = await readFileAsDataUrl(file);
      const userRef = doc(db, 'users', currentUser.uid);

      await setDoc(userRef, {
        photoURL: base64,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const savedSnap = await getDoc(userRef);
      const savedProfile = savedSnap.exists()
        ? { id: savedSnap.id, ...savedSnap.data() }
        : null;
      const savedPhoto = savedProfile?.photoURL || base64;

      setProfile(savedProfile || {
        id: currentUser.uid,
        email: profileEmail || currentUser.email || '',
        fullName: explicitProfileName || profileName,
        photoURL: base64,
      });
      setProfilePhoto(savedPhoto || '');
      setUploadMessage('תמונת הפרופיל עודכנה בהצלחה');
    } catch (photoError) {
      console.error('Failed to update profile photo:', photoError);
      setUploadError('לא ניתן לעדכן את תמונת הפרופיל כרגע');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const activityEvents = useMemo(() => (
    registrations
      .flatMap(({ registration, activity }) => {
        const sourceActivity = activity || {
          type: 'חד פעמי',
          date: registration.date,
          activityDate: registration.activityDate,
        };
        const occurrences = generateActivityOccurrences(sourceActivity);

        return occurrences.map((occurrenceDate, index) => {
          const start = applyActivityTime(occurrenceDate, activity, registration);
          return {
            id: `${registration.id}-${index}`,
            registrationId: registration.id,
            activityId: activity?.id || registration.activityId,
            title: activity?.title || registration.activityTitle || 'פעילות',
            start,
            end: getActivityEnd(activity, start),
            type: 'activity',
            activityType: getActivityType(sourceActivity),
            allDay: false,
          };
        });
      })
  ), [registrations]);

  const upcomingActivities = useMemo(() => {
    const now = new Date();
    return [...activityEvents]
      .filter((event) => event.start >= now)
      .sort((first, second) => first.start - second.start)
      .slice(0, 4);
  }, [activityEvents]);

  const nextActivity = upcomingActivities[0] || null;

  const currentMonthPaidActivities = useMemo(() => {
    const now = new Date();

    return registrations.filter(({ registration, activity }) => {
      const registeredAt = toDate(registration.registeredAt);
      const paymentRequired = Boolean(
        activity?.paymentRequired ?? activity?.requiresPayment
      );

      return (
        paymentRequired &&
        registeredAt &&
        registeredAt.getMonth() === now.getMonth() &&
        registeredAt.getFullYear() === now.getFullYear()
      );
    });
  }, [registrations]);

  const monthlyTotal = currentMonthPaidActivities.reduce(
    (total, { activity }) => total + Number(activity?.price ?? activity?.cost ?? 0),
    0
  );

  return (
    <main className="personal-area" dir="rtl">
      <header className="personal-area__header">
        <div>
          <p>שלום</p>
          <h1>אזור אישי</h1>
        </div>
      </header>

      <section className="personal-area__profile-card" aria-label="פרופיל משתמש">
        <div className="personal-area__avatar-wrap">
          <div className="personal-area__avatar">
            {profilePhoto ? (
              <img alt={profileName} src={profilePhoto} />
            ) : (
              <span>{profileInitials}</span>
            )}
          </div>
          <button
            aria-label="עדכון תמונת פרופיל"
            className="personal-area__camera-button"
            disabled={isUploadingPhoto}
            type="button"
            onClick={handlePhotoButtonClick}
          >
            <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
              <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.3-2h5.4L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M12 15.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp"
            hidden
            type="file"
            onChange={handlePhotoChange}
          />
        </div>

        <div className="personal-area__profile-content">
          <p>ברוכים הבאים</p>
          <h2>{profileName}</h2>
          {profileEmail && <p>{profileEmail}</p>}
          <button
            className="personal-area__profile-action"
            type="button"
            disabled={isUploadingPhoto}
            onClick={handlePhotoButtonClick}
          >
            {isUploadingPhoto ? 'מעלה תמונה...' : 'שינוי תמונה'}
          </button>
          {isUploadingPhoto && (
            <p className="personal-area__upload-status">מעלה תמונה...</p>
          )}
          {uploadError && (
            <p className="personal-area__upload-status personal-area__upload-status--error">
              {uploadError}
            </p>
          )}
          {uploadMessage && (
            <p className="personal-area__upload-status personal-area__upload-status--success">
              {uploadMessage}
            </p>
          )}
        </div>
      </section>

      {error && (
        <div className="personal-area__state personal-area__state--error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="personal-area__state">טוען את האזור האישי...</div>
      ) : (
        <>
          <section className="personal-area__dashboard" aria-label="לוח אישי והודעות">
            <div className="personal-area__panel personal-area__panel--calendar">
              <div className="personal-area__panel-header">
                <div>
                  <p>הלוח שלי</p>
                  <h2>הלו"ז האישי</h2>
                </div>
                {nextActivity && (
                  <span className="personal-area__next-pill">
                    הפעילות הקרובה: {formatDate(nextActivity.start)}
                  </span>
                )}
              </div>

              {!activityEvents.length && (
                <div className="personal-area__empty-state">אין פעילויות רשומות כרגע.</div>
              )}

              <PersonalCalendar activityEvents={activityEvents} />
            </div>

            <aside className="personal-area__sidebar" aria-label="עדכונים אישיים">
              <section className="personal-area__panel personal-area__panel--messages">
                <div className="personal-area__panel-header">
                  <div>
                    <p>עדכונים</p>
                    <h2>הודעות</h2>
                  </div>
                </div>

                {announcementsError && (
                  <div className="personal-area__inline-state personal-area__inline-state--error">
                    {announcementsError}
                  </div>
                )}

                {announcementsLoading && (
                  <div className="personal-area__inline-state">טוען הודעות...</div>
                )}

                {!announcementsLoading && !announcementsError && announcements.length === 0 && (
                  <div className="personal-area__inline-state">
                    אין הודעות חדשות כרגע.
                  </div>
                )}

                {!announcementsLoading && announcements.length > 0 && (
                  <div className="personal-area__message-list">
                    {announcements.map((announcement) => (
                      <article className="personal-area__message-item" key={announcement.id}>
                        <div>
                          <h3>{announcement.title}</h3>
                          {formatAnnouncementDate(announcement.createdAt) && (
                            <span>{formatAnnouncementDate(announcement.createdAt)}</span>
                          )}
                        </div>
                        <p>{announcement.content || announcement.message || ''}</p>
                      </article>
                    ))}
                  </div>
                )}

                <Link className="personal-area__soft-link" to="/announcements">
                  כל ההודעות
                </Link>
              </section>

              <section className="personal-area__panel personal-area__panel--activities">
                <div className="personal-area__panel-header">
                  <div>
                    <p>הפעילויות שלי</p>
                    <h2>פעילויות קרובות</h2>
                  </div>
                </div>

                {upcomingActivities.length ? (
                  <div className="personal-area__activity-list">
                    {upcomingActivities.map((activity) => (
                      <article className="personal-area__activity-item" key={activity.id}>
                        <div>
                          <h3>{activity.title}</h3>
                          <p>
                            {formatDate(activity.start)}
                            {formatTime(activity.start) ? ` · ${formatTime(activity.start)}` : ''}
                          </p>
                        </div>
                        {activity.activityId && (
                          <Link to={`/activities/${activity.activityId}`}>פרטים נוספים</Link>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="personal-area__inline-state">
                    אין פעילויות קרובות כרגע.
                  </div>
                )}
              </section>
            </aside>
          </section>

          <section className="personal-area__panel personal-area__payments" aria-label="סיכום תשלומים חודשי">
            <div className="personal-area__panel-header">
              <div>
                <p>תשלומים</p>
                <h2>סיכום תשלומים חודשי</h2>
              </div>
            </div>

            {currentMonthPaidActivities.length ? (
              <div className="personal-area__payment-grid">
                <div className="personal-area__metric-card">
                  <p>סה"כ לתשלום החודש</p>
                  <strong>{formatPrice(monthlyTotal)}</strong>
                </div>

                <div className="personal-area__metric-card personal-area__metric-card--accent">
                  <p>מספר פעילויות בתשלום</p>
                  <strong>{currentMonthPaidActivities.length}</strong>
                </div>
              </div>
            ) : (
              <div className="personal-area__inline-state">
                לא נמצאו תשלומים לחודש הנוכחי.
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default PersonalArea;
