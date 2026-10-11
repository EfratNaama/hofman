import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  query,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

const REGISTRATIONS_COLLECTION = 'activityRegistrations';

const getRegistrationId = (userId, activityId) => `${userId}_${activityId}`;

const normalizeRegistration = (docSnapshot) => ({
  id: docSnapshot.id,
  ...docSnapshot.data(),
});

export async function getUserActivityRegistrations(userId) {
  const registrationsQuery = query(
    collection(db, REGISTRATIONS_COLLECTION),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(registrationsQuery);
  return snapshot.docs.map(normalizeRegistration);
}

export async function getUserAllRegistrations(userId) {
  const registrations = await getUserActivityRegistrations(userId);
  return hydrateRegistrations(registrations);
}

async function hydrateRegistrations(registrations) {

  const registrationsWithActivities = await Promise.all(
    registrations.map(async (registration) => {
      if (!registration.activityId) {
        return { registration, activity: null };
      }

      const activitySnapshot = await getDoc(doc(db, 'activities', registration.activityId));
      return {
        registration,
        activity: activitySnapshot.exists()
          ? { id: activitySnapshot.id, ...activitySnapshot.data() }
        : null,
      };
    })
  );

  return registrationsWithActivities.filter(({ activity }) => Boolean(activity));
}

export async function getUserPaidRegistrations(userId) {
  const registrationsQuery = query(
    collection(db, REGISTRATIONS_COLLECTION),
    where('userId', '==', userId),
    where('paymentStatus', '==', 'paid')
  );
  const snapshot = await getDocs(registrationsQuery);
  const registrations = snapshot.docs.map(normalizeRegistration);

  const paidRegistrationsWithActivities = await Promise.all(
    registrations.map(async (registration) => {
      if (!registration.activityId) {
        return { registration, activity: null };
      }

      const activitySnapshot = await getDoc(doc(db, 'activities', registration.activityId));
      return {
        registration,
        activity: activitySnapshot.exists()
          ? { id: activitySnapshot.id, ...activitySnapshot.data() }
        : null,
      };
    })
  );

  return paidRegistrationsWithActivities.filter(({ activity }) => Boolean(activity));
}

export async function getActivityRegistrations(activityId) {
  const registrationsQuery = query(
    collection(db, REGISTRATIONS_COLLECTION),
    where('activityId', '==', activityId)
  );
  const snapshot = await getDocs(registrationsQuery);
  return snapshot.docs.map(normalizeRegistration);
}

export async function getActivityRegistrationCount(activityId) {
  const registrationsQuery = query(
    collection(db, REGISTRATIONS_COLLECTION),
    where('activityId', '==', activityId)
  );
  const snapshot = await getCountFromServer(registrationsQuery);
  return snapshot.data().count || 0;
}

export async function getActivityRegistrationCounts(activityIds) {
  const uniqueActivityIds = Array.from(new Set(activityIds.filter(Boolean)));
  const counts = await Promise.all(
    uniqueActivityIds.map(async (activityId) => [
      activityId,
      await getActivityRegistrationCount(activityId),
    ])
  );

  return Object.fromEntries(counts);
}

export async function registerForActivity(activity, user) {
  const registrationRef = doc(db, REGISTRATIONS_COLLECTION, getRegistrationId(user.uid, activity.id));
  const existingRegistration = await getDoc(registrationRef);

  if (existingRegistration.exists()) {
    return { alreadyRegistered: true };
  }

  await setDoc(registrationRef, {
    activityId: activity.id,
    activityTitle: activity.title || '',
    userId: user.uid,
    userName: user.fullName || user.displayName || user.name || '',
    userEmail: user.email || '',
    paymentStatus: 'pending',
    registeredAt: serverTimestamp(),
    date: activity.date || '',
    activityDate: activity.activityDate || null,
    time: activity.time || '',
    location: activity.location || '',
    description: activity.description || '',
  });

  return { alreadyRegistered: false };
}

export async function cancelActivityRegistration(activityId, userId) {
  const registrationRef = doc(db, REGISTRATIONS_COLLECTION, getRegistrationId(userId, activityId));
  const registrationSnapshot = await getDoc(registrationRef);

  if (!registrationSnapshot.exists()) {
    return { alreadyCanceled: true };
  }

  const registration = registrationSnapshot.data();

  if (registration.userId !== userId) {
    throw new Error('Cannot cancel a registration that belongs to another user.');
  }

  await deleteDoc(registrationRef);
  return { alreadyCanceled: false };
}

export async function removeActivityRegistration(activityId, registrationId) {
  const registrationRef = doc(db, REGISTRATIONS_COLLECTION, registrationId);
  const registrationSnapshot = await getDoc(registrationRef);

  if (!registrationSnapshot.exists()) {
    return { alreadyRemoved: true };
  }

  const registration = registrationSnapshot.data();

  if (registration.activityId !== activityId) {
    throw new Error('Cannot remove a registration from another activity.');
  }

  await deleteDoc(registrationRef);
  return { alreadyRemoved: false };
}

// Firestore rules restrict this field to active administrators.
export async function markActivityRegistrationPaid(registrationId) {
  await updateDoc(doc(db, REGISTRATIONS_COLLECTION, registrationId), {
    paymentStatus: 'paid',
  });
}

export function subscribeUserAllRegistrations(userId, onChange, onError) {
  let active = true;
  let version = 0;
  const unsubscribe = onSnapshot(
    query(collection(db, REGISTRATIONS_COLLECTION), where('userId', '==', userId)),
    async (snapshot) => {
      const currentVersion = ++version;
      try {
        const registrations = await hydrateRegistrations(snapshot.docs.map(normalizeRegistration));
        if (active && currentVersion === version) onChange(registrations);
      } catch (error) {
        if (active && currentVersion === version) onError(error);
      }
    },
    onError
  );
  return () => { active = false; unsubscribe(); };
}
