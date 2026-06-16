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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
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
