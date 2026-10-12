import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDocFromServer, onSnapshot, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import ProtectedRoute from '../components/ProtectedRoute';

jest.mock('../firebase', () => ({ auth: {}, db: {}, googleProvider: {} }));
jest.mock('firebase/auth', () => ({ onAuthStateChanged: jest.fn(), signOut: jest.fn(), signInWithEmailAndPassword: jest.fn(), signInWithPopup: jest.fn() }));
jest.mock('firebase/firestore', () => ({ doc: jest.fn(() => ({})), getDocFromServer: jest.fn(), onSnapshot: jest.fn(), setDoc: jest.fn(), serverTimestamp: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { error: jest.fn() } }));
// CRA's Jest resolver cannot resolve the installed router package's exports.
// Mock navigation only; exercise the real Login, route guard and AuthProvider.
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: () => ({ pathname: '/personal-area' }),
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  Navigate: ({ to }) => <span data-testid="redirect">{to}</span>,
}), { virtual: true });

const user = { uid: 'alice', email: 'alice@example.com' };
const snapshot = (profile, fromCache = false) => ({ exists: () => true, data: () => profile, metadata: { fromCache, hasPendingWrites: false } });
let context;
let authChanged;
let profileChanged;
let profileError;
let stopProfile;
let navigate;
function Probe() {
  context = useAuth();
  return <div>{context.authLoading ? 'loading' : context.currentUser ? 'protected' : 'public'}</div>;
}
beforeEach(() => {
  jest.clearAllMocks();
  doc.mockReturnValue({ path: 'users/alice' });
  navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  stopProfile = jest.fn();
  onAuthStateChanged.mockImplementation((auth, callback) => { authChanged = callback; return jest.fn(); });
  onSnapshot.mockImplementation((ref, options, callback, error) => { profileChanged = callback; profileError = error; return stopProfile; });
  getDocFromServer.mockResolvedValue(snapshot({ status: 'active', role: 'resident' }));
  setDoc.mockResolvedValue();
  signOut.mockResolvedValue();
  signInWithEmailAndPassword.mockResolvedValue({ user });
  signInWithPopup.mockResolvedValue({ user });
});

test.each(['active', undefined])('server-confirmed %s profile grants access and deactivation revokes it', async (status) => {
  const view = render(<AuthProvider><Probe /></AuthProvider>);
  await act(async () => { await authChanged(user); });
  expect(screen.getByText('loading')).toBeInTheDocument();
  act(() => profileChanged(snapshot({ status }, true)));
  expect(screen.getByText('loading')).toBeInTheDocument();
  act(() => profileChanged(snapshot({ status })));
  expect(screen.getByText('protected')).toBeInTheDocument();
  await act(async () => profileChanged(snapshot({ status: 'inactive' })));
  expect(screen.getByText('public')).toBeInTheDocument();
  expect(signOut).toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledWith('החשבון שלך אינו פעיל. יש לפנות למנהל המערכת.', { toastId: 'account-inactive', autoClose: false });
  expect(stopProfile).toHaveBeenCalled();
  view.unmount();
});

test('inactive login rejects without writing the profile; reactivation permits the same credentials', async () => {
  render(<AuthProvider><Probe /></AuthProvider>);
  getDocFromServer.mockResolvedValue(snapshot({ status: 'inactive' }));
  await act(async () => {
    await expect(context.signInEmail(user.email, 'password')).rejects.toMatchObject({ code: 'auth/account-inactive' });
  });
  expect(signOut).toHaveBeenCalled();
  expect(setDoc).not.toHaveBeenCalled();
  getDocFromServer.mockResolvedValue(snapshot({ status: 'active' }));
  await act(async () => {
    await expect(context.signInEmail(user.email, 'password')).resolves.toMatchObject({ credential: { user } });
  });
});

