import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, LayoutDashboard, Search, MessageSquare, User, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const navLinks = [
    { name: 'Marketplace', path: '/marketplace', icon: <Search size={18} /> },
    { name: 'Community', path: '/feed', icon: <Sparkles size={18} /> },
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Messages', path: '/messages', icon: <MessageSquare size={18} /> },
    { name: 'Profile', path: '/profile', icon: <User size={18} /> },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="glass sticky top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-8 py-4 rounded-full border border-white/20 shadow-lg w-[calc(100%-2rem)] max-w-6xl mt-4">
      <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
        <Sparkles className="text-secondary" />
        <span style={{ fontFamily: 'var(--font-display)' }}>skillSwap</span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`flex items-center gap-2 font-medium transition-colors ${
              isActive(link.path) ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {link.icon}
            {link.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-primary">{user.fullname?.firstname}</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">{user.role}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-3 rounded-2xl bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-white transition-all shadow-sm"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary py-2 px-6">Join skillSwap</Link>
        )}
        <button className="md:hidden text-on-surface">
          <Menu />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
