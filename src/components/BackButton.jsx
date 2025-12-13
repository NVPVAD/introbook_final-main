import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BackButton.css";

const BackButton = ({ customText = "Back", customClass = "" }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page in history
  };

  return (
    <div className={`floating-back-container ${customClass}`}>
      <button
        className="floating-back-button"
        onClick={handleGoBack}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Go back to previous page"
      >
        <div className="button-content">
          <div className="arrow-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 19L5 12L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="button-text">{customText}</span>
        </div>
        <div className="button-glow"></div>
      </button>
    </div>
  );
};

export default BackButton;
