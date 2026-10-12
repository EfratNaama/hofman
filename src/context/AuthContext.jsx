import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDocFromServer, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

import { toast } from 'react-toastify';

const INACTIVE_MESSAGE = 'החשבון שלך אינו פעיל. יש לפנות למנהל המערכת.';
const isInactive = (profile) => profile?.status === 'inactive';

function inactiveError() {
  return Object.assign(new Error(INACTIVE_MESSAGE), { code: 'auth/account-inactive' });
}

async function checkAccount(user) {
  const snapshot = await getDocFromServer(doc(db, 'users', user.uid));
  if (isInactive(snapshot.data())) {
    throw inactiveError();
  }
  return snapshot;
}

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

async function createFirestoreUser(user, existingSnapshot) {
  if (!user) return { success: false, error: new Error('Missing user object') };

  const userRef = doc(db, 'users', user.uid);
  const existingData = existingSnapshot.exists() ? existingSnapshot.data() : {};
  const existingPhotoURL = existingSnapshot.exists() ? (existingData.photoURL || '') : '';
  const userData = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || existingData.displayName || '',
    provider: user.providerData?.[0]?.providerId || 'password',
    photoURL: existingPhotoURL,
    createdAt: existingData.createdAt || serverTimestamp(),
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

function buildCurrentUser(authUser, profile = {}) {
  return {
    email: authUser.email || profile.email || '',
    displayName: authUser.displayName || profile.displayName || profile.fullName || '',
    photoURL: profile.photoURL || authUser.photoURL || '',
    providerData: authUser.providerData || [],
    ...profile,
    uid: authUser.uid,
  };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState('loading');
  const generation = useRef(0);
  const loginAttempt = useRef(0);
  const stopProfile = useRef(null);
  const blockedUid = useRef(null);
  const authorizedUid = useRef(null);
  const sessionDenied = useRef(false);
  const loginValidationPending = useRef(false);
  const publishProfile = useRef(null);
  const normalizedRole = String(currentUser?.role || userProfile?.role || '').trim().toLowerCase();
  const normalizedUserType = String(currentUser?.userType || userProfile?.userType || '').trim().toLowerCase();
  const isAdmin =
    normalizedRole === 'admin' ||
    normalizedRole === 'manager' ||
    normalizedRole === 'מנהל' ||
    normalizedUserType === 'admin' ||
    normalizedUserType === 'manager';

  const invalidatePending = useCallback(() => {
    ++generation.current;
    ++loginAttempt.current;
  }, []);

  const denySession = useCallback((error, uid) => {
    // Invalidate work synchronously, before waiting for Firebase sign-out.
    invalidatePending();
    stopProfile.current?.();
    stopProfile.current = null;
    authorizedUid.current = null;
    sessionDenied.current = true;
    loginValidationPending.current = false;
    publishProfile.current = null;
    setCurrentUser(null);
    setUserProfile(null);
    setAuthLoading(false);
    if (error.code === 'auth/account-inactive') {
      blockedUid.current = uid;
      setAuthStatus('inactive');
      toast.error(INACTIVE_MESSAGE, { toastId: 'account-inactive', autoClose: false });
    } else {
      setAuthStatus('unauthenticated');
    }
    return signOut(auth).catch(() => {});
  }, [invalidatePending]);

  const signIn = async (authenticate) => {
    const attempt = ++loginAttempt.current;
    ++generation.current;
    stopProfile.current?.();
    stopProfile.current = null;
    blockedUid.current = null;
    sessionDenied.current = false;
    loginValidationPending.current = true;
    publishProfile.current = null;
    authorizedUid.current = null;
    setCurrentUser(null);
    setUserProfile(null);
    setAuthLoading(true);
    setAuthStatus('loading');
    let credential;
    try {
      // A retry after a failed sign-out must establish a fresh Auth session.
      if (auth.currentUser) await signOut(auth);
      credential = await authenticate();
      if (attempt !== loginAttempt.current) {
        if (blockedUid.current === credential.user.uid) throw inactiveError();
        throw Object.assign(new Error('Login cancelled'), { code: 'auth/login-cancelled' });
      }
      await checkAccount(credential.user);
      if (blockedUid.current === credential.user.uid) throw inactiveError();
      if (attempt !== loginAttempt.current) {
        throw Object.assign(new Error('Login cancelled'), { code: 'auth/login-cancelled' });
      }
      loginValidationPending.current = false;
      publishProfile.current?.();
      return { credential, firestoreResult: { success: true } };
    } catch (error) {
      if (attempt === loginAttempt.current) await denySession(error, credential?.user.uid);
      throw error;
    }
  };

  const signInEmail = (email, password) => signIn(() => signInWithEmailAndPassword(auth, email, password));
  const signInGoogle = () => signIn(() => signInWithPopup(auth, googleProvider));
  const signOutUser = () => denySession({ code: 'auth/signed-out' });
  const cancelSignIn = () => denySession({ code: 'auth/login-cancelled' });
  const isSessionAuthorized = useCallback((uid) => authorizedUid.current === uid && blockedUid.current !== uid, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const session = ++generation.current;
      stopProfile.current?.();
      stopProfile.current = null;
      authorizedUid.current = null;
      publishProfile.current = null;
      setAuthLoading(true);
      setCurrentUser(null);
      setUserProfile(null);
      if (!user) {
        setAuthStatus(blockedUid.current ? 'inactive' : 'unauthenticated');
        setAuthLoading(false);
        return;
      }
      if (sessionDenied.current) {
        await denySession(blockedUid.current === user.uid ? inactiveError() : { code: 'auth/login-cancelled' }, user.uid);
        return;
      }
      setAuthStatus('loading');
      const isCurrent = () => session === generation.current;
      const deny = async (error) => {
        if (!isCurrent()) return;
        if (error.code !== 'auth/account-inactive') {
          toast.error('לא ניתן לאמת את פרטי החשבון. יש לנסות שוב.', { toastId: 'account-check-failed' });
        }
        await denySession(error, user.uid);
      };
      try {
        const snapshot = await checkAccount(user);
        if (!isCurrent()) return;
        await createFirestoreUser(user, snapshot);
        if (!isCurrent()) return;
        stopProfile.current = onSnapshot(doc(db, 'users', user.uid), { includeMetadataChanges: true }, (profileSnapshot) => {
          if (!isCurrent()) return;
          const profile = profileSnapshot.data() || { role: '' };
          if (isInactive(profile)) {
            void deny(inactiveError());
            return;
          }
          // Cached or pending client writes cannot grant protected access.
          if (profileSnapshot.metadata.fromCache || profileSnapshot.metadata.hasPendingWrites) return;
          publishProfile.current = () => {
            if (!isCurrent() || sessionDenied.current || loginValidationPending.current) return;
            authorizedUid.current = user.uid;
            setUserProfile({ ...profile, uid: user.uid });
            setCurrentUser(buildCurrentUser(user, profile));
            setAuthLoading(false);
            setAuthStatus('active');
          };
          publishProfile.current();
        }, (error) => { void deny(error); });
      } catch (error) {
        await deny(error);
      }
    });
    return () => {
      invalidatePending();
      authorizedUid.current = null;
      stopProfile.current?.();
      unsubscribe();
    };
  }, [denySession, invalidatePending]);

  const value = {
    currentUser,
    userProfile,
    role: normalizedRole,
    isAdmin,
    loading: authLoading,
    authLoading,
    authStatus,
    isSessionAuthorized,
    signInEmail,
    signInGoogle,
    signOutUser,
    cancelSignIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
