import React from 'react';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout; 