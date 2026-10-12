Account blocking uses the existing `users/{uid}.status` field. Only the explicit
`inactive` value blocks access; legacy missing statuses keep their existing behavior.
The existing administrator status control restores access by saving `active`, with
no credential, role, registration, or history changes.

AuthContext checks the profile on the server before allowing email or Google login,
and observes subsequent profile changes. Protected routes wait for a server-confirmed
profile. Deactivation clears application authorization, signs out Firebase Auth and
uses the existing toast system. Protected routes then redirect to `/login`.
The inactive-account toast alone uses `autoClose: false` and a fixed toast ID;
closing it does not change authorization.
Profile verification failures deny access; obsolete callbacks and listeners are
cleaned up on logout, account changes and unmount.

Race-condition fix: denial invalidates both the shared callback generation and
pending login attempts before Firebase sign-out completes. A denied session cannot
be restored by a queued profile event or repeated Auth event, including when sign-out
fails. Login and the provider must both finish verification before publishing an
authorized profile, and Login navigates only when the provider confirms the same UID.
ProtectedRoute checks this authorization independently of the account's role.
An explicit new login attempt permits re-verification after administrator reactivation.

Firestore rules check current status on protected operations, independent of token
expiration. Inactive users may still read their own profile to detect deactivation,
and public announcements and center information remain public. Self-service profile
updates cannot change status or role, and inactive users cannot update their profile.
Only existing authorized active administrators can change another user's status.
There is no trusted backend or Firebase Admin SDK in this repository; the secondary
`adminAuth` instance is a client SDK, so Authentication account disabling is not used.

Validation:

```sh
npm test -- --watchAll=false --runInBand src/context/AuthContext.test.jsx src/components/UserForm.test.js src/services/activityRegistrationsService.test.js
npm run build
firebase emulators:exec --only firestore --project demo-account-blocking "node --test scripts/accountBlocking.rules.test.cjs"
```

The rules test requires Java 21+ and a current Firebase CLI. It covers active,
volunteer and legacy access, deactivation with the same authenticated client,
protected reads and registration writes, self-reactivation and privilege escalation,
inactive administrator denial, public reads, and administrator reactivation.
The auth tests cover loading/cache handling, inactive login, live deactivation,
reactivation, errors, stale callbacks and listener cleanup. They exercise the real
Login, ProtectedRoute and AuthProvider together with mocked Firebase and router
navigation, including all three roles, restored inactive sessions, delayed conflicting
checks, sign-out failure, cancellation, and persistent-toast configuration. These
are automated component tests, not live Firebase or browser account verification.

Deployment is required for both the frontend and rules. `firebase.json` now declares
the rules file; the existing hosting-only preview workflow does not deploy rules.
After emulator verification, deploy to the intended Firebase project:

```sh
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

No administrator configuration or data migration is required. These commands have
not been run as part of implementation. Previously delivered browser data cannot
be erased remotely; the rules enforce subsequent server operations.
