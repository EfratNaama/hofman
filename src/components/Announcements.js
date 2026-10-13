import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { getAnnouncements, markAnnouncementsRead } from '../services/announcementService';
import LogoLoader from './LogoLoader';
import './Announcements.css';

const LONG_CONTENT_LENGTH = 220;

function getAnnouncementDate(createdAt) {
  if (createdAt?.toDate) return createdAt.toDate();
  if (createdAt instanceof Date) return createdAt;
  return null;
}

function getAnnouncementText(announcement) {
  return announcement.content || announcement.message || '';
}

function formatLongDate(date) {
  return date ? date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

const NOTE_TONES = ['cream', 'yellow', 'pink', 'blue', 'mint'];
const NOTE_TILTS = [-1.4, 1, -0.6, 1.5, -1.1, 0.7];
const PIN_COLORS = ['#c0392b', '#2c6e9b', '#3f6b5f', '#b8860b'];

/*
 * "לוח המודעות" — a cork board with pinned paper notes.
 * Scoped under .uan so Announcements.css and the rest of the site are untouched.
 * Sizes are in rem so the site's accessibility font scale still applies.
 */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700&display=swap');
.uan * { font-size: inherit; box-sizing: border-box; }
.uan { width: min(100%, 1120px); margin: 0 auto; padding: 36px 20px 64px; color: #2b211c; font-size: 1rem; line-height: 1.6; text-align: right; }
.uan-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 20px; }
.uan-eyebrow { margin: 0; font-size: 0.88rem; font-weight: 700; color: #a84f3d; }
.uan-title { margin: 4px 0 0; font-family: inherit; font-size: clamp(2.2rem, 5vw, 2.9rem); font-weight: 700; line-height: 1.05; color: #2b211c; }
.uan-lead { margin: 8px 0 0; color: #6b5a50; }

.uan-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.uan-search { position: relative; width: min(100%, 280px); }
.uan-search svg { position: absolute; top: 50%; inset-inline-start: 14px; transform: translateY(-50%); color: #8a7a70; pointer-events: none; }
.uan-search input { width: 100%; height: 46px; padding: 0 42px; border: 1px solid #e3d7cc; border-radius: 14px; background: #fff; color: #2b211c; font: inherit; font-size: 0.95rem; }
.uan-search input:focus { outline: 2px solid #3f6b5f; outline-offset: 1px; border-color: #3f6b5f; }
.uan-search__clear { position: absolute; top: 50%; inset-inline-end: 8px; transform: translateY(-50%); display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; padding: 0; border: 0; border-radius: 8px; background: none; color: #6b5a50; cursor: pointer; }
.uan-search__clear:hover { background: #f3ede6; }
.uan-tab { display: inline-flex; align-items: center; gap: 6px; min-height: 46px; padding: 0 16px; border-radius: 14px; border: 1px solid #e3d7cc; background: #fff; color: #5c4a40; font: inherit; font-size: 0.95rem; font-weight: 700; cursor: pointer; }
.uan-tab:hover { border-color: #c9b6a8; }
.uan-tab[aria-pressed="true"] { background: #2b211c; border-color: #2b211c; color: #fff; }
.uan-tab b { padding: 0 7px; border-radius: 999px; background: #a84f3d; color: #fff; font-size: 0.75rem; line-height: 1.5; }

/* the board */
.uan-board {
  position: relative; margin-top: 26px; padding: clamp(26px, 4vw, 44px) clamp(18px, 3.5vw, 40px) clamp(30px, 4vw, 48px);
  border-radius: 18px; border: 14px solid #8a5a3b;
  background-color: #c9a27a;
  background-image:
    radial-gradient(rgba(110,70,40,.22) 1px, transparent 1.4px),
    radial-gradient(rgba(255,240,215,.18) 1px, transparent 1.6px),
    linear-gradient(135deg, #cfa77d, #bf9468);
  background-size: 7px 7px, 11px 11px, 100% 100%;
  background-position: 0 0, 3px 5px, 0 0;
  box-shadow: inset 0 0 0 2px #6e452c, inset 0 6px 18px rgba(60,35,20,.35), 0 18px 40px rgba(60,35,20,.18);
}
.uan-board::before {
  content: ""; position: absolute; inset: -14px; border-radius: 18px; pointer-events: none;
  background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(0,0,0,.08) 50%, rgba(255,255,255,.06));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; padding: 14px;
}
.uan-notes { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); gap: 34px 26px; margin: 0; padding: 0; list-style: none; align-items: start; }

.uan-note {
  --tilt: 0deg; position: relative; padding: 30px 22px 20px; min-height: 170px;
  color: #2b211c; transform: rotate(var(--tilt));
  box-shadow: 0 1px 1px rgba(0,0,0,.08), 0 10px 18px -6px rgba(60,35,20,.45);
  transition: transform .25s ease, box-shadow .25s ease;
}
.uan-note:hover, .uan-note:focus-within { transform: rotate(0deg) translateY(-3px) scale(1.015); box-shadow: 0 2px 2px rgba(0,0,0,.08), 0 18px 28px -8px rgba(60,35,20,.5); z-index: 2; }
.uan-note--cream { background: #fffaf0; }
.uan-note--yellow { background: #fff3b8; }
.uan-note--pink { background: #fde0dc; }
.uan-note--blue { background: #dfeefa; }
.uan-note--mint { background: #e1f2e6; }
.uan-note::after { content: ""; position: absolute; inset-inline-start: 0; bottom: 0; width: 34px; height: 34px; background: linear-gradient(225deg, rgba(0,0,0,.08) 50%, transparent 50%); }

.uan-pin { position: absolute; top: -9px; left: 50%; width: 22px; height: 22px; margin-left: -11px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.8) 0 3px, transparent 4px), var(--pin, #c0392b); box-shadow: 0 3px 4px rgba(0,0,0,.35), inset 0 -2px 3px rgba(0,0,0,.25); }

.uan-note__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 0.82rem; font-weight: 700; color: #6b5a50; }
.uan-note h3 { margin: 0; font-size: 1.25rem; font-weight: 800; line-height: 1.3; color: #2b211c; overflow-wrap: anywhere; }
.uan-note p { margin: 8px 0 0; color: #3e322c; white-space: pre-line; overflow-wrap: anywhere; }

.uan-new { display: inline-block; padding: 1px 9px; border-radius: 999px; background: #a84f3d; color: #fff; font-size: 0.75rem; font-weight: 800; white-space: nowrap; }

/* the latest notice: a big white sheet held by tape */
.uan-note--featured {
  grid-column: 1 / -1; justify-self: center; width: min(100%, 720px); min-height: 0;
  padding: clamp(34px, 5vw, 46px) clamp(24px, 5vw, 48px) clamp(26px, 4vw, 36px); background: #fffdf7;
  background-image: repeating-linear-gradient(transparent 0 33px, rgba(91,108,192,.12) 33px 34px);
  background-position: 0 70px;
}
.uan-note--featured::after { display: none; }
.uan-tape { position: absolute; top: -14px; width: 120px; height: 30px; background: rgba(255,248,220,.75); border: 1px solid rgba(200,180,140,.35); box-shadow: 0 1px 3px rgba(0,0,0,.12); }
.uan-tape--r { right: 40px; transform: rotate(4deg); }
.uan-tape--l { left: 40px; transform: rotate(-5deg); }
.uan-stamp { display: inline-block; margin-bottom: 10px; padding: 3px 12px; border: 2px solid #a84f3d; border-radius: 6px; color: #a84f3d; font-size: 0.85rem; font-weight: 800; letter-spacing: .5px; transform: rotate(-2deg); }
.uan-note--featured h2 { margin: 0; font-family: inherit; font-size: clamp(1.8rem, 4vw, 2.4rem); font-weight: 700; line-height: 1.2; color: #2b211c; overflow-wrap: anywhere; }
.uan-note--featured p { margin-top: 12px; font-size: 1.15rem; line-height: 34px; }
.uan-note--featured .uan-note__meta { margin: 14px 0 0; }

.uan-more { margin-top: 8px; padding: 0; border: 0; background: none; color: #93422f; font: inherit; font-size: 0.9rem; font-weight: 800; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }

.uan-state { padding: 28px 22px; border-radius: 6px; background: #fffaf0; color: #5c4a40; text-align: center; font-weight: 600; box-shadow: 0 10px 18px -6px rgba(60,35,20,.45); }
.uan-state--error { margin-top: 26px; border-radius: 14px; background: #fdf0ee; border: 1px solid #f1c4bf; color: #b42318; box-shadow: none; }
.uan-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.uan button:focus-visible { outline: 3px solid #d4a373; outline-offset: 2px; }

@media (max-width: 600px) {
  .uan { padding: 24px 12px 48px; }
  .uan-tools, .uan-search { width: 100%; }
  .uan-board { border-width: 10px; }
  .uan-note { --tilt: 0deg !important; }
}
@media (prefers-reduced-motion: reduce) {
  .uan-note { transition: none; }
  .uan-note:hover, .uan-note:focus-within { transform: rotate(var(--tilt)); }
}
`;

function Announcements() {
  const { currentUser } = useAuth();
  const currentUserUid = currentUser?.uid;
  const [announcements, setAnnouncements] = useState([]);
  const [unreadIds, setUnreadIds] = useState(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  useEffect(() => {
    let isMounted = true;

    async function loadAnnouncements() {
      setIsLoading(true);
      setError('');

      try {
        const announcementsData = await getAnnouncements();
        const visibleAnnouncements = announcementsData
          .filter((announcement) => announcement.isActive !== false)
          .slice(0, 25);

        // Which ones were already read, captured before this visit marks them all as read.
        let readIds = new Set();
        if (currentUserUid) {
          try {
            const userSnap = await getDoc(doc(db, 'users', currentUserUid));
            const storedIds = userSnap.exists() ? userSnap.data()?.announcementReadIds : [];
            readIds = new Set(Array.isArray(storedIds) ? storedIds : []);
          } catch (readError) {
            console.error('Failed to load read announcements:', readError);
          }
        }

        if (isMounted) {
          setAnnouncements(visibleAnnouncements);
          setUnreadIds(new Set(
            currentUserUid
              ? visibleAnnouncements.filter((announcement) => !readIds.has(announcement.id)).map((announcement) => announcement.id)
              : []
          ));
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
  }, [currentUserUid]);

  useEffect(() => {
    if (!currentUserUid || isLoading || error || !announcements.length) return;

    markAnnouncementsRead(
      currentUserUid,
      announcements.map((announcement) => announcement.id)
    ).catch((err) => {
      console.error('Firestore "users" document write failed while marking announcements as read:', err);
    });
  }, [announcements, currentUserUid, error, isLoading]);

  const filteredAnnouncements = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return announcements.filter((announcement) => {
      if (showUnreadOnly && !unreadIds.has(announcement.id)) return false;
      if (!term) return true;
      return `${announcement.title || ''} ${getAnnouncementText(announcement)}`.toLowerCase().includes(term);
    });
  }, [announcements, searchTerm, showUnreadOnly, unreadIds]);

  const featured = filteredAnnouncements[0];

  const otherAnnouncements = filteredAnnouncements.slice(1);

  const toggleExpanded = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isFiltering = Boolean(searchTerm.trim()) || showUnreadOnly;
  const featuredDate = featured ? getAnnouncementDate(featured.createdAt) : null;

  const renderText = (announcement) => {
    const text = getAnnouncementText(announcement);
    if (!text) return null;
    const isLong = text.length > LONG_CONTENT_LENGTH;
    const isExpanded = expandedIds.has(announcement.id);
    return (
      <>
        <p>{isLong && !isExpanded ? `${text.slice(0, LONG_CONTENT_LENGTH).trimEnd()}…` : text}</p>
        {isLong && (
          <button className="uan-more" type="button" aria-expanded={isExpanded} onClick={() => toggleExpanded(announcement.id)}>
            {isExpanded ? 'הצגה מקוצרת' : 'קראו עוד'}
          </button>
        )}
      </>
    );
  };

  return (
    <section className="uan" dir="rtl">
      <style>{STYLES}</style>

      <div className="uan-top">
        <div>
          <p className="uan-eyebrow">עדכונים לקהילה</p>
          <h1 className="uan-title">לוח המודעות</h1>
          <p className="uan-lead">כל מה שחשוב לדעת בבית הופמן: שינויים, אירועים ותזכורות.</p>
        </div>

        {announcements.length > 0 && (
          <div className="uan-tools">
            {unreadIds.size > 0 && (
              <div role="group" aria-label="סינון הודעות" style={{ display: 'flex', gap: 8 }}>
                <button className="uan-tab" type="button" aria-pressed={!showUnreadOnly} onClick={() => setShowUnreadOnly(false)}>
                  הכול
                </button>
                <button className="uan-tab" type="button" aria-pressed={showUnreadOnly} onClick={() => setShowUnreadOnly(true)}>
                  לא נקראו <b>{unreadIds.size}</b>
                </button>
              </div>
            )}
            <div className="uan-search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                placeholder="חיפוש בהודעות"
                aria-label="חיפוש בהודעות"
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              {searchTerm && (
                <button className="uan-search__clear" type="button" aria-label="ניקוי החיפוש" onClick={() => setSearchTerm('')}>
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <div className="uan-state uan-state--error" role="alert">{error}</div>}

      {isLoading && <LogoLoader label="טוען הודעות..." />}

      {!isLoading && !error && (
        <div className="uan-board">
          {announcements.length === 0 && (
            <div className="uan-state">אין הודעות על הלוח כרגע. עדכונים חדשים יופיעו כאן.</div>
          )}

          {announcements.length > 0 && filteredAnnouncements.length === 0 && (
            <div className="uan-state">לא נמצאו הודעות שמתאימות לחיפוש.</div>
          )}

          {filteredAnnouncements.length > 0 && (
            <ul className="uan-notes">
              <li className="uan-note uan-note--featured" style={{ '--tilt': '-0.4deg' }}>
                <span className="uan-tape uan-tape--r" aria-hidden="true" />
                <span className="uan-tape uan-tape--l" aria-hidden="true" />
                <span className="uan-stamp">{isFiltering ? 'תוצאה ראשונה' : 'ההודעה האחרונה'}</span>
                <h2>{featured.title}</h2>
                {renderText(featured)}
                <div className="uan-note__meta">
                  {unreadIds.has(featured.id) && <span className="uan-new">חדש</span>}
                  {featuredDate && <span>{formatLongDate(featuredDate)}</span>}
                </div>
              </li>

              {otherAnnouncements.map((announcement, index) => {
                const date = getAnnouncementDate(announcement.createdAt);
                const tone = NOTE_TONES[index % NOTE_TONES.length];
                const tilt = NOTE_TILTS[index % NOTE_TILTS.length];
                const pin = PIN_COLORS[index % PIN_COLORS.length];
                return (
                  <li
                    key={announcement.id}
                    className={`uan-note uan-note--${tone}`}
                    style={{ '--tilt': `${tilt}deg`, '--pin': pin }}
                  >
                    <span className="uan-pin" aria-hidden="true" />
                    <div className="uan-note__meta">
                      {date && <span>{formatLongDate(date)}</span>}
                      {unreadIds.has(announcement.id) && <span className="uan-new">חדש</span>}
                    </div>
                    <h3>{announcement.title}</h3>
                    {renderText(announcement)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

export default Announcements;
