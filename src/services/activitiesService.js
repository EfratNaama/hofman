import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const ACTIVITIES_COLLECTION = 'activities';

const activitiesCollectionRef = collection(db, ACTIVITIES_COLLECTION);

const toFirestoreDate = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === 'function') {
    return value;
  }

  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return Timestamp.fromDate(parsedDate);
};

const normalizeActivity = (docSnapshot) => ({
  id: docSnapshot.id,
  type: 'קבוע',
  ...docSnapshot.data(),
});

const buildActivityPayload = (activityData, options = {}) => {
  const type = activityData.type || 'קבוע';
  const isOneTime = type === 'חד פעמי';
  const date = isOneTime ? (activityData.date || activityData.activityDate || '') : '';
  const startDate = isOneTime
    ? ''
    : (activityData.startDate || activityData.activityDate || '');
  const endDate = isOneTime ? '' : (activityData.endDate || '');
  const daysOfWeek = isOneTime
    ? []
    : Array.isArray(activityData.daysOfWeek) && activityData.daysOfWeek.length
      ? activityData.daysOfWeek
      : activityData.dayOfWeek
        ? [activityData.dayOfWeek]
        : [];
  const maxParticipants = Number(activityData.maxParticipants);
  const currentParticipants = options.isCreate
    ? 0
    : Number(activityData.currentParticipants || 0);
  const paymentRequired = Boolean(
    activityData.paymentRequired ?? activityData.requiresPayment
  );
  const price = paymentRequired ? Number(activityData.price || 0) : 0;

  return {
    title: activityData.title.trim(),
    description: activityData.description.trim(),
    type,
    location: activityData.location.trim(),
    whatsappLink: activityData.whatsappLink?.trim() || '',
    imageUrl: activityData.imageUrl?.trim() || '',
    category: activityData.category,
    dayOfWeek: isOneTime ? '' : (daysOfWeek[0] || ''),
    daysOfWeek,
    date,
    activityDate: toFirestoreDate(isOneTime ? date : startDate),
    startDate: isOneTime ? null : toFirestoreDate(startDate),
    endDate: isOneTime ? null : toFirestoreDate(endDate),
    time: activityData.time,
    maxParticipants,
    currentParticipants,
    availableSpots: maxParticipants - currentParticipants,
    isActive: Boolean(activityData.isActive),
    requiresPayment: paymentRequired,
    paymentRequired,
    price,
    paymentLink: paymentRequired ? activityData.paymentLink.trim() : '',
    updatedAt: serverTimestamp(),
  };
};

export async function createActivity(activityData, createdBy) {
  const docRef = await addDoc(activitiesCollectionRef, {
    ...buildActivityPayload(activityData, { isCreate: true }),
    createdBy,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getActivities() {
  const activitiesQuery = query(activitiesCollectionRef, orderBy('activityDate', 'asc'));
  const snapshot = await getDocs(activitiesQuery);
  return snapshot.docs.map(normalizeActivity);
}

export function subscribeActivities(onActivitiesChanged, onError) {
  const activitiesQuery = query(activitiesCollectionRef, orderBy('activityDate', 'asc'));

  return onSnapshot(
    activitiesQuery,
    (snapshot) => {
      onActivitiesChanged(snapshot.docs.map(normalizeActivity));
    },
    onError
  );
}

export async function getActivityById(activityId) {
  const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
  const snapshot = await getDoc(activityRef);

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeActivity(snapshot);
}

export async function updateActivity(activityId, activityData) {
  const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
  await updateDoc(activityRef, buildActivityPayload(activityData));
}

export async function deleteActivity(activityId) {
  const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
  await deleteDoc(activityRef);
}
