// Run only against the local emulator:
// firebase emulators:exec --only firestore --project demo-account-blocking "node --test scripts/accountBlocking.rules.test.cjs"
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } = require('firebase/firestore');

test('account status enforces protected access, administrator updates and reactivation', async () => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Run through firebase emulators:exec');
  const projectId = 'demo-account-blocking';
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  const apps = [];
  const client = (uid) => {
    const app = initializeApp({ projectId, apiKey: 'emulator-only' }, uid || 'anonymous');
    apps.push(app);
    const db = getFirestore(app);
    connectFirestoreEmulator(db, host, Number(port), uid ? { mockUserToken: { sub: uid, user_id: uid } } : {});
    return db;
  };
  const seed = async (path, data) => {
    const fields = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, { stringValue: value }]));
    const response = await fetch(`http://${host}:${port}/v1/projects/${projectId}/databases/(default)/documents/${path}`, {
      method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }),
    });
    assert.ok(response.ok, await response.text());
  };
  const denied = (operation) => assert.rejects(operation, (error) => error.code === 'permission-denied');
  try {
    for (const [uid, role, status] of [['admin', 'admin', 'active'], ['resident', 'resident', 'active'], ['volunteer', 'volunteer', 'active'], ['blockedAdmin', 'admin', 'inactive']]) {
      await seed(`users/${uid}`, { uid, role, status });
    }
    await seed('users/legacy', { uid: 'legacy', role: 'resident' });
    await seed('activities/activity', { title: 'test' });
    await seed('gallery/photo', { title: 'test' });
    await seed('announcements/public', { title: 'test' });
    await seed('center_info/public', { title: 'test' });
    const admin = client('admin');
    const resident = client('resident');
    const volunteer = client('volunteer');
    const legacy = client('legacy');
    const blockedAdmin = client('blockedAdmin');
    const anonymous = client();
    for (const db of [resident, volunteer, legacy, admin]) {
      assert.ok((await getDoc(doc(db, 'activities/activity'))).exists());
    }
    await setDoc(doc(resident, 'activityRegistrations/resident_activity'), { userId: 'resident', activityId: 'activity', paymentStatus: 'pending' });
    await denied(updateDoc(doc(resident, 'users/resident'), { status: 'inactive' }));
    await denied(updateDoc(doc(resident, 'users/resident'), { role: 'admin' }));
    await denied(updateDoc(doc(volunteer, 'users/resident'), { status: 'inactive' }));
    await updateDoc(doc(admin, 'users/resident'), { status: 'inactive' });
    // Same authenticated client/token must lose access immediately.
    assert.equal((await getDoc(doc(resident, 'users/resident'))).data().status, 'inactive');
    for (const path of ['activities/activity', 'gallery/photo', 'activityRegistrations/resident_activity']) {
      await denied(getDoc(doc(resident, path)));
    }
    await denied(getDocs(collection(resident, 'activityRegistrations')));
    await denied(updateDoc(doc(resident, 'users/resident'), { status: 'active' }));
    await denied(deleteDoc(doc(resident, 'users/resident')));
    await denied(updateDoc(doc(resident, 'activityRegistrations/resident_activity'), { note: 'bypass' }));
    await denied(deleteDoc(doc(resident, 'activityRegistrations/resident_activity')));
    await denied(setDoc(doc(resident, 'activityRegistrations/resident_other'), { userId: 'resident', activityId: 'other' }));
    await denied(updateDoc(doc(blockedAdmin, 'users/resident'), { status: 'active' }));
    for (const db of [resident, anonymous]) {
      assert.ok((await getDoc(doc(db, 'announcements/public'))).exists());
      assert.ok((await getDoc(doc(db, 'center_info/public'))).exists());
    }
    await updateDoc(doc(admin, 'users/resident'), { status: 'active' });
    assert.ok((await getDoc(doc(resident, 'activities/activity'))).exists());
    assert.ok((await getDoc(doc(resident, 'activityRegistrations/resident_activity'))).exists());
  } finally {
    await Promise.all(apps.map(deleteApp));
  }
});
