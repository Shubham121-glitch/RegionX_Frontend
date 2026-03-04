import React, { useEffect, useState } from 'react'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { useUser } from '@clerk/clerk-react';
import { FiMoon, FiSun, FiUser, FiGrid } from 'react-icons/fi'
import { FaBarsStaggered, FaComments } from 'react-icons/fa6'
import { FaXmark } from 'react-icons/fa6'
import { IoEarthSharp } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { useChatNotifications } from '../../hooks/useChatNotifications'
import ChatNotificationBadge from '../ChatNotificationBadge'
import './navbar.css'

const NavBar = () => {
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();
  const { unreadCount } = useChatNotifications(user?.id);

  const [Theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', Theme);
    localStorage.setItem('theme', Theme);
  }, [Theme])

  useEffect(() => {
    const handleScroll = () => {
      // Get viewport height to detect when navbar hits solid background section
      const vh = window.innerHeight;
      setIsScrolled(window.scrollY > vh - 80); // 80px offset for navbar height
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const ToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  const toggleMenu = () => {
    setIsMenuActive(!isMenuActive);
  }

  return (
    <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>
      <nav className='navbar-container'>
        <a href="/" className='navbar-logo'>
          <IoEarthSharp className='logo-icon' />
          <span>Region<span className='logo-x'>X</span></span>
          
        </a>

        <div className="navbar-actions">
          <a href="#explore" className="nav-link-simple">Explore</a>
          <button 
            className="nav-link-simple nav-btn"
            onClick={() => navigate('/services')}
          >
            <FiGrid /> Services
          </button>
          <button 
            className="nav-link-simple nav-btn"
            onClick={() => navigate('/shorts')}
          >
            <span role="img" aria-label="Shorts" style={{fontSize:'1.3rem',verticalAlign:'middle'}}>🎬</span> Shorts
          </button>
          <SignedIn>
            <button 
              className="nav-link-simple nav-btn chat-btn"
              onClick={() => navigate('/chats')}
            >
              <FaComments /> Chats
              <ChatNotificationBadge count={unreadCount} isVisible={unreadCount > 0} />
            </button>
          </SignedIn>
          <a href="#ai-chat" className="nav-link-simple">AI Chat</a>
          
          <button className='theme-toggle' onClick={ToggleTheme}>
            {Theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
          
          <SignedIn>
            <UserButton 
              userProfileMode="navigation"
              userProfileUrl="/profile"
            />
          </SignedIn>
          
          <SignedOut>
            <button 
              className="profile-btn"
              onClick={() => navigate('/sign-in')}
            >
              Sign In
            </button>
          </SignedOut>

          <button className='menu-toggle' onClick={toggleMenu}>
            {isMenuActive ? <FaXmark /> : <FaBarsStaggered />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMenuActive ? 'active' : ''}`}>
          <a href="#explore" className="mobile-link">Explore</a>
          <button 
            className="mobile-link mobile-nav-btn"
            onClick={() => { navigate('/services'); setIsMenuActive(false); }}
          >
            Services
          </button>
          <button 
            className="mobile-link mobile-nav-btn"
            onClick={() => { navigate('/shorts'); setIsMenuActive(false); }}
          >
            <span role="img" aria-label="Shorts" style={{fontSize:'1.2rem',verticalAlign:'middle'}}>🎬</span> Shorts
          </button>
          <SignedIn>
            <button 
              className="mobile-link mobile-nav-btn"
              onClick={() => { navigate('/chats'); setIsMenuActive(false); }}
            >
              <FaComments /> Chats
              <ChatNotificationBadge count={unreadCount} isVisible={unreadCount > 0} />
            </button>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className='btn btn-ghost full-width'>Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className='btn btn-primary full-width'>Get Started</button>
            </SignUpButton>
          </SignedOut>
        </div>
      </nav>
    </header>
  )
}

export default NavBar