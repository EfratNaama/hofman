import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const ANNOUNCEMENTS_COLLECTION = 'announcements';
const announcementsCollectionRef = collection(db, ANNOUNCEMENTS_COLLECTION);

export async function getAnnouncements() {
  const q = query(announcementsCollectionRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

export async function getAnnouncementById(id) {
  const ref = doc(db, ANNOUNCEMENTS_COLLECTION, id);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error('Announcement not found');
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function createAnnouncement(data) {
  return addDoc(announcementsCollectionRef, {
    title: data.title || '',
    content: data.content || '',
    isActive: data.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateAnnouncement(id, data) {
  const ref = doc(db, ANNOUNCEMENTS_COLLECTION, id);

  return updateDoc(ref, {
    title: data.title || '',
    content: data.content || '',
    isActive: data.isActive ?? true,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAnnouncement(id) {
  const ref = doc(db, ANNOUNCEMENTS_COLLECTION, id);
  return deleteDoc(ref);
}
