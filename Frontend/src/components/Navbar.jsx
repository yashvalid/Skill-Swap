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
    <header className="sticky top-0 z-[100] w-full bg-[#202738]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.12)] transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2B3F74] to-[#4A6EC9] text-white flex items-center justify-center font-bold shadow-md shadow-[#2B3F74]/25 transition-transform group-hover:scale-105">
            <ArrowLeftRight size={17} strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg tracking-[-0.025em] text-[#F7F8FC]">
              SKILL<span className="text-[#FFEEA8]">SWAP</span>
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-[rgba(255, 238, 168,0.12)] border border-[rgba(255, 238, 168,0.3)] text-[#FFEEA8]">
              PROTO
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm tracking-[-0.01em] transition-all duration-150 ${
                  active
                    ? 'font-medium text-[#F7F8FC] bg-[#283144] border border-[rgba(43, 63, 116,0.5)] shadow-xs'
                    : 'font-normal text-[#A4B0C6] hover:text-[#F7F8FC] hover:bg-[#283144]/50'
                }`}
              >
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFEEA8]" />
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
                className={`flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all duration-150 ${
                  isActive('/profile')
                    ? 'bg-[#283144] border-[#2B3F74] text-[#F7F8FC]'
                    : 'bg-[#283144]/80 border-[rgba(255,255,255,0.12)] hover:border-[rgba(43, 63, 116,0.4)] text-[#F7F8FC]'
                }`}
                title="View Profile"
              >
                <div className="w-6 h-6 rounded-full bg-[#2B3F74] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {user.fullname?.firstname?.[0] || 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-medium text-[#F7F8FC] truncate max-w-[110px]">
                    {user.fullname?.firstname}
                  </span>
                  <span className="font-mono text-[9px] text-[#A4B0C6]">
                    {user.role || 'Member'}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="hidden md:inline-flex p-2 rounded-lg text-[#A4B0C6] hover:text-[#D72E2B] hover:bg-[rgba(215, 46, 43,0.1)] transition-colors duration-150"
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
            className="md:hidden p-2 rounded-lg text-[#F7F8FC] hover:bg-[#283144] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Collapse Menu below 768px */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgba(255,255,255,0.12)] bg-[#283144] p-4 space-y-2.5 shadow-2xl animate-in fade-in duration-150">
          {user && (
            <div className="p-3 bg-[#202738] border border-[rgba(255,255,255,0.08)] rounded-xl mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#2B3F74] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {user.fullname?.firstname?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#F7F8FC] truncate">
                    {user.fullname?.firstname} {user.fullname?.lastname}
                  </p>
                  <p className="font-mono text-[10px] text-[#A4B0C6] truncate">
                    {user.role || 'Member'}
                  </p>
                </div>
              </div>
              <span className="shrink-0 font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-[rgba(255, 238, 168,0.12)] border border-[rgba(255, 238, 168,0.3)] text-[#FFEEA8] font-semibold">
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
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm tracking-[-0.01em] min-h-[44px] transition-colors ${
                    active 
                      ? 'bg-[#202738] text-[#F7F8FC] font-medium border border-[rgba(43, 63, 116,0.5)]' 
                      : 'text-[#A4B0C6] hover:text-[#F7F8FC] hover:bg-[#202738]/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-[#FFEEA8]' : 'text-[#71809B]'}>{link.icon}</span>
                    <span>{link.name}</span>
                  </div>
                  <ChevronRight size={14} className="text-[#71809B]" />
                </Link>
              );
            })}
            
            {user && (
              <Link
                to="/profile"
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm tracking-[-0.01em] min-h-[44px] transition-colors ${
                  isActive('/profile')
                    ? 'bg-[#202738] text-[#F7F8FC] font-medium border border-[rgba(43, 63, 116,0.5)]'
                    : 'text-[#A4B0C6] hover:text-[#F7F8FC] hover:bg-[#202738]/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User size={15} className={isActive('/profile') ? 'text-[#FFEEA8]' : 'text-[#71809B]'} />
                  <span>My Profile</span>
                </div>
                <ChevronRight size={14} className="text-[#71809B]" />
              </Link>
            )}
          </div>

          {user ? (
            <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#202738] hover:bg-[#D72E2B]/15 text-[#A4B0C6] hover:text-[#D72E2B] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(215, 46, 43,0.3)] text-xs font-mono font-semibold transition-colors"
              >
                <LogOut size={15} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] flex flex-col gap-2">
              <Link
                to="/login"
                className="btn btn-secondary text-xs py-2.5 w-full justify-center text-center font-mono rounded-xl"
              >
                Log In
              </Link>
              <Link
                to="/login"
                className="btn btn-cta text-xs py-2.5 w-full justify-center text-center font-mono rounded-xl"
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
