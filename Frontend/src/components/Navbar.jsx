import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  LayoutDashboard, 
  MessageSquare, 
  User, 
  Menu, 
  X, 
  LogOut, 
  ChevronRight, 
  Layers, 
  ArrowLeftRight,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Marketplace', path: '/marketplace', icon: <Search size={15} /> },
    { name: 'Showcases', path: '/feed', icon: <Layers size={15} /> },
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={15} /> },
    { name: 'Messages', path: '/messages', icon: <MessageSquare size={15} /> },
    { name: 'Docs', path: '/docs', icon: <BookOpen size={15} /> },
  ];

  const isActive = (path) => {
    if (path === '/profile') {
      return location.pathname.startsWith('/profile');
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-[100] w-full bg-[#2F3640]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.12)] transition-colors">
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-none bg-[#6C5CE7] text-white flex items-center justify-center font-bold transition-transform group-hover:scale-105">
            <ArrowLeftRight size={17} strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-[-0.025em] text-[#F5F6FA]">
              SKILL<span className="text-[#55E6C1]">SWAP</span>
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-none bg-[rgba(85,230,193,0.12)] border border-[rgba(85,230,193,0.3)] text-[#55E6C1]">
              PROTO
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links per DESIGN.md: Primary surface background, active item accent indicator, font weight 500 when active */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-none text-sm tracking-[-0.01em] transition-all duration-150 ${
                  active
                    ? 'font-medium text-[#F5F6FA] bg-[#353B48] border border-[rgba(108,92,231,0.5)] shadow-sm'
                    : 'font-normal text-[#A4B0BE] hover:text-[#F5F6FA] hover:bg-[#353B48]/50'
                }`}
              >
                {active && (
                  <span className="w-1.5 h-1.5 rounded-none bg-[#55E6C1]" />
                )}
                {link.icon}
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link 
                to="/profile" 
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-none border transition-all duration-150 ${
                  isActive('/profile')
                    ? 'bg-[#353B48] border-[#6C5CE7] text-[#F5F6FA]'
                    : 'bg-[#353B48]/80 border-[rgba(255,255,255,0.12)] hover:border-[rgba(108,92,231,0.4)] text-[#F5F6FA]'
                }`}
                title="View Profile"
              >
                <div className="w-6 h-6 rounded-none bg-[#6C5CE7] text-white font-mono font-bold text-xs flex items-center justify-center">
                  {user.fullname?.firstname?.[0] || 'U'}
                </div>
                <div className="hidden lg:flex flex-col text-left leading-tight">
                  <span className="text-xs font-medium text-[#F5F6FA] truncate max-w-[110px]">
                    {user.fullname?.firstname}
                  </span>
                  <span className="font-mono text-[9px] text-[#A4B0BE]">
                    {user.role || 'Member'}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 rounded-none text-[#A4B0BE] hover:text-[#FF7675] hover:bg-[rgba(255,118,117,0.1)] transition-colors duration-150"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-secondary text-xs py-2 px-3.5 hidden sm:inline-flex">
                Log In
              </Link>
              <Link to="/login" className="btn btn-cta text-xs py-2 px-4">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-none text-[#F5F6FA] hover:bg-[#353B48] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Collapse Menu below 768px */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgba(255,255,255,0.12)] bg-[#353B48] p-4 space-y-2 shadow-2xl">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center justify-between px-4 py-2.5 rounded-none text-sm tracking-[-0.01em] transition-colors ${
                  active 
                    ? 'bg-[#2B313A] text-[#F5F6FA] font-medium border border-[rgba(108,92,231,0.5)]' 
                    : 'text-[#A4B0BE] hover:text-[#F5F6FA] hover:bg-[#2B313A]/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {link.icon}
                  <span>{link.name}</span>
                </div>
                <ChevronRight size={14} className="text-[#718093]" />
              </Link>
            );
          })}
          
          {user && (
            <Link
              to="/profile"
              className={`flex items-center justify-between px-4 py-2.5 rounded-none text-sm tracking-[-0.01em] transition-colors ${
                isActive('/profile')
                  ? 'bg-[#2B313A] text-[#F5F6FA] font-medium border border-[rgba(108,92,231,0.5)]'
                  : 'text-[#A4B0BE] hover:text-[#F5F6FA] hover:bg-[#2B313A]/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User size={15} />
                <span>My Profile</span>
              </div>
              <ChevronRight size={14} className="text-[#718093]" />
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