test('profile verification and listener errors fail closed', async () => {
  render(<AuthProvider><Probe /></AuthProvider>);
  await act(async () => { await authChanged(user); });
  act(() => profileChanged(snapshot({ status: 'active' })));
  await act(async () => profileError(new Error('permission denied')));
  expect(screen.getByText('public')).toBeInTheDocument();
  getDocFromServer.mockRejectedValue(new Error('offline'));
  await act(async () => { await authChanged(user); });
  await waitFor(() => expect(screen.getByText('public')).toBeInTheDocument());
});

test('an obsolete profile request cannot restore a signed-out session', async () => {
  let resolve;
  getDocFromServer.mockReturnValue(new Promise((done) => { resolve = done; }));
  render(<AuthProvider><Probe /></AuthProvider>);
  let pending;
  act(() => { pending = authChanged(user); });
  await act(async () => { await authChanged(null); resolve(snapshot({ status: 'active' })); await pending; });
  expect(screen.getByText('public')).toBeInTheDocument();
  expect(onSnapshot).not.toHaveBeenCalled();
});

test('a queued active profile cannot restore access after an inactive result, even if sign-out fails', async () => {
  signOut.mockRejectedValue(new Error('network failure'));
  render(<AuthProvider><Probe /></AuthProvider>);
  await act(async () => { await authChanged(user); });
  const queuedCallback = profileChanged;
  act(() => queuedCallback(snapshot({ status: 'active', role: 'admin' })));
  await act(async () => queuedCallback(snapshot({ status: 'inactive', role: 'admin' })));
  act(() => queuedCallback(snapshot({ status: 'active', role: '' })));
  expect(screen.getByText('public')).toBeInTheDocument();
  expect(context.currentUser).toBeNull();
  expect(context.userProfile).toBeNull();
});

const renderLogin = () => {
  const view = render(<AuthProvider><Probe /><Login /><ProtectedRoute><div>private content</div></ProtectedRoute></AuthProvider>);
  fireEvent.change(view.container.querySelector('input[type="email"]'), { target: { value: user.email } });
  fireEvent.change(view.container.querySelector('input[type="password"]'), { target: { value: 'password' } });
  return view;
};

test.each(['admin', 'volunteer', 'resident'])('inactive %s login remains outside protected routes with a persistent toast', async (role) => {
  getDocFromServer.mockResolvedValue(snapshot({ status: 'inactive', role }));
  const view = renderLogin();
  await act(async () => fireEvent.submit(view.container.querySelector('form')));
  expect(context.authStatus).toBe('inactive');
  expect(context.currentUser).toBeNull();
  expect(context.role).toBe('');
  expect(screen.getByTestId('redirect')).toHaveTextContent('/login');
  expect(screen.queryByText('private content')).not.toBeInTheDocument();
  expect(navigate).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledTimes(1);
  expect(toast.error).toHaveBeenCalledWith(expect.any(String), { toastId: 'account-inactive', autoClose: false });
  // A restored Firebase session must remain blocked, independently of the toast.
  toast.error.mockClear();
  await act(async () => { await authChanged(user); });
  await act(async () => { await authChanged(null); });
  expect(context.authStatus).toBe('inactive');
  expect(context.currentUser).toBeNull();
  expect(navigate).not.toHaveBeenCalled();
});

test.each(['admin', 'volunteer', 'resident'])('active %s navigates only after provider authorization and retains its role', async (role) => {
  getDocFromServer.mockResolvedValue(snapshot({ status: 'active', role }));
  const view = renderLogin();
  await act(async () => fireEvent.submit(view.container.querySelector('form')));
  expect(navigate).not.toHaveBeenCalled();
  expect(screen.queryByText('private content')).not.toBeInTheDocument();
  await act(async () => { await authChanged(user); });
  act(() => profileChanged(snapshot({ status: 'active', role }, true)));
  expect(navigate).not.toHaveBeenCalled();
  act(() => profileChanged(snapshot({ status: 'active', role })));
  expect(navigate).toHaveBeenCalledWith('/');
  expect(screen.getByText('private content')).toBeInTheDocument();
  expect(context.role).toBe(role);
  expect(context.isAdmin).toBe(role === 'admin');
});

