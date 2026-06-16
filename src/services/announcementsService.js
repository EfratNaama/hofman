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

function getCreatedAtMillis(announcement) {
  if (announcement.createdAt?.toMillis) {
    return announcement.createdAt.toMillis();
  }

  if (announcement.createdAt?.toDate) {
    return announcement.createdAt.toDate().getTime();
  }

  return 0;
}

function sortNewestFirst(announcements) {
  return [...announcements].sort((firstAnnouncement, secondAnnouncement) =>
    getCreatedAtMillis(secondAnnouncement) - getCreatedAtMillis(firstAnnouncement)
  );
}

export async function getActiveAnnouncements(maxResults = 3) {
  try {
    const announcementsQuery = query(
      announcementsCollectionRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    const snapshot = await getDocs(announcementsQuery);
    return snapshot.docs.map(normalizeAnnouncement);
  } catch (error) {
    console.error('Failed to load announcements with createdAt ordering:', error);

    const fallbackQuery = query(
      announcementsCollectionRef,
      where('isActive', '==', true)
    );
    const fallbackSnapshot = await getDocs(fallbackQuery);
    return sortNewestFirst(fallbackSnapshot.docs.map(normalizeAnnouncement)).slice(0, maxResults);
  }
}

export async function getAllAnnouncements() {
  try {
    const announcementsQuery = query(
      announcementsCollectionRef,
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(announcementsQuery);
    return snapshot.docs.map(normalizeAnnouncement);
  } catch (error) {
    console.error('Failed to load all announcements with createdAt ordering:', error);

    const fallbackSnapshot = await getDocs(announcementsCollectionRef);
    return sortNewestFirst(fallbackSnapshot.docs.map(normalizeAnnouncement));
  }
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
