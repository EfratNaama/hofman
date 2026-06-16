import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GalleryGrid from '../components/GalleryGrid';
import GalleryModal from '../components/GalleryModal';
import useGallery from '../hooks/useGallery';

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
      event.currentTarget.reset();
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
    <main dir="rtl" className="min-h-screen bg-[#f8f5f0] px-4 py-10 text-[#0f2240] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="relative min-h-[340px]">
            <img
              src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1600&q=80"
              alt="חברי קהילה משתתפים בפעילות משותפת"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[#0f2240]/65" />
            <div className="relative flex min-h-[340px] flex-col items-center justify-center px-6 py-16 text-center text-white">
              <h1 className="text-5xl font-black leading-tight sm:text-6xl">גלריית תמונות</h1>
              <p className="mt-5 max-w-3xl text-2xl font-semibold leading-10">
                רגעים מפעילויות, אירועים וחיי הקהילה בבית הופמן
              </p>
            </div>
          </div>
        </section>

        {isGalleryAdmin && (
          <section className="mt-10 rounded-[2rem] bg-white p-6 text-right shadow-xl ring-1 ring-slate-200 sm:p-8">
            <h2 className="text-3xl font-black text-[#0f2240]">העלאת תמונה חדשה</h2>
            <p className="mt-3 text-xl leading-9 text-slate-700">
              בחרו תמונה, הוסיפו כיתוב ברור, והתמונה תישמר ישירות ב-Firestore לצורך הדגמה אקדמית.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <label className="grid gap-2 text-lg font-bold text-[#0f2240]">
                קובץ תמונה
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="min-h-14 rounded-2xl border border-slate-300 bg-white p-3 text-lg text-slate-800 file:ml-4 file:rounded-xl file:border-0 file:bg-[#d4a373] file:px-5 file:py-3 file:text-base file:font-bold file:text-[#0f2240]"
                  required
                />
              </label>

              <label className="grid gap-2 text-lg font-bold text-[#0f2240]">
                כיתוב לתמונה
                <input
                  type="text"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="לדוגמה: סדנת ציור בבית הופמן"
                  className="min-h-14 rounded-2xl border border-slate-300 px-4 text-lg text-slate-800 focus:border-[#0f2240] focus:outline-none focus:ring-4 focus:ring-[#d4a373]/30"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={uploading}
                className="min-h-14 rounded-2xl bg-[#0f2240] px-8 py-3 text-lg font-black text-white transition hover:bg-[#17365f] disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {uploading ? 'מעלה...' : 'העלאה'}
              </button>
            </form>

            {(formError || error) && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-lg font-semibold text-red-700">
                {formError || error}
              </div>
            )}
          </section>
        )}

        {!isGalleryAdmin && (formError || error) && (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-4 text-lg font-semibold text-red-700">
            {formError || error}
          </div>
        )}

        <section className="mt-10" aria-label="תמונות בגלריה">
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
