import { useCallback, useEffect, useState } from 'react';
import {
  deleteGalleryImage,
  getGalleryImages,
  uploadGalleryImage,
} from '../services/galleryService';

export default function useGallery({ canManageGallery = false } = {}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const galleryImages = await getGalleryImages();
      setImages(galleryImages);
    } catch (loadError) {
      setError(loadError.message || 'Could not load gallery images.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const uploadImage = useCallback(async (file, caption) => {
    if (!canManageGallery) {
      const permissionError = new Error('אין לך הרשאה לבצע פעולה זו');
      setError(permissionError.message);
      throw permissionError;
    }

    setUploading(true);
    setError('');

    try {
      await uploadGalleryImage(file, caption);
      await refresh();
    } catch (uploadError) {
      setError(uploadError.message || 'Could not upload image.');
      throw uploadError;
    } finally {
      setUploading(false);
    }
  }, [canManageGallery, refresh]);

  const removeImage = useCallback(async (imageId) => {
    if (!canManageGallery) {
      const permissionError = new Error('אין לך הרשאה לבצע פעולה זו');
      setError(permissionError.message);
      throw permissionError;
    }

    setDeletingId(imageId);
    setError('');

    try {
      await deleteGalleryImage(imageId);
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete image.');
      throw deleteError;
    } finally {
      setDeletingId(null);
    }
  }, [canManageGallery, refresh]);

  return {
    images,
    loading,
    uploading,
    deletingId,
    error,
    refresh,
    uploadImage,
    removeImage,
  };
}
