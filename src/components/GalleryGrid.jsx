import GalleryCard from './GalleryCard';

function GalleryGrid({ images, loading, deletingId, onImageClick, onDelete, canDelete = false }) {
  if (loading) {
    return (
      <div className="gallery-state-card">
        טוען תמונות...
      </div>
    );
  }

  if (!images.length) {
    return (
      <div className="gallery-state-card">
        <h2>אין תמונות בגלריה עדיין</h2>
        <p>
          העלו תמונה חדשה כדי להציג אותה כאן.
        </p>
      </div>
    );
  }

  return (
    <div className="gallery-grid">
      {images.map((image) => (
        <GalleryCard
          key={image.id}
          image={image}
          onPreview={onImageClick}
          onDelete={onDelete}
          canDelete={canDelete}
          deleting={deletingId === image.id}
        />
      ))}
    </div>
  );
}

export default GalleryGrid;
