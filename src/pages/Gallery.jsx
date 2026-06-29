import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GalleryGrid from '../components/GalleryGrid';
import GalleryModal from '../components/GalleryModal';
import useGallery from '../hooks/useGallery';
import galleryHeroImage from '../logo/gallery.png';
import './Gallery.css';

function Gallery() {
  const { currentUser } = useAuth();
  console.log('Gallery currentUser:', currentUser);
  console.log('Gallery role:', currentUser?.role);
  console.log('Gallery userType:', currentUser?.userType);
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef(null);

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

  return (
    <main dir="rtl" className="gallery-page">
      <div className="gallery-page__inner">
        <section className="gallery-hero" aria-label="גלריית תמונות">
          <div className="gallery-hero__media" style={{ '--gallery-hero-image': `url(${galleryHeroImage})` }}>
            <div className="gallery-hero__overlay" />
            <div className="gallery-hero__content">
              <h1>גלריית תמונות</h1>
              <p>
                רגעים מפעילויות, אירועים וחיי הקהילה בבית הופמן
              </p>
            </div>
          </div>
        </section>

        {isGalleryAdmin && (
          <section className="gallery-upload-card">
            <h2>העלאת תמונה חדשה</h2>
            <p className="gallery-upload-card__description">
              בחרו תמונה, הוסיפו כיתוב ברור, והתמונה תישמר ישירות ב-Firestore לצורך הדגמה אקדמית.
            </p>

            <form onSubmit={handleSubmit} className="gallery-upload-form">
              <label className="gallery-field">
                <span>קובץ תמונה</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="gallery-input gallery-input--file"
                  required
                />
              </label>

              <label className="gallery-field">
                <span>כיתוב לתמונה</span>
                <input
                  type="text"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="לדוגמה: סדנת ציור בבית הופמן"
                  className="gallery-input"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={uploading}
                className="gallery-submit-button"
              >
                {uploading ? 'מעלה...' : 'העלאה'}
              </button>
            </form>

            {(formError || error) && (
              <div className="gallery-message gallery-message--error">
                {formError || error}
              </div>
            )}
          </section>
        )}

        {!isGalleryAdmin && (formError || error) && (
          <div className="gallery-message gallery-message--error">
            {formError || error}
          </div>
        )}

        <section className="gallery-results" aria-label="תמונות בגלריה">
          <GalleryGrid
            images={images}
            loading={loading}
            deletingId={deletingId}
            onImageClick={setSelectedImage}
            onDelete={isGalleryAdmin ? handleDelete : undefined}
            canDelete={isGalleryAdmin}
          />
        </section>
      </div>

      <GalleryModal
        image={selectedImage}
        isOpen={Boolean(selectedImage)}
        onClose={() => setSelectedImage(null)}
      />
    </main>
  );
}

export default Gallery;
