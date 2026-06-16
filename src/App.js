import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Users from './components/Users';
import NewUser from './components/NewUser';
import UserDetails from './components/UserDetails';
import EditUser from './components/EditUser';
import Events from './components/Events';
import Gallery from './components/Gallery';
import Login from './components/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="users" element={<Users />} />
          <Route path="users/new" element={<NewUser />} />
          <Route path="users/:id" element={<UserDetails />} />
          <Route path="users/:id/edit" element={<EditUser />} />
          <Route path="events" element={<Events />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="login" element={<Login />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#f8f5f0] text-slate-800 font-sans">
      <Navbar />
      <main className="w-full">
        <Outlet />
      </main>
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
        <Link to="/" className="inline-block rounded-2xl bg-[#d4a373] px-6 py-3 text-lg font-semibold text-white hover:bg-[#c38a5a] transition">
          לעמוד הבית
        </Link>
      </div>
    </section>
  );
}

export default App;
