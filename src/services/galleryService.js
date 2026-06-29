import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const galleryCollection = collection(db, 'gallery');

function resizeImageDataUrl(dataUrl, options = {}) {
  const {
    maxDimension = 1200,
    quality = 0.82,
    maxDataUrlLength = 900000,
  } = options;

  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const largestSide = Math.max(image.width, image.height);
      const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext('2d');
      if (!context) {
        resolve(dataUrl);
        return;
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      let nextQuality = quality;
      let resizedDataUrl = canvas.toDataURL('image/jpeg', nextQuality);

      while (resizedDataUrl.length > maxDataUrlLength && nextQuality > 0.45) {
        nextQuality -= 0.08;
        resizedDataUrl = canvas.toDataURL('image/jpeg', nextQuality);
      }

      resolve(resizedDataUrl);
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

export function fileToBase64(file, options = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  }).then((dataUrl) => {
    if (!options.resize) {
      return dataUrl;
    }

    return resizeImageDataUrl(dataUrl, options);
  });
}

export async function uploadGalleryImage(file, caption) {
  if (!file) {
    throw new Error('Image file is required.');
  }

  if (!file.type?.startsWith('image/')) {
    throw new Error('Please choose a valid image file.');
  }

  if (!caption?.trim()) {
    throw new Error('Caption is required.');
  }

  const imageBase64 = await fileToBase64(file);
  const docRef = await addDoc(galleryCollection, {
    imageBase64,
    caption: caption.trim(),
    createdAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    imageBase64,
    caption: caption.trim(),
  };
}

export async function getGalleryImages() {
  const galleryQuery = query(galleryCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(galleryQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export function subscribeLatestGalleryImages(onImagesChanged, onError, imageLimit = 4) {
  const galleryQuery = query(
    galleryCollection,
    orderBy('createdAt', 'desc'),
    limit(imageLimit)
  );

  return onSnapshot(
    galleryQuery,
    (snapshot) => {
      onImagesChanged(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    },
    onError
  );
}

export async function deleteGalleryImage(imageId) {
  if (!imageId) {
    throw new Error('Image id is required.');
  }

  await deleteDoc(doc(db, 'gallery', imageId));
}
