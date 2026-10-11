import { doc, getDoc, onSnapshot, query, updateDoc, where, deleteDoc } from 'firebase/firestore';
import { markActivityRegistrationPaid, subscribeUserAllRegistrations, removeActivityRegistration } from './activityRegistrationsService';
jest.mock('../firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'registrations'),
  doc: jest.fn((db, collection, id) => ({ collection, id })),
  query: jest.fn((...args) => args), where: jest.fn((...args) => args),
  onSnapshot: jest.fn(), updateDoc: jest.fn(), getDoc: jest.fn(),
  deleteDoc: jest.fn(), getDocs: jest.fn(), getCountFromServer: jest.fn(),
  serverTimestamp: jest.fn(), setDoc: jest.fn(),
}));
beforeEach(() => {
  jest.clearAllMocks();
  doc.mockImplementation((db, collection, id) => ({ collection, id }));
  where.mockImplementation((...args) => args);
  query.mockImplementation((...args) => args);
});
test('marks only the selected registration paid without replacing its fields', async () => {
  await markActivityRegistrationPaid('alice_activity-a');
  expect(doc).toHaveBeenCalledWith({}, 'activityRegistrations', 'alice_activity-a');
  expect(updateDoc).toHaveBeenCalledTimes(1);
  expect(updateDoc).toHaveBeenCalledWith({ collection: 'activityRegistrations', id: 'alice_activity-a' }, { paymentStatus: 'paid' });
  expect(deleteDoc).not.toHaveBeenCalled();
});
test('subscribes to the current user and forwards pending then paid snapshots', async () => {
  const stop = jest.fn();
  onSnapshot.mockReturnValue(stop);
  getDoc.mockResolvedValue({ exists: () => true, id: 'activity-a', data: () => ({ title: 'Activity A' }) });
  const changed = jest.fn(); const failed = jest.fn();
  const unsubscribe = subscribeUserAllRegistrations('alice', changed, failed);
  expect(where).toHaveBeenCalledWith('userId', '==', 'alice');
  expect(query).toHaveBeenCalled();
  const receive = onSnapshot.mock.calls[0][1];
  const snapshot = (status) => ({ docs: [{ id: 'alice_activity-a', data: () => ({ userId: 'alice', activityId: 'activity-a', ...(status ? { paymentStatus: status } : {}) }) }] });
  await receive(snapshot());
  expect(changed.mock.calls[0][0][0].registration.paymentStatus).toBeUndefined();
  await receive(snapshot('paid'));
  expect(changed.mock.calls[1][0][0].registration.paymentStatus).toBe('paid');
  unsubscribe();
  expect(stop).toHaveBeenCalledTimes(1);
  await receive(snapshot('pending'));
  expect(changed).toHaveBeenCalledTimes(2);
  expect(failed).not.toHaveBeenCalled();
});
test('propagates a rejected payment write', async () => {
  updateDoc.mockRejectedValueOnce(new Error('permission-denied'));
  await expect(markActivityRegistrationPaid('alice_activity-a')).rejects.toThrow('permission-denied');
});
test('removal still verifies activity ownership and deletes only the registration', async () => {
  getDoc.mockResolvedValue({ exists: () => true, data: () => ({ activityId: 'activity-a' }) });
  await expect(removeActivityRegistration('activity-b', 'alice_activity-a')).rejects.toThrow('another activity');
  expect(deleteDoc).not.toHaveBeenCalled();
  await expect(removeActivityRegistration('activity-a', 'alice_activity-a')).resolves.toEqual({ alreadyRemoved: false });
  expect(deleteDoc).toHaveBeenCalledWith({ collection: 'activityRegistrations', id: 'alice_activity-a' });
});
