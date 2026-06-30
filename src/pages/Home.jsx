import React from 'react';
import { Link } from 'react-router-dom';
import FooterSection from '../components/FooterSection';
import { useAuth } from '../context/AuthContext';
import useHomeData from '../hooks/useHomeData';
import { useActivities } from '../hooks/useActivities';
import useGallery from '../hooks/useGallery';
import aboutHofmanImage from '../assets/about-hofman.png';
import beitHoffmanHeroImage from '../logo/BeitHoffman.png';
import partnerLogo60Plus from '../logo/60+.png';
import partnerLogoGonenim from '../logo/gonenim.jpg';
import partnerLogoJerusalemMunicipality from '../logo/Jerusalem Municipality.png';
import partnerLogoMarom from '../logo/marom.png';
import partnerLogoMatnasim from '../logo/matnasim.png';
import partnerLogoJerusalemFoundation from '../logo/The Jerusalem Foundation.png';
import './Home.css';

const partnerLogos = [
  { src: partnerLogo60Plus, alt: 'לוגו 60+' },
  { src: partnerLogoGonenim, alt: 'לוגו גוננים' },
  { src: partnerLogoJerusalemMunicipality, alt: 'לוגו עיריית ירושלים' },
  { src: partnerLogoMarom, alt: 'לוגו מרום' },
  { src: partnerLogoMatnasim, alt: 'לוגו מתנ"סים' },
  { src: partnerLogoJerusalemFoundation, alt: 'לוגו קרן ירושלים' },
];

const homeFeatureItems = [
  {
    icon: 'users',
    color: '#8C9787',
    title: 'קהילה חמה',
    description: 'אנשים, שייכות וחברות',
  },
  {
    icon: 'leaf',
    color: '#B88767',
    title: 'מגוון פעילויות',
    description: 'חוגים, סדנאות, הרצאות ועוד',
  },
  {
    icon: 'heart',
    color: '#D8C0A3',
    title: 'התנדבות',
    description: 'עושים טוב ומשפיעים',
  },
  {
    icon: 'calendar',
    color: '#A84F3D',
    title: 'אירועים',
    description: 'מפגשים, טיולים וחגיגות',
  },
  {
    icon: 'care',
    color: '#C89B87',
    title: 'תמיכה והכלה',
    description: 'מענה אישי לכל צורך',
  },
];

const featuredActivityItems = [
  {
    title: 'יצירה ואומנות',
    description: 'חוגי ציור, פיסול ועבודת יצירה',
    mediaClass: 'art',
  },
  {
    title: 'אפייה ובישול',
    description: 'סדנאות אפייה, בישול ביתי ועוד',
    mediaClass: 'cooking',
  },
  {
    title: 'משחקי חשיבה',
    description: 'משחקי קופסה, שחמט וברידג׳',
    mediaClass: 'games',
  },
  {
    title: 'פעילות גופנית',
    description: 'יוגה, התעמלות, פילאטיס ועוד',
    mediaClass: 'movement',
  },
  {
    title: 'מוזיקה ושירה',
    description: 'חוגי נגינה, שירה ומפגשי מוזיקה',
    mediaClass: 'music',
  },
  {
    title: 'הרצאות והעשרה',
    description: 'מגוון הרצאות בתחומי ידע שונים',
    mediaClass: 'lecture',
  },
];

const FEATURED_ACTIVITIES_LIMIT = featuredActivityItems.length;
const HOME_GALLERY_LIMIT = 6;

function getActivityImageUrl(activity) {
  return activity.imageUrl || activity.image || '';
}

function getActivityTitle(activity) {
  return activity.title || activity.name || 'פעילות ללא כותרת';
}

function getActivityDescription(activity) {
  return activity.description || activity.location || 'פרטים נוספים יפורסמו בקרוב.';
}

function getGalleryImageSource(image) {
  return image.imageBase64 || image.imageUrl || image.url || '';
}

