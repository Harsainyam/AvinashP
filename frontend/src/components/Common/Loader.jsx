import React from 'react';
import '../../styles/components/Loader.css';

const Loader = ({ fullScreen = true, message = 'Loading...' }) => {
  return (
    <div className={`loader-container ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="loader-content">
        <div className="spinner">
          <div className="double-bounce1"></div>
          <div className="double-bounce2"></div>
        </div>
        {message && <p className="loader-message">{message}</p>}
      </div>
    </div>
  );
};

export default Loader;