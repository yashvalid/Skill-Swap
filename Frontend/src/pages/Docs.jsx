import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  FileText, 
  Layout, 
  CheckCircle2 
} from 'lucide-react';

const Docs = () => {
  const [activeSection, setActiveSection] = useState('introduction');

  const scrollTo = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* Header */}
      <header className="mb-8 sm:mb-12 text-center">
        <div className="inline-flex items-center gap-1.5 tag-chip mb-3">
          <BookOpen size={14} />
          <span>COMMUNITY GUIDELINES</span>
        </div>
        <h1 className="heading-h1 text-[#F5F6FA]">
          How SkillSwap Works & Guidelines
        </h1>
        <p className="body-md text-sm text-[#A4B0BE] max-w-2xl mx-auto mt-2 leading-relaxed">
          Learn how mutual matching, 1-on-1 video calls, and trust guidelines work across the platform.
        </p>
      </header>

      {/* Mobile Quick-Jump Pills */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-[rgba(255,255,255,0.08)] scrollbar-none">
        {[
          { id: "introduction", title: "MISSION", icon: <FileText size={13} /> },
          { id: "product-requirements", title: "MATCHING & PRACTICE", icon: <Layout size={13} /> },
          { id: "safety-trust", title: "SAFETY & TRUST", icon: <ShieldCheck size={13} /> }
        ].map((link) => (
          <button
            key={link.id}
            onClick={() => scrollTo(link.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono whitespace-nowrap border transition-colors ${
              activeSection === link.id
                ? 'bg-[#6C5CE7] text-white border-[#6C5CE7] font-semibold'
                : 'bg-[#2B313A] text-[#A4B0BE] border-[rgba(255,255,255,0.1)]'
            }`}
          >
            {link.icon}
            <span>{link.title}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 hidden md:block">
          <nav className="sticky top-24 space-y-1 bg-[#353B48] p-2 rounded-xl border border-[rgba(255,255,255,0.12)]">
            {[
              { id: "introduction", title: "OUR MISSION", icon: <FileText size={15} /> },
              { id: "product-requirements", title: "MATCHING & PRACTICE", icon: <Layout size={15} /> },
              { id: "safety-trust", title: "SAFETY & TRUST", icon: <ShieldCheck size={15} /> }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left ${
                  activeSection === link.id
                    ? 'bg-[#6C5CE7] text-white font-semibold shadow-xs'
                    : 'text-[#A4B0BE] hover:text-[#F5F6FA] hover:bg-[#2B313A]'
                }`}
              >
                {link.icon}
                <span className="font-mono text-[11px]">{link.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-10">
          <section id="introduction" className="ui-card p-6 sm:p-8 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
            <span className="tag-chip text-[9px] mb-2 inline-block">SECTION 1</span>
            <h2 className="heading-h2 text-[#F5F6FA] mb-4">The Peer Exchange Philosophy</h2>
            <div className="body-md text-sm text-[#A4B0BE] space-y-4 leading-relaxed">
              <p>
                SkillSwap replaces passive tutorial watching with active peer-to-peer learning. Instead of treating skills as a paywalled commodity, members teach and learn directly from each other.
              </p>
              <p>
                Peer accountability drives real retention: when two people give direct feedback on real projects, language practice, or creative skills, learning happens much faster than solo studying.
              </p>
            </div>
          </section>

          <section id="product-requirements" className="ui-card p-6 sm:p-8 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
            <span className="tag-chip text-[9px] mb-2 inline-block">SECTION 2</span>
            <h2 className="heading-h2 text-[#F5F6FA] mb-4">Swap Matching & Practice</h2>
            <div className="space-y-4">
              {[
                {
                  title: "Direct Peer Matching",
                  desc: "Our matching system pairs Member A (teaches X, wants Y) with Member B (teaches Y, wants X), based on shared learning interests and ratings."
                },
                {
                  title: "Built-In 1-on-1 Video Calls",
                  desc: "Practice live directly in your browser with screen sharing and webcam controls without downloading third-party software."
                },
                {
                  title: "Verified Reviews & Credits",
                  desc: "Completed swaps award verified reviews and credits to both members' profiles, building reputation in the community."
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-3.5 items-start p-4 rounded-xl bg-[#2B313A] border border-[rgba(255,255,255,0.08)]">
                  <div className="w-8 h-8 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#F5F6FA] mb-0.5">{item.title}</h4>
                    <p className="body-md text-xs text-[#A4B0BE] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="safety-trust" className="ui-card p-6 sm:p-8 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
            <span className="tag-chip text-[9px] mb-2 inline-block">SECTION 3</span>
            <h2 className="heading-h2 text-[#F5F6FA] mb-4">Trust & Community Safety</h2>
            <p className="body-md text-sm text-[#A4B0BE] leading-relaxed mb-4">
              SkillSwap enforces a zero-tolerance policy against financial solicitation and corporate recruitment spam.
            </p>
            <ul className="space-y-2.5 text-xs text-[#A4B0BE]">
              <li className="flex items-center gap-2">
                <span className="font-mono text-[#55E6C1] font-semibold">[VERIFIED]</span> Verified member badges on profiles with completed swaps.
              </li>
              <li className="flex items-center gap-2">
                <span className="font-mono text-[#55E6C1] font-semibold">[RATING]</span> Honest reviews published only after both partners submit feedback.
              </li>
              <li className="flex items-center gap-2">
                <span className="font-mono text-[#55E6C1] font-semibold">[REPORT]</span> 1-click community moderation and instant call disconnection on any violation.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Docs;
