function formatCreatedDate(createdAt) {
  if (!createdAt?.toDate) return null;
  return createdAt.toDate().toLocaleDateString('he-IL');
}

function GalleryCard({ image, onPreview, onDelete, canDelete = false, deleting }) {
  const createdDate = formatCreatedDate(image.createdAt);

  return (
    <article className="overflow-hidden rounded-3xl bg-white text-right shadow-lg ring-1 ring-slate-200 transition duration-200 hover:-translate-y-1 hover:shadow-2xl">
      <button
        type="button"
        onClick={() => onPreview(image)}
        className="block w-full bg-slate-100 focus:outline-none focus:ring-4 focus:ring-[#d4a373]/50"
        aria-label={`פתח תמונה: ${image.caption}`}
      >
        <img
          src={image.imageBase64}
          alt={image.caption}
          className="h-64 w-full object-cover"
        />
      </button>

      <div className="grid gap-4 p-5">
        <div>
          <h3 className="text-xl font-black leading-8 text-[#0f2240]">{image.caption}</h3>
          {createdDate && (
            <p className="mt-2 text-base font-semibold text-slate-600">
              הועלה בתאריך: {createdDate}
            </p>
          )}
        </div>

        {canDelete && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(image.id)}
            disabled={deleting}
            className="min-h-12 rounded-2xl bg-red-600 px-5 py-3 text-lg font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {deleting ? 'מוחק...' : 'מחיקה'}
          </button>
        )}
      </div>
    </article>
  );
}

export default GalleryCard;
