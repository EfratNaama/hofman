import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

const activitiesCollection = collection(db, 'activities');
const announcementsCollection = collection(db, 'announcements');
const galleryCollection = collection(db, 'gallery');
const centerInfoCollection = collection(db, 'center_info');

export async function getUpcomingActivities() {
  const activitiesQuery = query(
    activitiesCollection,
    where('activityDate', '>=', new Date()),
    where('isActive', '==', true),
    orderBy('activityDate', 'asc'),
    limit(5)
  );
  const snapshot = await getDocs(activitiesQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function getLatestAnnouncements() {
  const announcementsQuery = query(
    announcementsCollection,
    orderBy('publishedAt', 'desc'),
    limit(3)
  );
  const snapshot = await getDocs(announcementsQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function getLatestGalleryImages() {
  const galleryQuery = query(
    galleryCollection,
    orderBy('createdAt', 'desc'),
    limit(6)
  );
  const snapshot = await getDocs(galleryQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function getCenterInfo() {
  const centerInfoQuery = query(centerInfoCollection, limit(1));
  const snapshot = await getDocs(centerInfoQuery);
  if (snapshot.empty) {
    return null;
  }
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}
