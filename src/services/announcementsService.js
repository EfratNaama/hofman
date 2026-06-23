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

function logAnnouncementQueryError(operation, error) {
  console.error(
    `Firestore "${ANNOUNCEMENTS_COLLECTION}" query failed while ${operation}:`,
    error
  );

}

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
    logAnnouncementQueryError('loading active announcements ordered by createdAt', error);

    try {
      const fallbackQuery = query(
        announcementsCollectionRef,
        where('isActive', '==', true)
      );
      const fallbackSnapshot = await getDocs(fallbackQuery);
      return sortNewestFirst(fallbackSnapshot.docs.map(normalizeAnnouncement)).slice(0, maxResults);
    } catch (fallbackError) {
      logAnnouncementQueryError('loading active announcements without ordering', fallbackError);
      throw fallbackError;
    }
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
    logAnnouncementQueryError('loading all announcements ordered by createdAt', error);

    try {
      const fallbackSnapshot = await getDocs(announcementsCollectionRef);
      return sortNewestFirst(fallbackSnapshot.docs.map(normalizeAnnouncement));
    } catch (fallbackError) {
      logAnnouncementQueryError('loading all announcements without ordering', fallbackError);
      throw fallbackError;
    }
  }
}

export async function createAnnouncement(announcementData, createdBy) {
  try {
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
  } catch (error) {
    logAnnouncementQueryError('creating an announcement', error);
    throw error;
  }
}

export async function updateAnnouncement(announcementId, announcementData) {
  const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);

  try {
    await updateDoc(announcementRef, {
      title: announcementData.title.trim(),
      message: announcementData.message.trim(),
      isActive: Boolean(announcementData.isActive),
      priority: announcementData.priority || 'normal',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logAnnouncementQueryError(`updating announcement "${announcementId}"`, error);
    throw error;
  }
}

export async function toggleAnnouncementActive(announcementId, isActive) {
  const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);

  try {
    await updateDoc(announcementRef, {
      isActive: Boolean(isActive),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logAnnouncementQueryError(`changing active status for announcement "${announcementId}"`, error);
    throw error;
  }
}

export async function deleteAnnouncement(announcementId) {
  const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);

  try {
    await deleteDoc(announcementRef);
  } catch (error) {
    logAnnouncementQueryError(`deleting announcement "${announcementId}"`, error);
    throw error;
  }
}
