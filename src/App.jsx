import React from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react';
import Layout from './components/Layout';
import Home from './pages/home/Home'
import Shorts from './pages/Shorts';
import Landing from './pages/landing/Landing'
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import AdminUpload from './pages/admin/AdminUpload';
import RegionDetail from './pages/region/RegionDetail';
import Profile from './pages/profile/Profile';
import EditProfile from './pages/profile/EditProfile';
import CreateBusiness from './pages/business/CreateBusiness';
import CreateBusinessPost from './pages/business/CreateBusinessPost';
import BusinessProfilePublic from './pages/business/BusinessProfilePublic';
import Services from './pages/services/Services';
import ChatPage from './pages/chat/ChatPage';
import SaazWidget from './components/ai-chatbot/SaazWidget';
import './styles/saaz-chatbot.css';

const App = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      <Routes>
        {/* Public routes without Layout */}
        <Route path='/' element={isSignedIn ? <Navigate to='/landing' replace /> : <Home />} />
        <Route path='/index' element={isSignedIn ? <Navigate to='/landing' replace /> : <Home />} />
        <Route path='/sign-in' element={isSignedIn ? <Navigate to='/landing' replace /> : <SignInPage />} />
        <Route path='/sign-up' element={isSignedIn ? <Navigate to='/landing' replace /> : <SignUpPage />} />
        
        {/* Routes with Layout (Navbar + BackButton) */}
        <Route element={<Layout><Outlet /></Layout>}>
          <Route path='/chats' element={isSignedIn ? <ChatPage /> : <Navigate to='/' replace />} />
          <Route path='/chat' element={isSignedIn ? <ChatPage /> : <Navigate to='/' replace />} />
          <Route path='/chat/:businessId' element={isSignedIn ? <ChatPage /> : <Navigate to='/' replace />} />
          <Route path='/landing' element={isSignedIn ? <Landing /> : <Navigate to='/' replace />} />
          <Route path='/region/:id' element={isSignedIn ? <RegionDetail /> : <Navigate to='/' replace />} />
          <Route path='/admin/upload' element={isSignedIn ? <AdminUpload /> : <Navigate to='/' replace />} />
          <Route path='/profile' element={isSignedIn ? <Profile /> : <Navigate to='/' replace />} />
          <Route path='/edit-profile' element={isSignedIn ? <EditProfile /> : <Navigate to='/' replace />} />
          <Route path='/create-business' element={isSignedIn ? <CreateBusiness /> : <Navigate to='/' replace />} />
          <Route path='/create-business-post' element={isSignedIn ? <CreateBusinessPost /> : <Navigate to='/' replace />} />
          <Route path='/business/:businessId' element={<BusinessProfilePublic />} />
          <Route path='/services' element={<Services />} />
          <Route path='/shorts' element={isSignedIn ? <Shorts /> : <Navigate to='/' replace />} />
        </Route>

      </Routes>
      
      {/* Saaz AI Chatbot Widget - available throughout the app */}
      <SaazWidget />
    </>
  )
}

export default App