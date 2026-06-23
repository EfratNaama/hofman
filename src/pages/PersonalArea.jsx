import { useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import PersonalCalendar from '../components/PersonalCalendar';
import { getUserAllRegistrations } from '../services/activityRegistrationsService';
import { db } from '../firebase';
import {
  generateActivityOccurrences,
  getActivityType,
  toDate,
} from '../utils/activityDateUtils';

const cardStyle = {
  padding: '20px',
  borderRadius: '12px',
  backgroundColor: '#fff',
  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
};

const sectionStyle = {
  marginBottom: '40px',
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        console.log('currentUser.uid', currentUserUid);
        const registrationData = await getUserAllRegistrations(currentUserUid);
        const userSnap = await getDoc(doc(db, 'users', currentUserUid));
        const profileData = userSnap.exists()
          ? { id: userSnap.id, ...userSnap.data() }
          : null;
        const firestorePhoto = profileData?.photoURL || '';
        console.log('user document exists', userSnap.exists());
        console.log('Loaded saved photo:', firestorePhoto?.slice(0, 30));
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

  const profileName = getProfileName(profile, currentUser);
  const profileEmail = getProfileEmail(profile, currentUser);
  const explicitProfileName = profile?.fullName || profile?.displayName || currentUser?.displayName || '';
  const profileInitials = getInitials(explicitProfileName, profileEmail);
  const greetingText = explicitProfileName ? `שלום, ${profileName}` : 'שלום';

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
      console.log('Saving profile photo for uid:', currentUser.uid);
      console.log('Base64 starts with:', base64.slice(0, 30));
      const userRef = doc(db, 'users', currentUser.uid);

      await setDoc(userRef, {
        photoURL: base64,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setProfilePhoto(base64);
      console.log('photoURL saved to Firestore');
      const savedSnap = await getDoc(userRef);
      const savedProfile = savedSnap.exists()
        ? { id: savedSnap.id, ...savedSnap.data() }
        : null;
      const savedPhoto = savedProfile?.photoURL || base64;
      console.log('Loaded saved photo:', savedPhoto?.slice(0, 30));
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

  const nextActivity = useMemo(() => {
    const now = new Date();
    return [...activityEvents]
      .filter((event) => event.start >= now)
      .sort((first, second) => first.start - second.start)[0] || null;
  }, [activityEvents]);

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
      <style>{`
        .personal-area {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px;
        }

        .personal-area__profile-card {
          display: flex;
          align-items: center;
          gap: 22px;
          margin-bottom: 28px;
          padding: 22px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
        }

        .personal-area__avatar-wrap {
          position: relative;
          width: 112px;
          height: 112px;
          flex: 0 0 auto;
        }

        .personal-area__avatar {
          display: grid;
          width: 112px;
          height: 112px;
          place-items: center;
          overflow: hidden;
          border: 3px solid #fff;
          border-radius: 999px;
          background: linear-gradient(135deg, #0f766e, #2563eb);
          box-shadow: 0 6px 20px rgba(15, 34, 64, 0.18);
          color: #fff;
          font-size: 34px;
          font-weight: 900;
        }

        .personal-area__avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .personal-area__camera-button {
          position: absolute;
          inset-inline-end: 2px;
          bottom: 3px;
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          border: 2px solid #fff;
          border-radius: 999px;
          background: #0f2240;
          color: #fff;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(15, 34, 64, 0.2);
        }

        .personal-area__camera-button:disabled {
          cursor: not-allowed;
          background: #94a3b8;
        }

        .personal-area__profile-content {
          min-width: 0;
        }

        .personal-area__profile-content h2 {
          margin: 0;
          color: #1a1a2e;
          font-size: 28px;
          font-weight: 900;
        }

        .personal-area__profile-content p {
          margin: 6px 0 0;
          color: #475569;
          font-weight: 700;
        }

        .personal-area__upload-status {
          margin-top: 12px;
          font-weight: 800;
        }

        .personal-area__upload-status--error {
          color: #b91c1c;
        }

        .personal-area__upload-status--success {
          color: #15803d;
        }

        .personal-area__payment-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        @media (max-width: 768px) {
          .personal-area {
            padding: 24px 16px;
          }

          .personal-area__profile-card {
            align-items: flex-start;
            flex-direction: column;
          }

          .personal-area__payment-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header style={{ ...sectionStyle, borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#1a1a2e', fontSize: '32px', fontWeight: 900 }}>
          אזור אישי
        </h1>
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
          <p>{greetingText}</p>
          <h2>{profileName}</h2>
          {profileEmail && <p>{profileEmail}</p>}
          <button
            style={{
              marginTop: '14px',
              padding: '10px 16px',
              border: 0,
              borderRadius: '10px',
              backgroundColor: '#0f2240',
              color: '#fff',
              cursor: isUploadingPhoto ? 'not-allowed' : 'pointer',
              fontWeight: 900,
            }}
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
        <div
          role="alert"
          style={{
            ...cardStyle,
            marginBottom: '24px',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            fontWeight: 800,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ ...cardStyle, color: '#475569', fontWeight: 800 }}>
          טוען את האזור האישי...
        </div>
      ) : (
        <>
          <section style={sectionStyle}>
            <h2 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '24px' }}>
              הלוח האישי שלי
            </h2>

            <div style={{ ...cardStyle, marginBottom: '20px', borderInlineStart: '4px solid #008080' }}>
              <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>הפעילות הקרובה</p>
              {nextActivity ? (
                <>
                  <h3 style={{ margin: '8px 0 0', color: '#1a1a2e', fontSize: '22px' }}>
                    {nextActivity.title}
                  </h3>
                  <p style={{ margin: '7px 0 0', color: '#475569' }}>
                    {formatDate(nextActivity.start)}
                  </p>
                </>
              ) : (
                <p style={{ margin: '8px 0 0', color: '#64748b' }}>
                  אין פעילויות רשומות
                </p>
              )}
            </div>

            {!activityEvents.length && (
              <div style={{ ...cardStyle, color: '#64748b', textAlign: 'center', fontWeight: 800 }}>
                אין פעילויות רשומות
              </div>
            )}
            <div style={{ marginTop: activityEvents.length ? 0 : '20px' }}>
              <PersonalCalendar activityEvents={activityEvents} />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '24px' }}>
              סיכום תשלומים חודשי
            </h2>

            {currentMonthPaidActivities.length ? (
              <div className="personal-area__payment-grid">
                <div style={{ ...cardStyle, borderInlineStart: '4px solid #008080' }}>
                  <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>
                    סה״כ לתשלום החודש
                  </p>
                  <p style={{ margin: '8px 0 0', color: '#008080', fontSize: '32px', fontWeight: 900 }}>
                    {formatPrice(monthlyTotal)}
                  </p>
                </div>

                <div style={{ ...cardStyle, borderInlineStart: '4px solid #5B6FE6' }}>
                  <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>
                    מספר פעילויות בתשלום
                  </p>
                  <p style={{ margin: '8px 0 0', color: '#5B6FE6', fontSize: '32px', fontWeight: 900 }}>
                    {currentMonthPaidActivities.length}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ ...cardStyle, color: '#64748b', textAlign: 'center', fontWeight: 800 }}>
                לא נמצאו תשלומים לחודש הנוכחי
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default PersonalArea;
