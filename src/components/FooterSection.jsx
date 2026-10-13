const ADDRESS_LINE_1 = 'אליעזר הגדול 4';
const ADDRESS_LINE_2 = 'ירושלים';
const MAIN_PHONE = { display: '02-6788848', tel: '026788848' };
const WAZE_URL = `https://waze.com/ul?q=${encodeURIComponent('בית הופמן אליעזר הגדול 4 ירושלים')}&navigate=yes`;
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('בית הופמן, אליעזר הגדול 4, ירושלים')}`;

const CONTACT_PEOPLE = [
  { name: 'סיון עץ הדר', role: 'מנהלת', phone: '050-3082593', tel: '0503082593' },
  { name: 'שרה שירן', role: 'רכזת גיל שלישי ומזכירה', phone: '050-4483859', tel: '0504483859' },
];

/*
 * "בואו לבקר" — a dark band at the bottom of the home page, edge to edge.
 * All styles are scoped under .hv so Home.css does not need to change.
 * Sizes are in rem so the site's accessibility font scale still applies.
 */
const SECTION_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700&display=swap');
.hv * { font-size: inherit; box-sizing: border-box; }
.hv {
  width: 100%;
  margin: 0 auto -56px;              /* sit flush with the bottom of the page */
  padding: clamp(40px, 5vw, 56px) 0 clamp(40px, 5vw, 52px);
  background: #231b16;
  box-shadow: 0 0 0 100vmax #231b16; /* paint the band edge to edge */
  clip-path: inset(0 -100vmax);
  color: #f5f0e8;
  font-size: 1rem;
  line-height: 1.6;
  text-align: right;
  scroll-margin-top: 96px;
}
.hv-grid {
  max-width: 1200px; margin: 0 auto;
  display: grid; grid-template-columns: minmax(0, 1.3fr) repeat(3, minmax(0, 1fr)); gap: clamp(24px, 4vw, 44px);
}
.hv-title {
  margin: 0; color: #f5f0e8; font-family: inherit;
  font-size: clamp(2rem, 3.5vw, 2.6rem); font-weight: 700; line-height: 1.1;
}
.hv-lead { margin: 10px 0 0; color: #cfc3b8; font-size: 1.05rem; }
.hv-label { margin: 0; font-size: 0.85rem; font-weight: 600; letter-spacing: .5px; color: #b9a797; }
.hv-value { margin: 6px 0 0; color: #f5f0e8; font-size: 1.2rem; font-style: normal; line-height: 1.45; }
.hv-big { display: inline-block; margin-top: 6px; color: #f5f0e8; font-size: 1.5rem; font-weight: 600; text-decoration: none; }
.hv-big:hover { color: #f3c9b8; }
.hv-links { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 8px; }
.hv-link {
  display: inline-flex; align-items: center; gap: 6px; min-height: 36px;
  color: #f3c9b8; font-size: 0.95rem; font-weight: 600; text-decoration: none;
  border-bottom: 1px solid rgba(243,201,184,.4);
}
.hv-link:hover { color: #fff; border-bottom-color: #fff; }
.hv-link span { transition: transform .25s ease; }
.hv-link:hover span { transform: translateX(-4px); }
.hv-people { margin: 12px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
.hv-person { font-size: 0.95rem; color: #cfc3b8; line-height: 1.5; }
.hv-person b { color: #f5f0e8; font-weight: 600; }
.hv-person a { color: #f5f0e8; text-decoration: none; border-bottom: 1px solid rgba(245,240,232,.3); }
.hv-person a:hover { color: #f3c9b8; border-bottom-color: #f3c9b8; }
.hv-ltr { direction: ltr; unicode-bidi: isolate; white-space: nowrap; }
.hv a:focus-visible { outline: 2px solid #f3c9b8; outline-offset: 3px; }

@media (max-width: 900px) {
  .hv-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hv-intro { grid-column: 1 / -1; }
}
@media (max-width: 560px) {
  .hv-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .hv-link span { transition: none; }
}
`;

function FooterSection({ centerInfo }) {
  const openingHours = centerInfo?.openingHours || [];
  const hoursLines = openingHours.length > 0
    ? openingHours.map((slot) => ({ day: slot.day, time: `${slot.open}–${slot.close}` }))
    : [{ day: 'ראשון–חמישי', time: '09:00–17:00' }];

  return (
    <footer id="contact-info" className="hv" dir="rtl" aria-labelledby="home-visit-title">
      <style>{SECTION_STYLES}</style>
      <div className="hv-grid">
        <div className="hv-intro">
          <h2 id="home-visit-title" className="hv-title">בואו לבקר</h2>
          <p className="hv-lead">נשמח לעזור, לענות על שאלות ולכוון לפעילות המתאימה.</p>
        </div>

        <div>
          <p className="hv-label">כתובת</p>
          <address className="hv-value">
            {ADDRESS_LINE_1}
            <br />
            {ADDRESS_LINE_2}
          </address>
          <div className="hv-links">
            <a className="hv-link" href={WAZE_URL} target="_blank" rel="noopener noreferrer">
              ניווט ב־Waze <span aria-hidden="true">←</span>
            </a>
            <a className="hv-link" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              Google Maps <span aria-hidden="true">←</span>
            </a>
          </div>
        </div>

        <div>
          <p className="hv-label">טלפון</p>
          <a
            className="hv-big hv-ltr"
            href={`tel:${MAIN_PHONE.tel}`}
            aria-label={`התקשרות לבית הופמן בטלפון ${MAIN_PHONE.display}`}
          >
            {MAIN_PHONE.display}
          </a>
          <ul className="hv-people">
            {CONTACT_PEOPLE.map((person) => (
              <li className="hv-person" key={person.tel}>
                <b>{person.name}</b>, {person.role}
                <br />
                <a
                  className="hv-ltr"
                  href={`tel:${person.tel}`}
                  aria-label={`התקשרות ל${person.name} בטלפון ${person.phone}`}
                >
                  {person.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="hv-label">שעות פעילות</p>
          {hoursLines.map((line, index) => (
            <p className="hv-value" key={`${line.day}-${index}`}>
              {line.day}
              <br />
              <span className="hv-ltr">{line.time}</span>
            </p>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default FooterSection;
