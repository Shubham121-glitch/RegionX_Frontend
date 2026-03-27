import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import './backButton.css';

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // If there's history, go back; otherwise go to profile
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };

  return (
    <button className="back-button" onClick={handleBack} title="Go back">
      <FiArrowLeft />
    </button>
  );
};

export default BackButton;