test('provider deactivation cancels a pending successful login', async () => {
  let finishLoginCheck;
  getDocFromServer.mockImplementationOnce(() => new Promise((resolve) => { finishLoginCheck = resolve; }));
  const view = renderLogin();
  await act(async () => fireEvent.submit(view.container.querySelector('form')));
  await act(async () => { await authChanged(user); });
  await act(async () => profileChanged(snapshot({ status: 'inactive', role: 'admin' })));
  await act(async () => { finishLoginCheck(snapshot({ status: 'active', role: 'admin' })); });
  expect(navigate).not.toHaveBeenCalled();
  expect(context.authStatus).toBe('inactive');
  expect(screen.getByTestId('redirect')).toHaveTextContent('/login');
});

test('inactive session restoration never grants access and reactivation preserves the original administrator role', async () => {
  getDocFromServer.mockResolvedValue(snapshot({ status: 'inactive', role: 'admin' }));
  const view = renderLogin();
  await act(async () => { await authChanged(user); });
  expect(context.authStatus).toBe('inactive');
  expect(screen.getByTestId('redirect')).toHaveTextContent('/login');
  expect(onSnapshot).not.toHaveBeenCalled();
  getDocFromServer.mockResolvedValue(snapshot({ status: 'active', role: 'admin' }));
  await act(async () => fireEvent.submit(view.container.querySelector('form')));
  await act(async () => { await authChanged(user); });
  act(() => profileChanged(snapshot({ status: 'active', role: 'admin' })));
  expect(context.role).toBe('admin');
  expect(context.isAdmin).toBe(true);
  expect(navigate).toHaveBeenCalledWith('/');
  expect(setDoc).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ role: expect.anything() }), expect.anything());
});

test('inactive Google login clears authorization too', async () => {
  render(<AuthProvider><Probe /></AuthProvider>);
  getDocFromServer.mockResolvedValue(snapshot({ status: 'inactive', role: 'volunteer' }));
  await act(async () => {
    await expect(context.signInGoogle()).rejects.toMatchObject({ code: 'auth/account-inactive' });
  });
  expect(context.authStatus).toBe('inactive');
  expect(context.isSessionAuthorized(user.uid)).toBe(false);
});

test('an active listener cannot grant access while the login status check is pending and later denies access', async () => {
  let finishLoginCheck;
  getDocFromServer.mockImplementationOnce(() => new Promise((resolve) => { finishLoginCheck = resolve; }));
  const view = renderLogin();
  await act(async () => fireEvent.submit(view.container.querySelector('form')));
  await act(async () => { await authChanged(user); });
  act(() => profileChanged(snapshot({ status: 'active', role: 'admin' })));
  expect(context.currentUser).toBeNull();
  expect(screen.queryByText('private content')).not.toBeInTheDocument();
  await act(async () => { finishLoginCheck(snapshot({ status: 'inactive', role: 'admin' })); });
  expect(context.authStatus).toBe('inactive');
  expect(navigate).not.toHaveBeenCalled();
  expect(screen.getByTestId('redirect')).toHaveTextContent('/login');
});

test('cancelling a slow login invalidates its later success and restored authentication event', async () => {
  let finishLoginCheck;
  getDocFromServer.mockImplementationOnce(() => new Promise((resolve) => { finishLoginCheck = resolve; }));
  const view = renderLogin();
  await act(async () => fireEvent.submit(view.container.querySelector('form')));
  await act(async () => { await context.cancelSignIn(); });
  await act(async () => { finishLoginCheck(snapshot({ status: 'active', role: 'admin' })); });
  await act(async () => { await authChanged(user); });
  expect(context.currentUser).toBeNull();
  expect(context.authStatus).toBe('unauthenticated');
  expect(navigate).not.toHaveBeenCalled();
  expect(screen.queryByText('private content')).not.toBeInTheDocument();
});
