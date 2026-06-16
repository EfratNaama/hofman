import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser as deleteAuthUser, signOut } from 'firebase/auth';
import { adminAuth, db } from '../firebase';

const USERS_COLLECTION = 'users';

const usersCollectionRef = collection(db, USERS_COLLECTION);

const toFirestoreDate = (value) => {
  if (!value) {
    return serverTimestamp();
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return serverTimestamp();
  }

  return Timestamp.fromDate(parsedDate);
};



const normalizeUser = (docSnapshot) => ({
  id: docSnapshot.id,
  ...docSnapshot.data(),
});

export async function getUsers() {
  const usersQuery = query(usersCollectionRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(usersQuery);
  return snapshot.docs.map(normalizeUser);
}

export async function getUserById(userId) {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeUser(snapshot);
}

export async function createUser(userData) {
  
  const email = userData.email.trim();
  let authUser = null;

  try {
    const userCredential = await createUserWithEmailAndPassword(adminAuth, email, '123456');
    authUser = userCredential.user;
    const userRef = doc(db, USERS_COLLECTION, authUser.uid);

    await setDoc(userRef, {
      uid: authUser.uid,
      fullName: userData.fullName.trim(),
      email,
      phone: userData.phone.trim(),
      role: userData.role,
      status: userData.status,
      createdAt: toFirestoreDate(userData.createdAt),
      updatedAt: serverTimestamp(),
    });

    return authUser.uid;
  } catch (error) {
    if (authUser) {
      await deleteAuthUser(authUser).catch(() => {});
    }

    throw error;
  } finally {
    await signOut(adminAuth).catch(() => {});
  }
}

export async function updateUser(userId, userData) {
  const userRef = doc(db, USERS_COLLECTION, userId);

  await updateDoc(userRef, {
    fullName: userData.fullName?.trim() || '',
    email: userData.email?.trim() || '',
    phone: userData.phone?.trim() || '',
    status: userData.status || 'active',
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUser(userId) {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await deleteDoc(userRef);
}
