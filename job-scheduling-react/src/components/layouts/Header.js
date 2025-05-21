import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const menuItems = [
    { text: 'Today\'s Jobs', path: '/dashboard' },
    { text: 'Add New Job', path: '/jobs/add' },
    { text: 'Data Analysis', path: '/analysis' },
    { text: 'Manage', path: '/manage' }
  ];
  
  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <AppBar position="fixed" className="header">
      <Toolbar className="toolbar">
        <Link 
          to="/dashboard"
          className="logo-link"
        >
          Job Scheduler
        </Link>
        <nav className="nav-links">
          {menuItems.map((item) => (
            <Link 
              key={item.text}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.text}
            </Link>
          ))}
        </nav>
        <button 
          className="nav-link sign-out-button" 
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 