function FeatureIcon({ type }) {
  const iconProps = {
    className: 'home-feature-item__svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  if (type === 'users') {
    return (
      <svg {...iconProps}>
        <path d="M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 20v-2a4 4 0 0 0-3-3.87" />
        <path d="M16.5 3.4a4 4 0 0 1 0 7.2" />
      </svg>
    );
  }

  if (type === 'leaf') {
    return (
      <svg {...iconProps}>
        <path d="M5 21c.5-6.5 4.4-10.5 11.5-12.5" />
        <path d="M19 3c-8.8.4-14 5-14 12.5C5 18.5 7.5 21 10.5 21 18 21 21 12.5 19 3Z" />
      </svg>
    );
  }

  if (type === 'heart') {
    return (
      <svg {...iconProps}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    );
  }

  if (type === 'calendar') {
    return (
      <svg {...iconProps}>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
      </svg>
    );
  }

  return (
    <svg {...iconProps}>
      <path d="M12 20s-4.9-3-6.8-5.9C4 12.2 4.8 9.8 7 9.8c1.2 0 2.3.7 3 1.8.7-1.1 1.8-1.8 3-1.8 2.2 0 3 2.4 1.8 4.3C12.9 17 12 20 12 20Z" />
      <path d="M4.5 13.8 3.3 12.4a2 2 0 0 0-2.1-.6" />
      <path d="M19.5 13.8l1.2-1.4a2 2 0 0 1 2.1-.6" />
      <path d="M7.2 19.4H5a3 3 0 0 1-2.5-1.4L1.3 16" />
      <path d="M16.8 19.4H19a3 3 0 0 0 2.5-1.4l1.2-2" />
    </svg>
  );
}

