import GalleryCard from './GalleryCard';

function GalleryGrid({ images, loading, deletingId, onImageClick, onDelete }) {
  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center text-xl font-semibold text-slate-700 shadow-lg">
        טוען תמונות...
      </div>
    );
  }

  if (!images.length) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-lg">
        <h2 className="text-3xl font-black text-[#0f2240]">אין תמונות בגלריה עדיין</h2>
        <p className="mt-3 text-xl leading-9 text-slate-700">
          העלו תמונה חדשה כדי להציג אותה כאן.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {images.map((image) => (
        <GalleryCard
          key={image.id}
          image={image}
          onPreview={onImageClick}
          onDelete={onDelete}
          deleting={deletingId === image.id}
        />
      ))}
    </div>
  );
}

export default GalleryGrid;
