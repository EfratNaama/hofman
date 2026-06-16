# Authentication & Authorization Model

## Roles
- admin
- staff
- volunteer

## Auth Flow
1. User logs in with email/password
2. Firebase Auth returns user object
3. User role is stored in Firestore `/users/{uid}`
4. AuthContext exposes:
   - currentUser
   - role
   - login()
   - logout()

## Protected Routes
- /dashboard → admin, staff
- /clients → admin, staff
- /volunteers → admin
- /profile → all authenticated users

## Firebase Security Rules (Outline)
match /{document=**} {
  allow read, write: if request.auth != null;
}
