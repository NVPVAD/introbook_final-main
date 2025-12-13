import React from 'react';
import './LoadingDashboard.css';

const LoadingDashboard = () => {
  return (
    <div className="loading-dashboard">
      <div className="loading-header">
        <div className="loading-title"></div>
        <div className="loading-subtitle"></div>
      </div>
      
      <div className="loading-stats-grid">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="loading-stat-card">
            <div className="loading-stat-icon"></div>
            <div className="loading-stat-content">
              <div className="loading-stat-value"></div>
              <div className="loading-stat-title"></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="loading-charts-grid">
        <div className="loading-chart-card">
          <div className="loading-chart-title"></div>
          <div className="loading-chart-content"></div>
        </div>
        <div className="loading-chart-card">
          <div className="loading-chart-title"></div>
          <div className="loading-chart-content"></div>
        </div>
        <div className="loading-chart-card loading-chart-wide">
          <div className="loading-chart-title"></div>
          <div className="loading-chart-content"></div>
        </div>
      </div>
      
      <div className="loading-activities">
        <div className="loading-section-title"></div>
        <div className="loading-activities-grid">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="loading-activity-card">
              <div className="loading-activity-icon"></div>
              <div className="loading-activity-content">
                <div className="loading-activity-text"></div>
                <div className="loading-activity-time"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="loading-actions">
        <div className="loading-section-title"></div>
        <div className="loading-actions-grid">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="loading-action-card">
              <div className="loading-action-icon"></div>
              <div className="loading-action-title"></div>
              <div className="loading-action-desc"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingDashboard;