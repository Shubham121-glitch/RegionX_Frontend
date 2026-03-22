import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loading from '../../components/loading/Loading';
import homeVideo from '../../assets/bg.mp4';
import './home.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      await axios.post(`${API_URL}/users/saveuser`, userData);
      console.log("User sent to backend:", userData);
    } catch (error) {
      console.error("Error sending user:", error);
    }
  };

  useEffect(() => {

    if (!isLoaded || !user) return;

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

    <div className={`container ${theme}`}>

      {/* LEFT SIDE - Diagonal Background */}
      <div className="left"></div>

      {/* HERO CONTENT - Overlays Both Diagonals */}
      <div className="hero-content">
        <div className="logo">
          🌍 <span>RegionX</span>
        </div>

        <h1>
          Discover Hidden <br />
          Places Across Regions
        </h1>

        <p>
          Explore local services, watch travel shorts, connect with guides
          and experience destinations like never before.
        </p>

        <div className="buttons">

          <SignedOut>
            <button
              className="btn-outline"
              onClick={() => navigate('/sign-in')}
            >
              Sign In
            </button>

            <button
              className="btn-primary"
              onClick={() => navigate('/sign-up')}
            >
              Get Started
            </button>
          </SignedOut>

          <SignedIn>
            <UserButton />
          </SignedIn>

        </div>
      </div>

      {/* RIGHT SIDE - Diagonal Video */}

      <div className="right">

        <video
          autoPlay
          muted
          loop
          playsInline
          className={`bg-video ${videoLoaded ? 'show' : 'hide'}`}
          onLoadedData={() => setVideoLoaded(true)}
        >
          <source src={homeVideo} type="video/mp4" />
        </video>

        <div className="video-overlay"></div>

      </div>

    </div>

  );
}

export default Home;