import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

async function createFirestoreUser(user) {
  if (!user) return { success: false, error: new Error('Missing user object') };

  const userRef = doc(db, 'users', user.uid);
  const userData = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    provider: user.providerData?.[0]?.providerId || 'password',
    photoURL: user.photoURL || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    console.log('createFirestoreUser: setting document', userRef.path, userData);
    
    // Add 5 second timeout to Firestore write
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore write timeout')), 5000)
    );
    
    await Promise.race([
      setDoc(userRef, userData, { merge: true }),
      timeoutPromise
    ]);
    
    console.log('createFirestoreUser: document saved', user.uid);
    return { success: true };
  } catch (error) {
    console.warn('createFirestoreUser failed', error.code, error.message);
    return { success: false, error };
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const signInEmail = async (email, password) => {
    console.log('signInEmail: starting login for', email);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      console.log('signInEmail: auth success', credential.user.uid);

      const firestoreResult = await createFirestoreUser(credential.user);
      if (!firestoreResult.success) {
        console.warn('signInEmail: Firestore write failed', firestoreResult.error.code, firestoreResult.error.message);
      }

      return { credential, firestoreResult };
    } catch (error) {
      console.error('signInEmail error', error.code, error.message);
      throw error;
    }
  };

  const signInGoogle = async () => {
    console.log('signInGoogle: starting login');

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      console.log('signInGoogle: auth success', credential.user.uid);

      const firestoreResult = await createFirestoreUser(credential.user);
      if (!firestoreResult.success) {
        console.warn('signInGoogle: Firestore write failed', firestoreResult.error.code, firestoreResult.error.message);
      }

      return { credential, firestoreResult };
    } catch (error) {
      console.error('signInGoogle error', error.code, error.message);
      throw error;
    }
  };

  const signOutUser = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setUserProfile(null);

      if (user) {
        try {
          await createFirestoreUser(user);
          const userSnapshot = await getDoc(doc(db, 'users', user.uid));

          if (userSnapshot.exists()) {
            setUserProfile({
              uid: user.uid,
              ...userSnapshot.data(),
            });
          } else {
            setUserProfile({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: '',
            });
          }
        } catch (error) {
          console.warn('Failed to load authenticated user profile:', error);
        }
      }

      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    role: userProfile?.role || '',
    loading: authLoading,
    authLoading,
    signInEmail,
    signInGoogle,
    signOutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
