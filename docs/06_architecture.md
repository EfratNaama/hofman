# System Architecture

## Overview
This project is a React + Firebase CRM-style web application.  
It uses a modular, component-based architecture with clear separation of concerns.

## Frontend
- React + Vite
- React Router v6
- Tailwind CSS for styling
- Recharts for dashboard visualizations

## Backend
- Firebase Authentication
- Firestore NoSQL database
- Firebase Storage for file uploads

## Key Concepts
- All Firestore logic lives in `/src/hooks` or `/src/services`
- UI components live in `/src/components`
- Pages live in `/src/pages`
- Auth state is managed via React Context

## Data Flow
1. User logs in via Firebase Auth  
2. AuthContext exposes current user + role  
3. ProtectedRoute checks permissions  
4. Pages fetch data via Firestore hooks  
5. Components render Tailwind UI + Recharts charts
