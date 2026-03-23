import { useLocation } from 'react-router-dom';
import Sidebar from './navigation/Sidebar';
import BackButton from './BackButton';
import './layout.css';

const Layout = ({ children }) => {
  const location = useLocation();

  // Routes where back button should be hidden
  const hideBackButtonRoutes = ['/', '/landing', '/sign-in', '/sign-up'];
  const shouldShowBackButton = !hideBackButtonRoutes.includes(location.pathname);

  return (
    <div className="app-layout">
      <Sidebar />
      
      <main className={`page-content ${shouldShowBackButton ? 'with-back-btn' : ''}`}>
        {shouldShowBackButton && (
          <div className="back-btn-container">
            <BackButton />
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default Layout;
