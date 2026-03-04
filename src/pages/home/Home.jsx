import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { IoEarthSharp } from "react-icons/io5";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loading from '../../components/loading/Loading';
import homeVideo from '../../assets/homebgvideo.mp4';
import './home.css';

function Home() {
  const { user, isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('theme') || 'dark');
    };
    
    window.addEventListener('storage', handleThemeChange);
    
    // Check theme periodically since localStorage changes don't trigger storage event in same tab
    const interval = setInterval(() => {
      const currentTheme = localStorage.getItem('theme') || 'dark';
      if (currentTheme !== theme) {
        setTheme(currentTheme);
      }
    }, 100);
    
    return () => {
      window.removeEventListener('storage', handleThemeChange);
      clearInterval(interval);
    };
  }, [theme]);

  const sendUserToBackend = async (userData) => {
    try {
      await axios.post("http://localhost:5000/api/users/saveuser", userData);
      console.log("User sent to backend:", userData);
    } catch (error) {
      console.error("Error sending user:", error);
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) {
      console.log('[Home] Waiting - isLoaded:', isLoaded, 'user:', !!user);
      return;
    }

    console.log('[Home] User loaded:', user.id);
    console.log('[Home] createdAt:', user.createdAt);
    console.log('[Home] updatedAt:', user.updatedAt);

    const isNewUser = user.createdAt === user.updatedAt;
    console.log('[Home] isNewUser:', isNewUser);

    // Always sync user to backend (backend will check if exists)
    console.log('[Home] Sending user to backend...');
    sendUserToBackend({
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      profileImage: user.imageUrl || ''
    });
  }, [isLoaded, user]);

  if (!isLoaded) return <Loading />;

  return (
    <div className={`home-container ${theme}`}>
      {/* Background Video */}
      <video
        className={`home-video ${videoLoaded ? 'show' : 'hide'}`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        key="home-video"
        onLoadedData={() => setVideoLoaded(true)}
      >
        <source src={homeVideo} type="video/mp4" />
      </video>
      
      <div className="home-overlay"></div>
      
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-logo">RegionX</h1>
          <p className="hero-tagline">See More. Feel More. Be More.</p>
          
          <div className="hero-buttons">
            <SignedOut>
              <button className="btn btn-outline" onClick={() => navigate('/sign-in')}>Sign In</button>
              <button className="btn btn-primary" onClick={() => navigate('/sign-up')}>Get Started</button>
            </SignedOut>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;