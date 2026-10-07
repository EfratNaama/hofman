const ADDRESS = 'אליעזר הגדול 4, ירושלים';
const MAIN_PHONE = { display: '02-6788848', tel: '026788848' };
const WAZE_URL = `https://waze.com/ul?q=${encodeURIComponent('בית הופמן אליעזר הגדול 4 ירושלים')}&navigate=yes`;
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('בית הופמן, אליעזר הגדול 4, ירושלים')}`;

const CONTACT_PEOPLE = [
  {
    name: 'סיון עץ הדר',
    role: 'מנהלת בית הופמן',
    phone: '050-3082593',
    tel: '0503082593',
    avatarBg: '#dce8e4',
    avatarFg: '#2c4d44',
  },
  {
    name: 'שרה שירן',
    role: 'רכזת גיל שלישי ומזכירה',
    phone: '050-4483859',
    tel: '0504483859',
avatarBg: '#dce8e4',
avatarFg: '#2c4d44',  },
];

/*
 * All styles for this section live here, scoped under .hc, so it can be
 * redesigned without touching Home.css. Sizes are in rem so the site's
 * accessibility font scale still applies.
 */
const SECTION_STYLES = `
.hc * { font-size: inherit; box-sizing: border-box; }
.hc {
  --hc-ink: #2b211c;
  --hc-ink-soft: #4a3b33;
  --hc-muted: #6b5a50;
  --hc-label: #7a665b;
  --hc-band: #f2e8e1;
  --hc-band-line: #e8d9ce;
  --hc-divider: #e2d2c7;
  --hc-chip: #e7d3c8;
  --hc-chip-ink: #8a4f40;
  --hc-card-line: #ebe2d8;
  --hc-teal-soft: #e6efec;
  --hc-teal-ink: #2c4d44;
  width: 100%;
  max-width: 1200px;
  /* continue the background of the section above, edge to edge, with no seam */
  margin: -48px auto -56px;
  padding: calc(48px + clamp(12px, 2vw, 24px)) 0 calc(56px + clamp(24px, 4vw, 48px));
  background: #fffaf4;
  box-shadow: 0 0 0 100vmax #fffaf4;
  clip-path: inset(0 -100vmax);
  color: var(--hc-ink);
  font-size: 1rem;
  line-height: 1.55;
  text-align: right;
  scroll-margin-top: 96px;
}
.hc-ltr { direction: ltr; unicode-bidi: isolate; white-space: nowrap; }
.hc-head { text-align: center; margin-bottom: 24px; }
.hc-title { margin: 0; color: var(--hc-ink); font-size: clamp(2.12rem, 4vw, 3.12rem); font-weight: 600; line-height: 1.18; }
.hc-subtitle { margin: 8px auto 0; font-size: 1.45rem; color: #5c4a40; }

/* info band */
.hc-band {
  display: flex; flex-wrap: wrap; align-items: center; gap: 20px 0;
  padding: 20px 8px; background: var(--hc-band); border: 1px solid var(--hc-band-line); border-radius: 20px;
}
.hc-item { display: flex; align-items: center; gap: 14px; padding: 0 20px; min-width: 0; }
.hc-item--place { flex: 1.6 1 380px; flex-wrap: wrap; justify-content: space-between; gap: 12px 20px; }
.hc-item--fact { flex: 1 1 240px; border-inline-start: 1px solid var(--hc-divider); }
.hc-item__main { display: flex; align-items: center; gap: 14px; min-width: 0; }
.hc-chip {
  width: 52px; height: 52px; flex: 0 0 auto; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  background: var(--hc-chip); color: var(--hc-chip-ink);
}
.hc-label { margin: 0; font-size: 1.15rem; font-weight: 600; color: var(--hc-label); }
.hc-value { margin: 0; font-size: 1.6rem; font-weight: 700; color: var(--hc-ink); font-style: normal; }
.hc-time { display: block; font-size: 1.35rem; font-weight: 600; color: var(--hc-ink-soft); }
a.hc-value { text-decoration: none; }
a.hc-value:hover { color: var(--hc-ink); text-decoration: underline; text-underline-offset: 4px; }
.hc-nav { display: flex; flex-wrap: wrap; gap: 8px; }
.hc-pill {
  display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px;
  border-radius: 999px; background: rgba(255,255,255,.6); border: 1px solid #dcc8bc;
  color: #6e4033; font-size: 1.15rem; font-weight: 700; text-decoration: none;
  transition: background-color .15s ease, border-color .15s ease;
}
.hc-pill:hover { background: #fff; border-color: #b98f7e; color: #6e4033; }

/* people */
.hc-people {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: 12px; margin-top: 12px;
}
.hc-person {
  display: flex; align-items: center; gap: 14px; padding: 14px 18px;
  background: #fff; border: 1px solid var(--hc-card-line); border-radius: 18px;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.hc-person:hover { border-color: #dccbbe; box-shadow: 0 8px 20px rgba(60,40,25,.06); }
.hc-avatar {
  width: 52px; height: 52px; flex: 0 0 auto; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 700;
}
.hc-person__info { flex: 1; min-width: 0; }
.hc-person__name { margin: 0; font-size: 1.55rem; font-weight: 700; line-height: 1.3; color: var(--hc-ink); }
.hc-person__meta { margin: 0; font-size: 1.25rem; color: var(--hc-muted); }
.hc-person__phone { font-weight: 600; color: var(--hc-ink-soft); }
.hc-call {
  flex: 0 0 auto; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 16px;
  border-radius: 999px; background: var(--hc-teal-soft); color: var(--hc-teal-ink);
  font-size: 1.25rem; font-weight: 700; text-decoration: none; transition: background-color .15s ease;
}
.hc-call:hover { background: #d5e5e0; color: var(--hc-teal-ink); }

.hc a:focus-visible { outline: 3px solid #d4a373; outline-offset: 3px; }

@media (max-width: 760px) {
  .hc-item--fact { border-inline-start: 0; }
}
@media (max-width: 480px) {
  .hc-person { flex-wrap: wrap; }
  .hc-call { width: 100%; justify-content: center; }
}
`;

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': 'true',
};

function Icon({ type, size = 20 }) {
  const props = { ...iconProps, width: size, height: size };

  if (type === 'phone') {
    return (
      <svg {...props}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.89.66 2.78a2 2 0 0 1-.45 2.11L8.09 9.84a16 16 0 0 0 6.07 6.07l1.23-1.23a2 2 0 0 1 2.11-.45c.89.31 1.82.53 2.78.66A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }

  if (type === 'clock') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (type === 'navigate') {
    return (
      <svg {...props}>
        <path d="M3 11l18-8-8 18-2-8z" />
      </svg>
    );
  }

  if (type === 'map') {
    return (
      <svg {...props}>
        <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" />
        <path d="M9 4v14M15 6v14" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function FooterSection({ centerInfo }) {
  const openingHours = centerInfo?.openingHours || [];
  const hoursLines = openingHours.length > 0
    ? openingHours.map((slot) => ({ day: slot.day, time: `${slot.open}–${slot.close}` }))
    : [{ day: 'ראשון–חמישי', time: '09:00–17:00' }];

  return (
    <footer id="contact-info" className="hc" dir="rtl" aria-labelledby="home-contact-title">
      <style>{SECTION_STYLES}</style>

      <div className="hc-head">
        <h2 id="home-contact-title" className="hc-title">צרו קשר</h2>
        <p className="hc-subtitle">נשמח לעזור, לענות על שאלות ולכוון לפעילות המתאימה.</p>
      </div>

      <section className="hc-band" aria-label="כתובת, טלפון ושעות פעילות">
        <div className="hc-item hc-item--place">
          <div className="hc-item__main">
            <span className="hc-chip"><Icon type="location" size={24} /></span>
            <div>
              <p className="hc-label">כתובת</p>
              <address className="hc-value">{ADDRESS}</address>
            </div>
          </div>
          <div className="hc-nav">
            <a className="hc-pill" href={WAZE_URL} target="_blank" rel="noopener noreferrer">
              <Icon type="navigate" size={15} />
              Waze
            </a>
            <a className="hc-pill" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              <Icon type="map" size={15} />
              Google Maps
            </a>
          </div>
        </div>

        <div className="hc-item hc-item--fact">
          <span className="hc-chip"><Icon type="phone" size={24} /></span>
          <div>
            <p className="hc-label">טלפון ראשי</p>
            <a
              className="hc-value hc-ltr"
              href={`tel:${MAIN_PHONE.tel}`}
              aria-label={`התקשרות לבית הופמן בטלפון ${MAIN_PHONE.display}`}
            >
              {MAIN_PHONE.display}
            </a>
          </div>
        </div>

        <div className="hc-item hc-item--fact">
          <span className="hc-chip"><Icon type="clock" size={24} /></span>
          <div>
            <p className="hc-label">שעות פעילות</p>
            {hoursLines.map((line, index) => (
              <p className="hc-value" key={`${line.day}-${index}`}>
                {line.day} <span className="hc-time hc-ltr">{line.time}</span>
              </p>
            ))}
          </div>
        </div>
      </section>

      <div className="hc-people">
        {CONTACT_PEOPLE.map((person) => (
          <article className="hc-person" key={person.tel}>
            <div
              className="hc-avatar"
              style={{ backgroundColor: person.avatarBg, color: person.avatarFg }}
              aria-hidden="true"
            >
              {person.name.charAt(0)}
            </div>
            <div className="hc-person__info">
              <h3 className="hc-person__name">{person.name}</h3>
              <p className="hc-person__meta">
                {person.role} · <span className="hc-person__phone hc-ltr">{person.phone}</span>
              </p>
            </div>
            <a
              className="hc-call"
              href={`tel:${person.tel}`}
              aria-label={`התקשרות ל${person.name} בטלפון ${person.phone}`}
            >
              <Icon type="phone" size={16} />
              חיוג
            </a>
          </article>
        ))}
      </div>
    </footer>
  );
}

export default FooterSection;
