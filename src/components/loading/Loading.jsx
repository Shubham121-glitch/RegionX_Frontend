import { IoEarthSharp } from "react-icons/io5";
import './loading.css';

function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="earth-wrapper">
          <IoEarthSharp className="loading-earth" />
          <div className="orbit-ring"></div>
          <div className="orbit-ring ring-2"></div>
        </div>
        <h2 className="loading-text">RegionX</h2>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

export default Loading;
