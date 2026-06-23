import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home.jsx';
import Users from './components/Users';
import NewUser from './components/NewUser';
import UserDetails from './components/UserDetails';
import EditUser from './components/EditUser';
import Events from './components/Events';
import Gallery from './pages/Gallery';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AccessibilityWidget from './components/AccessibilityWidget';
import Activities from './components/Activities';
import NewActivity from './components/NewActivity';
import ActivityDetails from './components/ActivityDetails';
import EditActivity from './components/EditActivity';
import AdminAnnouncements from './components/AdminAnnouncements';
import Announcements from './components/Announcements';
import AdminDashboard from './pages/AdminDashboard';
import PersonalArea from './pages/PersonalArea';
import ActivityManagementHub from './pages/admin/ActivityManagementHub';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="users/new" element={<ProtectedRoute><NewUser /></ProtectedRoute>} />
            <Route path="users/:id" element={<ProtectedRoute><UserDetails /></ProtectedRoute>} />
            <Route path="users/:id/edit" element={<ProtectedRoute><EditUser /></ProtectedRoute>} />
            <Route path="activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
            <Route path="activities/new" element={<ProtectedRoute requireAdmin><NewActivity /></ProtectedRoute>} />
            <Route path="activities/:id" element={<ProtectedRoute><ActivityDetails /></ProtectedRoute>} />
            <Route path="activities/:id/edit" element={<ProtectedRoute requireAdmin><EditActivity /></ProtectedRoute>} />
            <Route path="my-activities" element={<ProtectedRoute><Navigate to="/personal-area" replace /></ProtectedRoute>} />
            <Route path="personal-area" element={<ProtectedRoute><PersonalArea /></ProtectedRoute>} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="admin/announcements" element={<ProtectedRoute requireAdmin><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/activities" element={<ProtectedRoute requireAdmin><ActivityManagementHub /></ProtectedRoute>} />
            <Route path="events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
            <Route path="login" element={<Login />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <ToastContainer position="top-center" rtl />
      </BrowserRouter>
    </AuthProvider>
  );
}

function Layout() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#f8f5f0] text-slate-800 font-sans">
      <Navbar />
      <main className="w-full">
        <Outlet />
      </main>
      <AccessibilityWidget />
    </div>
  );
}

function NotFoundPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-md text-right">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">העמוד לא נמצא</h2>
        <p className="text-lg text-slate-600 mb-6">
          הקישור אינו תקין. לחצו כדי לחזור לעמוד הבית.
        </p>
        <Link
          to="/"
          className="inline-block rounded-2xl bg-[#d4a373] px-6 py-3 text-lg font-semibold text-white hover:bg-[#c38a5a] transition"
        >
          לעמוד הבית
        </Link>
      </div>
    </section>
  );
}

export default App;
