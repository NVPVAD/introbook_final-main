import React from 'react';
import './ResponsiveLayout.css';

const ResponsiveLayout = ({ children, className = '', maxWidth = 'xl' }) => {
  const containerClass = `responsive-layout container-${maxWidth} ${className}`;
  
  return (
    <div className={containerClass}>
      {children}
    </div>
  );
};

export default ResponsiveLayout;