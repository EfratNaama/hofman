import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

const ANNOUNCEMENTS_COLLECTION = 'announcements';
const announcementsCollectionRef = collection(db, ANNOUNCEMENTS_COLLECTION);

const normalizeAnnouncement = (docSnapshot) => ({
  id: docSnapshot.id,
  ...docSnapshot.data(),
});

export async function getActiveAnnouncements(maxResults = 3) {
  const announcementsQuery = query(
    announcementsCollectionRef,
    where('isActive', '==', true),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );
  const snapshot = await getDocs(announcementsQuery);
  return snapshot.docs.map(normalizeAnnouncement);
}

export async function getAllAnnouncements() {
  const announcementsQuery = query(
    announcementsCollectionRef,
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(announcementsQuery);
  return snapshot.docs.map(normalizeAnnouncement);
}

export async function createAnnouncement(announcementData, createdBy) {
  const docRef = await addDoc(announcementsCollectionRef, {
    title: announcementData.title.trim(),
    message: announcementData.message.trim(),
    isActive: Boolean(announcementData.isActive),
    priority: announcementData.priority || 'normal',
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateAnnouncement(announcementId, announcementData) {
  const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);

  await updateDoc(announcementRef, {
    title: announcementData.title.trim(),
    message: announcementData.message.trim(),
    isActive: Boolean(announcementData.isActive),
    priority: announcementData.priority || 'normal',
    updatedAt: serverTimestamp(),
  });
}

export async function toggleAnnouncementActive(announcementId, isActive) {
  const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);

  await updateDoc(announcementRef, {
    isActive: Boolean(isActive),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAnnouncement(announcementId) {
  const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);
  await deleteDoc(announcementRef);
}
