import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
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
