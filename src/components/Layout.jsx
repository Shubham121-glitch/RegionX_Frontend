import { useLocation } from 'react-router-dom';
import NavBar from './navigation/Navbar';
import BackButton from './BackButton';
import './layout.css';

const Layout = ({ children }) => {
  const location = useLocation();

  // Routes where back button should be hidden
  const hideBackButtonRoutes = ['/', '/landing', '/sign-in', '/sign-up'];
  const shouldShowBackButton = !hideBackButtonRoutes.includes(location.pathname);

  return (
    <div className="app-layout">
      <NavBar />
      
      {shouldShowBackButton && <BackButton />}
      
      <main className={`page-content ${shouldShowBackButton ? 'with-back-btn' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