function Home() {
  const { authLoading, currentUser, isAdmin } = useAuth();
  const { centerInfo, loading } = useHomeData();
  const {
    activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useActivities();
  const { images: galleryImages, loading: galleryLoading } = useGallery();
  const featuredActivities = activities.slice(0, FEATURED_ACTIVITIES_LIMIT);
  const homeGalleryImages = galleryLoading
    ? []
    : galleryImages.filter(getGalleryImageSource).slice(0, HOME_GALLERY_LIMIT);
  const showAdminHeroButton = !authLoading && currentUser && isAdmin;
  const heroAccountLink = showAdminHeroButton ? '/admin-dashboard' : currentUser ? '/personal-area' : '/login';
  const heroAccountText = showAdminHeroButton ? 'לוח בקרה' : 'אזור אישי';
  const homeFeaturedActivityItems = activitiesLoading
    ? [
        {
          id: 'activities-loading',
          title: 'טוען פעילויות...',
          description: 'הפעילויות מתעדכנות מהמערכת.',
          mediaClass: 'art',
        },
      ]
    : activitiesError
      ? [
          {
            id: 'activities-error',
            title: 'לא ניתן לטעון פעילויות כרגע',
            description: 'נסו שוב מאוחר יותר.',
            mediaClass: 'art',
          },
        ]
      : featuredActivities.length === 0
        ? [
            {
              id: 'activities-empty',
              title: 'אין פעילויות להצגה כרגע',
              description: 'פעילויות חדשות יופיעו כאן לאחר שיעודכנו במערכת.',
              mediaClass: 'art',
            },
          ]
        : featuredActivities.map((activity, index) => ({
            id: activity.id,
            title: getActivityTitle(activity),
            description: getActivityDescription(activity),
            imageUrl: getActivityImageUrl(activity),
            mediaClass: featuredActivityItems[index % FEATURED_ACTIVITIES_LIMIT].mediaClass,
          }));

  const scrollToContactInfo = (event) => {
    event.preventDefault();
    document.getElementById('contact-info')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      <section
        className="home-public-hero"
        aria-labelledby="home-public-title"
        style={{ '--home-hero-image': `url(${beitHoffmanHeroImage})` }}
      >
        <div className="home-public-hero__inner">
          <h1 id="home-public-title">בית הופמן</h1>
          <p>בית צעיר למבוגרים</p>
          <div className="home-public-hero__actions">
            <a className="home-cta home-cta-primary" href="#contact-info" onClick={scrollToContactInfo}>
              לפרטים נוספים
            </a>
            <Link className="home-cta home-cta-secondary" to={heroAccountLink}>
              {heroAccountText}
            </Link>
          </div>
        </div>
        <svg
          className="home-public-hero__wave"
          viewBox="0 0 1440 130"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 52L60 60.7C120 69 240 87 360 82.3C480 78 600 52 720 39C840 26 960 26 1080 45.5C1200 65 1320 104 1380 123.5L1440 143V130H0V52Z" />
        </svg>
      </section>

      <section className="home-features-strip" aria-label="מאפייני בית הופמן">
        <div className="home-features-strip__inner">
          {homeFeatureItems.map((item) => (
            <article className="home-feature-item" key={item.title}>
              <span
                className="home-feature-item__icon"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              >
                <FeatureIcon type={item.icon} />
              </span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-partners" aria-labelledby="home-partners-title">
        <div className="home-partners__inner">
          <h2 id="home-partners-title">השותפים שלנו</h2>
          <div className="home-partners__grid">
            {partnerLogos.map((partner) => (
              <div className="home-partners__card" key={partner.alt}>
                <img src={partner.src} alt={partner.alt} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about-hofman" className="home-public-about" aria-labelledby="home-public-about-title">
        <div className="home-public-about__inner">
          <div className="home-public-about__image-wrap">
            <img
              src={aboutHofmanImage}
              alt="משתתפות בבית הופמן יושבות יחד סביב שולחן באווירה חמה"
              className="home-public-about__image"
            />
          </div>
          <div className="home-public-about__content">
          <h2 id="home-public-about-title">אודות בית הופמן</h2>
          <p>
            בית הופמן הוא מרכז קהילתי חם ומקצועי לבני ובנות הגיל השלישי בירושלים. המרכז מציע מרחב מזמין לפעילויות חברתיות, הרצאות, סדנאות יצירה, מפגשי תרבות ותמיכה קהילתית באווירה מכבדת ונגישה.
          </p>
          <p>
            הצוות שלנו פועל כדי שכל מבקר ומבקרת ירגישו בבית, ימצאו עניין, קשר אנושי ותוכן איכותי המתאים לקצב ולצרכים שלהם.
          </p>
          </div>
        </div>
      </section>

      <section className="home-featured-activities" aria-labelledby="home-featured-activities-title">
        <div className="home-featured-activities__inner">
          <h2 id="home-featured-activities-title">פעילויות נבחרות</h2>
          <div className="home-featured-activities__grid">
            {homeFeaturedActivityItems.map((activity) => (
              <article className="home-featured-activity-card" key={activity.id}>
                <div
                  className={`home-featured-activity-card__media home-featured-activity-card__media--${activity.mediaClass}`}
                  style={
                    activity.imageUrl
                      ? {
                          backgroundImage: `url(${activity.imageUrl})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                        }
                      : undefined
                  }
                  role="img"
                  aria-label={`תמונה עבור ${activity.title}`}
                />
                <div className="home-featured-activity-card__body">
                  <h3>{activity.title}</h3>
                  <p>{activity.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {homeGalleryImages.length > 0 && (
        <section className="home-featured-activities" aria-label="תמונות מהגלריה">
          <div className="home-featured-activities__inner">
            <h2 id="home-gallery-title">תמונות מהגלריה</h2>
            <div className="home-featured-activities__grid">
              {homeGalleryImages.map((image) => (
                <article
                  className="home-featured-activity-card"
                  key={image.id}
                  style={{
                    flex: '0 0 320px',
                    width: '320px',
                    maxWidth: '320px',
                    minHeight: 0,
                    aspectRatio: '4 / 3',
                    background: 'rgba(255, 255, 255, 0.55)',
                  }}
                >
                  <img
                    src={getGalleryImageSource(image)}
                    alt={image.caption || 'Gallery image'}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '40px' }}>
        <FooterSection centerInfo={centerInfo} loading={loading} />
      </div>
    </main>
  );
}

export default Home;
