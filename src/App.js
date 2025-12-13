import React from 'react';
import Signup from './pages/signup';
import Signin from './pages/signin';
import Home from './pages/home'; // Import the Home page
import Profile from './pages/profile';
import EditProfile from './pages/edit-profile';
import FamilyDetails from './pages/family-details';
import FamilyView from './pages/family-view';
import Dashboard from './pages/dashboard'; // Assuming Dashboard is still needed
import Connections from './pages/connections'; // Import the Connections page
import Messages from './pages/messages'; // Import the Messages page
import Events from './pages/events'; // Import the Events page
import FamilyProfile from './pages/family-profile'; // Import the Family Profile page
import AdminPage from './pages/admin'; // Import the Admin page
import MobileLogin from './pages/mobile-login';
import ScrollToTop from './components/ScrollToTop';
import ViewportMeta from './components/ViewportMeta';
import MobileOptimizer from './components/MobileOptimizer';
import MobileMenu from './components/MobileMenu';
import { SidebarProvider } from './contexts/SidebarContext';
import { LanguageProvider } from './contexts/LanguageContext';
import LanguageToggle from './components/LanguageToggle';
import { Routes, Route } from 'react-router-dom';
import './components/ResponsiveLayout.css';
import './styles/GlobalResponsive.css';

function App() {
  return (
    <LanguageProvider>
      <SidebarProvider>
        <ViewportMeta />
        <MobileOptimizer />
        {!['/', '/signin', '/signup', '/admin'].includes(window.location.pathname) && <MobileMenu />}
        {!['/', '/signin', '/signup', '/admin'].includes(window.location.pathname) && <LanguageToggle />}
        <ScrollToTop />
        <Routes>
      <Route path="/" element={<Signin />} />        {/* Signin page at / */}
      <Route path="/signin" element={<Signin />} />  {/* Signin page also at /signin */}
      <Route path="/signup" element={<Signup />} />{/* Signup at /signup */}
      <Route path="/home" element={<Home />} />    {/* Home page at /home */}
      <Route path="/profile" element={<Profile />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/family-details" element={<FamilyDetails />} />
      <Route path="/family-view" element={<FamilyView />} />
      <Route path="/connections" element={<Connections />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/events" element={<Events />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/mobile-login" element={<MobileLogin />} />
      <Route path="/profile/:id" element={<Profile />} />
      <Route path="/family-profile/:id" element={<FamilyProfile />} />
        </Routes>
      </SidebarProvider>
    </LanguageProvider>
  );
}

export default App;
