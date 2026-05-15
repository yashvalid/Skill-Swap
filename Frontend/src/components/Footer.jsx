import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Code, X, Briefcase } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-32 border-t border-outline-variant py-16 px-8 bg-surface-container-low">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-2xl mb-6">
            <Sparkles className="text-secondary" />
            <span style={{ fontFamily: 'var(--font-display)' }}>skillSwap</span>
          </Link>
          <p className="text-on-surface-variant font-medium">
            The Curated Commons for human potential. Exchange expertise, grow together.
          </p>
          <div className="flex gap-4 mt-8">
            <a href="#" className="p-2 rounded-full border border-outline-variant hover:bg-white transition-colors">
              <Code size={20} />
            </a>
            <a href="#" className="p-2 rounded-full border border-outline-variant hover:bg-white transition-colors">
              <X size={20} />
            </a>
            <a href="#" className="p-2 rounded-full border border-outline-variant hover:bg-white transition-colors">
              <Briefcase size={20} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6" style={{ fontFamily: 'var(--font-display)' }}>Explore</h4>
          <ul className="space-y-4">
            <li><Link to="/marketplace" className="text-on-surface-variant hover:text-primary transition-colors">Skills Marketplace</Link></li>
            <li><Link to="/dashboard" className="text-on-surface-variant hover:text-primary transition-colors">Active Swaps</Link></li>
            <li><Link to="/profile" className="text-on-surface-variant hover:text-primary transition-colors">Top Contributors</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6" style={{ fontFamily: 'var(--font-display)' }}>Resources</h4>
          <ul className="space-y-4">
            <li><Link to="/docs" className="text-on-surface-variant hover:text-primary transition-colors">How it Works</Link></li>
            <li><Link to="/docs" className="text-on-surface-variant hover:text-primary transition-colors">Guidelines</Link></li>
            <li><Link to="/docs" className="text-on-surface-variant hover:text-primary transition-colors">Support</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6" style={{ fontFamily: 'var(--font-display)' }}>Newsletter</h4>
          <p className="text-on-surface-variant mb-6 text-sm">Get the latest skill swap opportunities in your inbox.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Email address" 
              className="flex-grow p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:outline-primary outline-offset-0"
            />
            <button className="btn btn-primary px-4">Join</button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-outline-variant text-center text-sm text-on-surface-variant">
        &copy; {new Date().getFullYear()} skillSwap. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
