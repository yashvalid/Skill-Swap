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
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      
      {/* Header */}
      <header className="mb-12 text-center">
        <div className="inline-flex items-center gap-1.5 tag-chip mb-3">
          <BookOpen size={14} />
          <span>SYSTEM DOCUMENTATION</span>
        </div>
        <h1 className="heading-h1 text-[#F5F6FA]">
          Platform Architecture & Guidelines
        </h1>
        <p className="body-md text-sm text-[#A4B0BE] max-w-2xl mx-auto mt-2 leading-relaxed">
          Platform philosophy, matching logic, WebRTC video calling, and community trust guidelines powering SkillSwap.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 hidden md:block">
          <nav className="sticky top-24 space-y-1 bg-[#353B48] p-2 rounded-none border border-[rgba(255,255,255,0.12)]">
            {[
              { id: "introduction", title: "THE COMMONS", icon: <FileText size={15} /> },
              { id: "product-requirements", title: "EXCHANGE LOGIC", icon: <Layout size={15} /> },
              { id: "safety-trust", title: "TRUST & VERIFY", icon: <ShieldCheck size={15} /> }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none text-xs font-medium transition-colors text-left ${
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
            <h2 className="heading-h2 text-[#F5F6FA] mb-4">The Reciprocal Commons Philosophy</h2>
            <div className="body-md text-sm text-[#A4B0BE] space-y-4 leading-relaxed">
              <p>
                SkillSwap replaces passive tutorial watching with active peer-to-peer learning. Instead of treating skills as a paywalled commodity, members teach and learn directly from each other.
              </p>
              <p>
                Peer accountability drives real retention: when two people give direct feedback on real code and projects, learning happens much faster than solo studying.
              </p>
            </div>
          </section>

          <section id="product-requirements" className="ui-card p-6 sm:p-8 bg-[#353B48] border border-[rgba(255,255,255,0.12)] rounded-none">
            <span className="tag-chip text-[9px] mb-2 inline-block">SECTION 2</span>
            <h2 className="heading-h2 text-[#F5F6FA] mb-4">Swap Matching Logic</h2>
            <div className="space-y-4">
              {[
                {
                  title: "Double-Sided Matching",
                  desc: "Matching algorithm pairs User A (offers X, seeks Y) with User B (offers Y, seeks X), ranking by complementary skill overlap and rating history."
                },
                {
                  title: "Real-Time WebRTC Video Channels",
                  desc: "Socket.io signalling coordinates low-latency peer-to-peer video sessions with media device controls directly inside the browser."
                },
                {
                  title: "Proof of Exchange & Credits",
                  desc: "Completed swaps award verified credentials and credits on the member's profile, building public reputation in the commons."
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-3.5 items-start p-4 rounded-none bg-[#2B313A] border border-[rgba(255,255,255,0.08)]">
                  <div className="w-8 h-8 rounded-none bg-[#6C5CE7] text-white flex items-center justify-center shrink-0">
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
                <span className="font-mono text-[#55E6C1] font-semibold">[VERIFIED]</span> Verified cryptographic identity badges on completed mentor profiles.
              </li>
              <li className="flex items-center gap-2">
                <span className="font-mono text-[#55E6C1] font-semibold">[RATING]</span> Double-blind reviews are published only when both members submit or after 7 days.
              </li>
              <li className="flex items-center gap-2">
                <span className="font-mono text-[#55E6C1] font-semibold">[REPORT]</span> 1-click community moderation and instant socket disconnect on any violation.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Docs;
