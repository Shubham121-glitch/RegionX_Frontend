import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiHome, FiSearch, FiCompass, FiVideo, 
  FiMessageSquare, FiHeart, FiUser, FiMenu, FiGrid, FiSun, FiMoon
} from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa6';
import { SignedIn, SignedOut, UserButton, useUser, SignInButton } from '@clerk/clerk-react';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import ChatNotificationBadge from '../ChatNotificationBadge';
import './sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { unreadCount } = useChatNotifications(user?.id);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const navItems = [
    { label: 'Explore', icon: <FiCompass />, path: '/landing#explore' },
    { label: 'Services', icon: <FiGrid />, path: '/services' },
    { label: 'Shorts', icon: <FiVideo />, path: '/shorts' },
  ];

  const handleNav = (path) => {
    if (path.includes('#')) {
      navigate('/landing');
    } else {
      navigate(path);
    }
  };

  const isActive = (path) => location.pathname === path.split('#')[0];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="global-sidebar">
        <div className="global-logo" onClick={() => navigate('/')}>
          <h2>RegionX</h2>
        </div>
        <nav className="global-nav">
          {navItems.map(item => (
            <button key={item.label} className={`global-nav-item ${isActive(item.path) ? 'active' : ''}`} onClick={() => handleNav(item.path)}>
              <span className="global-icon">{item.icon}</span> <span>{item.label}</span>
            </button>
          ))}

          <SignedIn>
            <button className={`global-nav-item ${isActive('/chats') ? 'active' : ''}`} onClick={() => navigate('/chats')}>
              <div style={{ position: 'relative' }}>
                <span className="global-icon"><FiMessageSquare /></span>
                <ChatNotificationBadge count={unreadCount} isVisible={unreadCount > 0} />
              </div>
              <span>Chats</span>
            </button>
            <button className="global-nav-item" onClick={() => setIsChatOpen(true)}>
              <span className="global-icon"><FaRobot /></span> <span>AI Chat</span>
            </button>
          </SignedIn>

          <button className="global-nav-item" onClick={toggleTheme}>
            <span className="global-icon">{theme === 'dark' ? <FiSun /> : <FiMoon />}</span> <span>Theme</span>
          </button>
          
          <SignedOut>
             <SignInButton mode="modal">
               <button className="global-nav-item">
                 <span className="global-icon"><FiUser /></span> <span>Sign In</span>
               </button>
             </SignInButton>
          </SignedOut>
        </nav>

        <div className="global-nav-footer">
          <SignedIn>
            <div className="global-nav-item user-btn-container">
               <UserButton 
                 userProfileMode="navigation"
                 userProfileUrl="/profile"
                 appearance={{ elements: { rootBox: "scale-125" } }}
               />
               <span style={{marginLeft: '10px'}}>Profile</span>
            </div>
          </SignedIn>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="global-mobile-header">
        <h2 className="global-logo-text" onClick={() => navigate('/')}>RegionX</h2>
        <div className="global-mobile-header-actions">
          <button className="global-icon-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <FiSun size={24} /> : <FiMoon size={24} />}
          </button>
          <SignedIn>
            <button className="global-icon-btn" onClick={() => navigate('/chats')}>
               <div style={{ position: 'relative' }}>
                 <FiMessageSquare size={24} />
                 <ChatNotificationBadge count={unreadCount} isVisible={unreadCount > 0} />
               </div>
            </button>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
               <button className="global-icon-btn"><FiUser size={24} /></button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="global-bottom-nav">
        {navItems.map(item => (
          <button key={item.label} className={`global-bottom-nav-item ${isActive(item.path) ? 'active' : ''}`} onClick={() => handleNav(item.path)}>
            {item.icon}
          </button>
        ))}
        <SignedIn>
          <button className="global-bottom-nav-item" onClick={() => setIsChatOpen(true)}>
            <FaRobot />
          </button>
          <div className="global-bottom-nav-item" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
             <UserButton 
               userProfileMode="navigation"
               userProfileUrl="/profile"
             />
          </div>
        </SignedIn>
      </nav>
    </>
  );
};

export default Sidebar;
