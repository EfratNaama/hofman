import GalleryUploadForm from '../components/GalleryUploadForm';
import useGallery from '../hooks/useGallery';

function formatUploadDate(createdAt) {
  if (!createdAt?.toDate) return 'Not available';
  return createdAt.toDate().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function AdminGallery() {
  const { images, loading, uploading, deletingId, error, uploadImage, removeImage } = useGallery();

  async function handleUpload({ file, caption }) {
    await uploadImage(file, caption);
  }

  async function handleDelete(image) {
    const confirmed = window.confirm(`Delete this gallery image?\n\n${image.caption}`);
    if (!confirmed) return;
    await removeImage(image.id);
  }

  return (
    <main className="min-h-screen bg-[#f8f5f0] px-4 py-10 text-[#0f2240] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <section className="rounded-[2rem] bg-white p-8 shadow-2xl ring-1 ring-slate-200">
          <p className="text-lg font-black uppercase tracking-wide text-[#9a6b3f]">Administrator</p>
          <h1 className="mt-3 text-5xl font-black leading-tight text-[#0f2240]">Gallery Management</h1>
          <p className="mt-4 max-w-3xl text-xl leading-9 text-slate-700">
            Upload photos, write accessible alt text, and manage the public Beit Hoffman gallery.
          </p>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <GalleryUploadForm onSubmit={handleUpload} saving={uploading} />

          <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-black text-[#0f2240]">Uploaded images</h2>
                <p className="mt-2 text-lg text-slate-700">All images currently saved in the gallery collection.</p>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-lg font-semibold text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-xl font-semibold text-slate-700">
                Loading images...
              </div>
            ) : images.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-xl font-semibold text-slate-700">
                No uploaded images yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {images.map((image) => (
                  <article
                    key={image.id}
                    className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[120px_1fr_auto] sm:items-center"
                  >
                    <img
                      src={image.imageBase64}
                      alt={image.caption}
                      className="h-28 w-full rounded-2xl object-cover sm:w-28"
                    />
                    <div>
                      <h3 className="text-xl font-black leading-8 text-[#0f2240]">{image.caption}</h3>
                      <p className="mt-1 text-base font-semibold text-slate-600">
                        Uploaded: {formatUploadDate(image.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(image)}
                      disabled={Boolean(deletingId)}
                      className="min-h-12 rounded-2xl bg-red-600 px-5 py-3 text-lg font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {deletingId === image.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default AdminGallery;
