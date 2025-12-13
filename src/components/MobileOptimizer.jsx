import { useEffect } from 'react';

const MobileOptimizer = () => {
  useEffect(() => {
    // Force mobile viewport
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
    
    // Add mobile class to body
    document.body.classList.add('mobile-optimized');
    
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      });
    });
    
    return () => {
      document.body.classList.remove('mobile-optimized');
    };
  }, []);
  
  return null;
};

export default MobileOptimizer;