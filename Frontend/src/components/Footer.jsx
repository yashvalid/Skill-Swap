import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Code, Globe, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('Subscribed to updates!');
    setEmail('');
  };

  return (
    <footer className="mt-24 border-t border-[rgba(255,255,255,0.12)] py-14 bg-[#171D2B] text-[#F7F8FC]">
      <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Brand Column */}
        <div className="md:col-span-4 space-y-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-full bg-[#2B3F74] text-white flex items-center justify-center font-bold">
              <ArrowLeftRight size={16} strokeWidth={2.5} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-[-0.025em] text-[#F7F8FC]">
                SKILLSWAP
              </span>
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-[rgba(255, 238, 168,0.12)] border border-[rgba(255, 238, 168,0.3)] text-[#FFEEA8]">
                V2.0
              </span>
            </div>
          </Link>

          <p className="body-md text-sm text-[#A4B0C6] leading-relaxed">
            Direct peer-to-peer skill exchange. Developers and designers trade 1-on-1 mentorship and build real projects together.
          </p>

          <div className="flex items-center gap-2.5 pt-1">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-[#202738] border border-[rgba(255,255,255,0.12)] text-[#A4B0C6] hover:text-[#FFEEA8] hover:border-[#FFEEA8] transition-colors"
              aria-label="GitHub Repository"
            >
              <Code size={16} />
            </a>
            <a
              href="https://skillswap.io"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-[#202738] border border-[rgba(255,255,255,0.12)] text-[#A4B0C6] hover:text-[#FFEEA8] hover:border-[#FFEEA8] transition-colors"
              aria-label="Official Website"
            >
              <Globe size={16} />
            </a>
            <Link
              to="/docs"
              className="p-2 rounded-xl bg-[#202738] border border-[rgba(255,255,255,0.12)] text-[#A4B0C6] hover:text-[#FFEEA8] hover:border-[#FFEEA8] transition-colors"
              aria-label="Documentation"
            >
              <Terminal size={16} />
            </Link>
          </div>
        </div>

        {/* Directory Links */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="font-mono text-xs uppercase tracking-wider text-[#F7F8FC] font-semibold">
            Directory
          </h4>
          <ul className="space-y-2 text-sm text-[#A4B0C6]">
            <li><Link to="/marketplace" className="hover:text-[#FFEEA8] transition-colors">Skill Marketplace</Link></li>
            <li><Link to="/feed" className="hover:text-[#FFEEA8] transition-colors">Showcases</Link></li>
            <li><Link to="/dashboard" className="hover:text-[#FFEEA8] transition-colors">Active Exchanges</Link></li>
            <li><Link to="/messages" className="hover:text-[#FFEEA8] transition-colors">SkillBot Tutor</Link></li>
          </ul>
        </div>

        {/* Specifications */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="font-mono text-xs uppercase tracking-wider text-[#F7F8FC] font-semibold">
            Platform
          </h4>
          <ul className="space-y-2 text-sm text-[#A4B0C6]">
            <li><Link to="/docs" className="hover:text-[#FFEEA8] transition-colors">How Skill Swapping Works</Link></li>
            <li><Link to="/docs" className="hover:text-[#FFEEA8] transition-colors">Structured Milestones</Link></li>
            <li><Link to="/docs" className="hover:text-[#FFEEA8] transition-colors">Live Video Practice</Link></li>
            <li><Link to="/privacy" className="hover:text-[#FFEEA8] transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Dispatch Newsletter */}
        <div className="md:col-span-4 space-y-3">
          <h4 className="font-mono text-xs uppercase tracking-wider text-[#F7F8FC] font-semibold">
            Community Newsletter
          </h4>
          <p className="text-xs text-[#A4B0C6] leading-relaxed">
            Weekly highlights of community skill swaps, project milestones, and featured members.
          </p>
          <form onSubmit={handleSubscribe} className="space-y-2">
            <div className="input-group">
              <label htmlFor="newsletter-email" className="input-label text-xs">Email Address</label>
              <div className="flex gap-2">
                <input 
                  id="newsletter-email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" 
                  className="input-field text-xs py-2"
                  required
                />
                <button type="submit" className="btn btn-primary text-xs py-2 px-4 shrink-0">
                  Subscribe
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>

      <div className="max-w-[1280px] mx-auto px-6 mt-12 pt-6 border-t border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row items-center justify-between text-xs text-[#71809B]">
        <p className="font-mono">SkillSwap Network &bull; Peer-to-Peer Learning</p>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <Link to="/privacy" className="hover:text-[#FFEEA8] transition-colors underline">
            Privacy Policy
          </Link>
          <span>&bull;</span>
          <Link to="/docs" className="hover:text-[#FFEEA8] transition-colors">
            Documentation
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
