import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  Layers, 
  LayoutDashboard, 
  MessageSquare, 
  User, 
  LogIn 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    if (path === '/profile') {
      return location.pathname.startsWith('/profile');
    }
    return location.pathname === path;
  };

  const navItems = [
    { label: 'Explore', path: '/marketplace', icon: Search },
    { label: 'Showcases', path: '/feed', icon: Layers },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { 
      label: user ? 'Profile' : 'Sign In', 
      path: user ? '/profile' : '/login', 
      icon: user ? User : LogIn,
      isAvatar: Boolean(user)
    },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#242A32]/95 backdrop-blur-xl border-t border-[rgba(255,255,255,0.1)] px-2 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[56px] min-h-[48px] active:scale-95 ${
                active
                  ? 'text-[#55E6C1] bg-[#353B48]/90 shadow-xs'
                  : 'text-[#A4B0BE] hover:text-[#F5F6FA] hover:bg-[#2B313A]/50'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {item.isAvatar ? (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                    active ? 'bg-[#55E6C1] text-[#242A32]' : 'bg-[#6C5CE7] text-white'
                  }`}>
                    {user?.fullname?.firstname?.[0] || 'U'}
                  </div>
                ) : (
                  <Icon size={19} strokeWidth={active ? 2.5 : 2} />
                )}
                {active && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#55E6C1]" />
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-tight mt-1 leading-none ${
                active ? 'text-[#55E6C1] font-bold' : 'text-[#A4B0BE]'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
