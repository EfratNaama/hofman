function formatCreatedDate(createdAt) {
  if (!createdAt?.toDate) return null;
  return createdAt.toDate().toLocaleDateString('he-IL');
}

function GalleryCard({ image, onPreview, onDelete, canDelete = false, deleting }) {
  const createdDate = formatCreatedDate(image.createdAt);

  return (
    <article className="gallery-card">
      <button
        type="button"
        onClick={() => onPreview(image)}
        className="gallery-card__preview"
        aria-label={`פתח תמונה: ${image.caption}`}
      >
        <img
          src={image.imageBase64}
          alt={image.caption}
          className="gallery-card__image"
        />
      </button>

      <div className="gallery-card__body">
        <div>
          <h3 className="gallery-card__title">{image.caption}</h3>
          {createdDate && (
            <p className="gallery-card__date">
              הועלה בתאריך: {createdDate}
            </p>
          )}
        </div>

        {canDelete && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(image.id)}
            disabled={deleting}
            className="gallery-card__delete"
          >
            {deleting ? 'מוחק...' : 'מחיקה'}
          </button>
        )}
      </div>
    </article>
  );
}

export default GalleryCard;
