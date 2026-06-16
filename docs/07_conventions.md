# Coding Conventions

## File Naming
- Components: PascalCase
- Hooks: useSomething.js
- Context: SomethingContext.jsx
- Pages: PascalCase
- Firestore collections: lowercase plural

## Folder Structure
src/
  components/
  pages/
  hooks/
  context/
  services/
  tools/
  styles/

## UI Conventions
- Tailwind CSS for all styling
- Use Headless UI for modals, menus, tabs
- Keep spacing consistent (Tailwind spacing scale)

## Firebase Conventions
- Use modular SDK imports
- All Firestore queries in hooks or services
- Never query Firestore directly inside components

## Routing
- React Router v6
- Protected routes for authenticated areas
