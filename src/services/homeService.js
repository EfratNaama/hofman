import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getAnnouncements } from './announcementService';

const activitiesCollection = collection(db, 'activities');
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
  const announcements = await getAnnouncements();
  return announcements
    .filter((announcement) => announcement.isActive !== false)
    .slice(0, 3);
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
