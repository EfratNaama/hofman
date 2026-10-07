import { useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ArrowDown, ChevronLeft, ChevronRight, ImageUp, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LogoLoader from '../components/LogoLoader';
import useGallery from '../hooks/useGallery';
import galleryHeroImage from '../logo/gallery.png';
import './Gallery.css';

/*
 * All styles for this page live here, scoped under .agl, so the gallery can be
 * redesigned without touching shared CSS files. Sizes are in rem so the site's
 * accessibility font scale still applies.
 */
const PAGE_STYLES = `
.agl * { font-size: inherit; box-sizing: border-box; }
.agl {
  --agl-bg: #fbf7f1;
  --agl-surface: #ffffff;
  --agl-ink: #2b2522;
  --agl-muted: #6b5f58;
  --agl-line: #e8dfd4;
  --agl-line-soft: #f0e9e0;
  --agl-accent: #b4593f;
  --agl-accent-hover: #9a4932;
  --agl-teal: #3f6b5f;
  --agl-teal-hover: #2c4d44;
  --agl-danger: #b42318;
  min-height: 100vh;
  background: var(--agl-bg);
  color: var(--agl-ink);
  font-size: 1.0625rem;
  line-height: 1.55;
  text-align: right;
}
.agl-wrap { max-width: 1200px; margin: 0 auto; padding-inline: 24px; }

/* hero */
.agl-hero { position: relative; height: clamp(380px, 58vh, 580px); overflow: hidden; background: #2b2522; }
.agl-hero__parallax { position: absolute; inset: 0; }
.agl-hero__img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  animation: agl-kenburns 2.4s cubic-bezier(.2,.7,.2,1) both;
}
.agl-hero__shade {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(25,18,14,.82) 0%, rgba(25,18,14,.35) 45%, rgba(25,18,14,.1) 100%);
}
.agl-hero__content {
  position: relative; height: 100%; display: flex; flex-direction: column; justify-content: flex-end;
  gap: 14px; padding-bottom: 64px; color: #fff;
}
.agl-hero__badge {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 8px;
  padding: 4px 14px; border-radius: 999px; font-size: 0.875rem; font-weight: 600;
  background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.35);
}
.agl-hero__title {
  margin: 0; color: #fff; font-size: clamp(2.75rem, 7vw, 5.25rem); font-weight: 800;
  line-height: 1; letter-spacing: -1px;
}
.agl-hero__sub { margin: 0; font-size: 1.3rem; max-width: 560px; color: rgba(255,255,255,.9); }
.agl-word { display: inline-block; animation: agl-word .8s cubic-bezier(.2,.7,.2,1) both; }
.agl-hint {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; min-height: 44px; margin-top: 6px;
  color: #fff; font-size: 1rem; font-weight: 600; text-decoration: none;
  animation: agl-bounce 1.8s ease-in-out infinite;
}
.agl-hint:hover { color: #fff; text-decoration: underline; text-underline-offset: 4px; }

/* admin bar */
.agl-admin { position: relative; z-index: 2; margin-top: -36px; }
.agl-admin__card {
  background: var(--agl-surface); border: 1px solid var(--agl-line); border-radius: 18px;
  box-shadow: 0 14px 34px rgba(60,40,25,.12); padding: 18px 22px;
}
.agl-admin__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.agl-admin__title { margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--agl-ink); }
.agl-admin__note { margin: 0; font-size: 0.875rem; color: var(--agl-muted); }
.agl-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 46px; padding: 0 20px; border: 0; border-radius: 12px;
  font-size: 1rem; font-weight: 700; color: #fff; cursor: pointer; transition: background-color .15s ease;
}
.agl-btn--accent { background: var(--agl-accent); }
.agl-btn--accent:hover { background: var(--agl-accent-hover); }
.agl-btn--teal { background: var(--agl-teal); min-height: 50px; }
.agl-btn--teal:hover:not(:disabled) { background: var(--agl-teal-hover); }
.agl-btn:disabled { opacity: .65; cursor: not-allowed; }
.agl-form {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; align-items: end;
  margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--agl-line-soft);
}
.agl-field { display: flex; flex-direction: column; gap: 6px; font-size: 0.95rem; font-weight: 600; color: var(--agl-ink); }
.agl-drop {
  position: relative; display: flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 50px; padding: 6px 12px; border: 2px dashed #d9cec2; border-radius: 12px;
  background: #fffdfb; color: var(--agl-muted); font-size: 0.95rem; font-weight: 600; cursor: pointer;
  text-align: center; overflow-wrap: anywhere;
}
.agl-drop:hover, .agl-drop:focus-within { border-color: var(--agl-teal); color: var(--agl-teal-hover); }
.agl-drop--filled { border-style: solid; border-color: var(--agl-teal); color: var(--agl-teal-hover); }
.agl-drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.agl-input {
  height: 50px; border: 1px solid #d9cec2; border-radius: 12px; padding: 0 14px;
  background: #fffdfb; color: var(--agl-ink); font-size: 1rem; font-weight: 400;
}
.agl-input:focus { outline: 2px solid var(--agl-teal); outline-offset: 1px; border-color: var(--agl-teal); }
.agl-error {
  margin-top: 14px; border-radius: 12px; padding: 12px 16px; font-size: 1rem; font-weight: 600;
  background: #fdf0ee; border: 1px solid #f1c4bf; color: var(--agl-danger);
}

/* grid */
.agl-grid-section { padding-top: 56px; padding-bottom: 96px; scroll-margin-top: 80px; }
.agl-grid-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 24px; }
.agl-grid-title { margin: 0; font-size: 1.9rem; font-weight: 800; color: var(--agl-ink); }
.agl-grid-help { font-size: 0.95rem; color: var(--agl-muted); }
.agl-masonry { columns: 3 300px; column-gap: 20px; }
.agl-tile {
  break-inside: avoid; margin-bottom: 20px; position: relative; border-radius: 18px; overflow: hidden;
  background: #efe4d6; box-shadow: 0 6px 18px rgba(60,40,25,.08);
}
.agl-tile__open { display: block; width: 100%; padding: 0; border: 0; background: transparent; cursor: zoom-in; position: relative; }
.agl-tile__img { display: block; width: 100%; height: auto; transition: transform .6s cubic-bezier(.2,.7,.2,1); }
.agl-tile:hover .agl-tile__img { transform: scale(1.06); }
.agl-tile__cap {
  position: absolute; inset: auto 0 0 0; padding: 40px 16px 14px; text-align: right; color: #fff;
  background: linear-gradient(to top, rgba(25,18,14,.85), rgba(25,18,14,0));
  transition: opacity .3s ease, transform .3s ease;
}
.agl-tile__caption { font-size: 1.05rem; font-weight: 700; line-height: 1.35; }
.agl-tile__date { font-size: 0.8rem; opacity: .85; }
@media (hover: hover) {
  .agl-tile__cap { opacity: 0; transform: translateY(10px); }
  .agl-tile:hover .agl-tile__cap, .agl-tile:focus-within .agl-tile__cap { opacity: 1; transform: none; }
}
.agl-tile__delete {
  position: absolute; top: 10px; left: 10px; width: 40px; height: 40px; border: 0; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  background: rgba(255,255,255,.92); color: var(--agl-danger); box-shadow: 0 2px 8px rgba(0,0,0,.15);
  transition: background-color .2s ease, color .2s ease;
}
.agl-tile__delete:hover:not(:disabled) { background: var(--agl-danger); color: #fff; }
.agl-tile__delete:disabled { cursor: wait; opacity: .7; }
.agl-empty {
  background: var(--agl-surface); border: 1px solid var(--agl-line); border-radius: 20px;
  padding: 48px 24px; text-align: center;
}
.agl-empty__title { margin: 0 0 6px; font-size: 1.5rem; font-weight: 800; color: var(--agl-ink); }
.agl-empty__text { margin: 0; color: var(--agl-muted); }

/* lightbox (rendered in a portal, outside .agl) */
.agl-lb * { font-size: inherit; box-sizing: border-box; }
.agl-lb { position: fixed; inset: 0; z-index: 80; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 24px; font-size: 1rem; line-height: 1.5; background: rgba(20,15,12,.92); animation: agl-fade .25s ease both; }
.agl-lb__row { display: flex; align-items: center; justify-content: center; gap: 16px; width: 100%; max-width: 1100px; }
.agl-lb__img { max-width: min(100%, 960px); max-height: 72vh; border-radius: 14px; display: block; object-fit: contain; animation: agl-zoomin .35s cubic-bezier(.2,.7,.2,1) both; }
.agl-lb__btn {
  flex: 0 0 auto; width: 52px; height: 52px; border: 0; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  background: rgba(255,255,255,.14); color: #fff; transition: background-color .15s ease;
}
.agl-lb__btn:hover { background: rgba(255,255,255,.26); }
.agl-lb__close { position: absolute; top: 18px; left: 18px; width: 48px; height: 48px; }
.agl-lb__meta { text-align: center; color: #fff; }
.agl-lb__caption { margin: 0; font-size: 1.25rem; font-weight: 700; color: #fff; }
.agl-lb__sub { font-size: 0.875rem; opacity: .75; }

.agl button:focus-visible, .agl a:focus-visible, .agl-lb button:focus-visible {
  outline: 3px solid #d4a373; outline-offset: 2px;
}

@keyframes agl-kenburns { from { transform: scale(1.12); } to { transform: scale(1); } }
@keyframes agl-word { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
@keyframes agl-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
@keyframes agl-rise { from { opacity: 0; transform: translateY(48px) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes agl-parallax { to { transform: translateY(120px) scale(1.05); } }
@keyframes agl-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes agl-zoomin { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: none; } }

/* scroll-driven animations: Chrome / Edge; other browsers just show the content */
@supports (animation-timeline: view()) {
  .agl-tile { animation: agl-rise linear both; animation-timeline: view(); animation-range: entry 0% entry 70%; }
  .agl-hero__parallax { animation: agl-parallax linear both; animation-timeline: scroll(root); animation-range: 0 600px; }
}

@media (max-width: 600px) {
  .agl-wrap { padding-inline: 16px; }
  .agl-lb { padding: 16px 8px; }
  .agl-lb__row { gap: 6px; }
  .agl-lb__btn { width: 44px; height: 44px; }
  .agl-admin__head .agl-btn { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .agl-hero__img, .agl-word, .agl-hint, .agl-tile, .agl-hero__parallax, .agl-lb, .agl-lb__img { animation: none !important; }
  .agl-tile__img { transition: none; }
}
`;

function formatCreatedDate(createdAt) {
  if (!createdAt?.toDate) return null;
  return createdAt.toDate().toLocaleDateString('he-IL');
}

function Gallery() {
  const { currentUser } = useAuth();
  const isGalleryAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'manager' ||
    currentUser?.role === 'מנהל' ||
    currentUser?.userType === 'admin' ||
    currentUser?.userType === 'manager';
  const {
    images,
    loading,
    uploading,
    deletingId,
    error,
    uploadImage,
    removeImage,
  } = useGallery({ canManageGallery: isGalleryAdmin });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef(null);

  const imageCount = images.length;
  const selectedImage = selectedIndex >= 0 ? images[selectedIndex] : null;

  const showNext = () => setSelectedIndex((index) => (index + 1) % imageCount);
  const showPrev = () => setSelectedIndex((index) => (index - 1 + imageCount) % imageCount);
  const closeLightbox = () => setSelectedIndex(-1);

  function handleLightboxKeyDown(event) {
    if (imageCount < 2) return;
    // RTL: the left arrow moves forward, the right arrow moves back.
    if (event.key === 'ArrowLeft') showNext();
    if (event.key === 'ArrowRight') showPrev();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isGalleryAdmin) {
      setFormError('אין לך הרשאה לבצע פעולה זו');
      return;
    }

    if (!file) {
      setFormError('יש לבחור קובץ תמונה.');
      return;
    }

    if (!caption.trim()) {
      setFormError('יש להזין כיתוב לתמונה.');
      return;
    }

    try {
      setFormError('');
      await uploadImage(file, caption);
      setFile(null);
      setCaption('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadOpen(false);
    } catch (uploadError) {
      setFormError(uploadError.message || 'העלאת התמונה נכשלה.');
    }
  }

  async function handleDelete(imageId) {
    if (!isGalleryAdmin) {
      setFormError('אין לך הרשאה לבצע פעולה זו');
      return;
    }

    const confirmed = window.confirm('האם למחוק את התמונה מהגלריה?');
    if (!confirmed) return;

    try {
      setFormError('');
      await removeImage(imageId);
    } catch (deleteError) {
      setFormError(deleteError.message || 'מחיקת התמונה נכשלה.');
    }
  }

  const message = formError || error;

  return (
    <main dir="rtl" className="agl">
      <style>{PAGE_STYLES}</style>

      <section className="agl-hero" aria-label="גלריית תמונות">
        <div className="agl-hero__parallax">
          <img className="agl-hero__img" src={galleryHeroImage} alt="" />
        </div>
        <div className="agl-hero__shade" />
        <div className="agl-wrap agl-hero__content">
          {!loading && imageCount > 0 && (
            <span className="agl-hero__badge">{imageCount} תמונות מחיי הקהילה</span>
          )}
          <h1 className="agl-hero__title">
            <span className="agl-word" style={{ animationDelay: '.15s' }}>גלריית</span>{' '}
            <span className="agl-word" style={{ animationDelay: '.3s' }}>תמונות</span>
          </h1>
          <p className="agl-hero__sub agl-word" style={{ animationDelay: '.45s' }}>
            רגעים מפעילויות, אירועים וחיי הקהילה בבית הופמן
          </p>
          <a className="agl-hint" href="#gallery-grid">
            לגלול לתמונות
            <ArrowDown size={18} aria-hidden="true" />
          </a>
        </div>
      </section>

      {isGalleryAdmin && (
        <section className="agl-wrap agl-admin" aria-label="ניהול הגלריה">
          <div className="agl-admin__card">
            <div className="agl-admin__head">
              <div>
                <h2 className="agl-admin__title">ניהול הגלריה</h2>
                <p className="agl-admin__note">רק מנהלים רואים את האזור הזה</p>
              </div>
              <button
                type="button"
                className="agl-btn agl-btn--accent"
                aria-expanded={uploadOpen}
                aria-controls="gallery-upload-form"
                onClick={() => setUploadOpen((open) => !open)}
              >
                {uploadOpen ? <X size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                {uploadOpen ? 'סגירה' : 'העלאת תמונה חדשה'}
              </button>
            </div>

            {uploadOpen && (
              <form id="gallery-upload-form" className="agl-form" onSubmit={handleSubmit}>
                <label className="agl-field">
                  קובץ תמונה
                  <span className={`agl-drop${file ? ' agl-drop--filled' : ''}`}>
                    <ImageUp size={18} aria-hidden="true" />
                    {file ? file.name : 'בחירה או גרירה של תמונה'}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(event) => setFile(event.target.files?.[0] || null)}
                      required
                    />
                  </span>
                </label>

                <label className="agl-field">
                  כיתוב לתמונה
                  <input
                    type="text"
                    className="agl-input"
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    placeholder="לדוגמה: סדנת ציור בבית הופמן"
                    required
                  />
                </label>

                <button type="submit" className="agl-btn agl-btn--teal" disabled={uploading}>
                  {uploading ? 'מעלה...' : 'העלאה לגלריה'}
                </button>
              </form>
            )}

            {message && <div className="agl-error" role="alert">{message}</div>}
          </div>
        </section>
      )}

      <section id="gallery-grid" className="agl-wrap agl-grid-section" aria-label="תמונות בגלריה">
        {!isGalleryAdmin && message && <div className="agl-error" role="alert">{message}</div>}

        {loading ? (
          <LogoLoader label="טוען תמונות..." />
        ) : imageCount === 0 ? (
          <div className="agl-empty">
            <h2 className="agl-empty__title">אין תמונות בגלריה עדיין</h2>
            <p className="agl-empty__text">
              {isGalleryAdmin ? 'העלו תמונה חדשה כדי להציג אותה כאן.' : 'תמונות מהפעילויות יופיעו כאן בקרוב.'}
            </p>
          </div>
        ) : (
          <>
            <div className="agl-grid-head">
              <h2 className="agl-grid-title">כל התמונות</h2>
              <span className="agl-grid-help">לחיצה על תמונה פותחת אותה בגדול</span>
            </div>

            <div className="agl-masonry">
              {images.map((image, index) => {
                const createdDate = formatCreatedDate(image.createdAt);
                return (
                  <article className="agl-tile" key={image.id}>
                    <button
                      type="button"
                      className="agl-tile__open"
                      onClick={() => setSelectedIndex(index)}
                      aria-label={`פתיחת התמונה: ${image.caption}`}
                    >
                      <img className="agl-tile__img" src={image.imageBase64} alt={image.caption} loading="lazy" />
                      <div className="agl-tile__cap">
                        <div className="agl-tile__caption">{image.caption}</div>
                        {createdDate && <div className="agl-tile__date">הועלה ב־{createdDate}</div>}
                      </div>
                    </button>

                    {isGalleryAdmin && (
                      <button
                        type="button"
                        className="agl-tile__delete"
                        onClick={() => handleDelete(image.id)}
                        disabled={deletingId === image.id}
                        aria-label={`מחיקת התמונה: ${image.caption}`}
                        title="מחיקה"
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <Dialog open={Boolean(selectedImage)} onClose={closeLightbox} className="relative z-[80]">
        <DialogPanel
          className="agl-lb"
          dir="rtl"
          onKeyDown={handleLightboxKeyDown}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          {selectedImage && (
            <>
              <button type="button" className="agl-lb__btn agl-lb__close" onClick={closeLightbox} aria-label="סגירה">
                <X size={22} aria-hidden="true" />
              </button>

              <div className="agl-lb__row">
                {imageCount > 1 && (
                  <button type="button" className="agl-lb__btn" onClick={showPrev} aria-label="התמונה הקודמת">
                    <ChevronRight size={24} aria-hidden="true" />
                  </button>
                )}
                <img
                  key={selectedImage.id}
                  className="agl-lb__img"
                  src={selectedImage.imageBase64}
                  alt={selectedImage.caption}
                />
                {imageCount > 1 && (
                  <button type="button" className="agl-lb__btn" onClick={showNext} aria-label="התמונה הבאה">
                    <ChevronLeft size={24} aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="agl-lb__meta">
                <DialogTitle className="agl-lb__caption">{selectedImage.caption}</DialogTitle>
                <div className="agl-lb__sub">
                  {selectedIndex + 1} מתוך {imageCount}
                  {formatCreatedDate(selectedImage.createdAt) && ` · הועלה ב־${formatCreatedDate(selectedImage.createdAt)}`}
                </div>
              </div>
            </>
          )}
        </DialogPanel>
      </Dialog>
    </main>
  );
}

export default Gallery;
