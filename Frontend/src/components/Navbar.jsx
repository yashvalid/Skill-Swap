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
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="w-8 h-8 rounded-none bg-[#6C5CE7] text-white flex items-center justify-center font-bold transition-transform group-hover:scale-105">
            <ArrowLeftRight size={17} strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg tracking-[-0.025em] text-[#F5F6FA]">
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
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link 
                to="/profile" 
                className={`flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-none border transition-all duration-150 ${
                  isActive('/profile')
                    ? 'bg-[#353B48] border-[#6C5CE7] text-[#F5F6FA]'
                    : 'bg-[#353B48]/80 border-[rgba(255,255,255,0.12)] hover:border-[rgba(108,92,231,0.4)] text-[#F5F6FA]'
                }`}
                title="View Profile"
              >
                <div className="w-6 h-6 rounded-none bg-[#6C5CE7] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {user.fullname?.firstname?.[0] || 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
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
                className="hidden md:inline-flex p-2 rounded-none text-[#A4B0BE] hover:text-[#FF7675] hover:bg-[rgba(255,118,117,0.1)] transition-colors duration-150"
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
              <Link to="/login" className="btn btn-cta text-xs py-1.5 px-3 sm:py-2 sm:px-4">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-none text-[#F5F6FA] hover:bg-[#353B48] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Collapse Menu below 768px */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgba(255,255,255,0.12)] bg-[#353B48] p-4 space-y-2.5 shadow-2xl animate-in fade-in duration-150">
          {user && (
            <div className="p-3 bg-[#2B313A] border border-[rgba(255,255,255,0.08)] mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-none bg-[#6C5CE7] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {user.fullname?.firstname?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#F5F6FA] truncate">
                    {user.fullname?.firstname} {user.fullname?.lastname}
                  </p>
                  <p className="font-mono text-[10px] text-[#A4B0BE] truncate">
                    {user.role || 'Member'}
                  </p>
                </div>
              </div>
              <span className="shrink-0 font-mono text-[10px] px-2 py-0.5 bg-[rgba(85,230,193,0.12)] border border-[rgba(85,230,193,0.3)] text-[#55E6C1] font-semibold">
                {user.credits ?? 3} Credits
              </span>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-none text-sm tracking-[-0.01em] min-h-[44px] transition-colors ${
                    active 
                      ? 'bg-[#2B313A] text-[#F5F6FA] font-medium border border-[rgba(108,92,231,0.5)]' 
                      : 'text-[#A4B0BE] hover:text-[#F5F6FA] hover:bg-[#2B313A]/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-[#55E6C1]' : 'text-[#718093]'}>{link.icon}</span>
                    <span>{link.name}</span>
                  </div>
                  <ChevronRight size={14} className="text-[#718093]" />
                </Link>
              );
            })}
            
            {user && (
              <Link
                to="/profile"
                className={`flex items-center justify-between px-3.5 py-3 rounded-none text-sm tracking-[-0.01em] min-h-[44px] transition-colors ${
                  isActive('/profile')
                    ? 'bg-[#2B313A] text-[#F5F6FA] font-medium border border-[rgba(108,92,231,0.5)]'
                    : 'text-[#A4B0BE] hover:text-[#F5F6FA] hover:bg-[#2B313A]/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User size={15} className={isActive('/profile') ? 'text-[#55E6C1]' : 'text-[#718093]'} />
                  <span>My Profile</span>
                </div>
                <ChevronRight size={14} className="text-[#718093]" />
              </Link>
            )}
          </div>

          {user ? (
            <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2B313A] hover:bg-[#FF7675]/15 text-[#A4B0BE] hover:text-[#FF7675] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,118,117,0.3)] text-xs font-mono font-semibold transition-colors"
              >
                <LogOut size={15} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] flex flex-col gap-2">
              <Link
                to="/login"
                className="btn btn-secondary text-xs py-2.5 w-full justify-center text-center font-mono"
              >
                Log In
              </Link>
              <Link
                to="/login"
                className="btn btn-cta text-xs py-2.5 w-full justify-center text-center font-mono"
              >
                Create Account / Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
