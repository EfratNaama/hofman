import {
  collection,
  addDoc,
  arrayUnion,
  getDocs,
  getDoc,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const ANNOUNCEMENTS_COLLECTION = 'announcements';
const USERS_COLLECTION = 'users';
const VISIBLE_ANNOUNCEMENTS_LIMIT = 25;
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

export function subscribeUnreadAnnouncementsCount(userId, onCountChange, onError) {
  if (!userId) {
    onCountChange(0);
    return () => {};
  }

  let activeAnnouncements = [];
  let readAnnouncementIds = new Set();
  let hasAnnouncementsSnapshot = false;
  let hasUserSnapshot = false;

  const emitCount = () => {
    if (!hasAnnouncementsSnapshot || !hasUserSnapshot) return;

    const unreadCount = activeAnnouncements.filter(
      (announcement) => !readAnnouncementIds.has(announcement.id)
    ).length;
    onCountChange(unreadCount);
  };

  const unsubscribeAnnouncements = onSnapshot(
    query(announcementsCollectionRef, orderBy('createdAt', 'desc')),
    (snapshot) => {
      activeAnnouncements = snapshot.docs
        .map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
        .filter((announcement) => announcement.isActive !== false)
        .slice(0, VISIBLE_ANNOUNCEMENTS_LIMIT);
      hasAnnouncementsSnapshot = true;
      emitCount();
    },
    (error) => {
      console.error('Firestore "announcements" query failed while counting unread announcements:', error);
      onError?.(error);
    }
  );

  const unsubscribeUser = onSnapshot(
    doc(db, USERS_COLLECTION, userId),
    (snapshot) => {
      readAnnouncementIds = new Set(
        Array.isArray(snapshot.data()?.announcementReadIds)
          ? snapshot.data().announcementReadIds
          : []
      );
      hasUserSnapshot = true;
      emitCount();
    },
    (error) => {
      console.error('Firestore "users" document read failed while counting unread announcements:', error);
      onError?.(error);
    }
  );

  return () => {
    unsubscribeAnnouncements();
    unsubscribeUser();
  };
}

export async function markAnnouncementsRead(userId, announcementIds) {
  if (!userId || !announcementIds?.length) return;

  const uniqueAnnouncementIds = Array.from(new Set(announcementIds.filter(Boolean)));
  if (!uniqueAnnouncementIds.length) return;

  await setDoc(
    doc(db, USERS_COLLECTION, userId),
    {
      announcementReadIds: arrayUnion(...uniqueAnnouncementIds),
      announcementsReadAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
