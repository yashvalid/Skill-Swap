import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeftRight, 
  CheckCircle2, 
  Terminal, 
  Video, 
  Layers, 
  Calendar, 
  Code2, 
  ShieldCheck, 
  Cpu, 
  GitBranch, 
  Activity,
  ArrowUpRight
} from 'lucide-react';

const SKILL_OPTIONS = [
  'React & Next.js 15',
  'Figma Design Systems',
  'Distributed Go & Redis',
  'SwiftUI & Metal Shaders',
  'WebRTC Media Pipelines',
  'AI Agents & RAG Architecture'
];

const LandingPage = () => {
  const [mySkill, setMySkill] = useState(SKILL_OPTIONS[0]);
  const [wantSkill, setWantSkill] = useState(SKILL_OPTIONS[1]);
  const [simulatedSynergy, setSimulatedSynergy] = useState(98);

  const handleSimulate = (teach, learn) => {
    setMySkill(teach);
    setWantSkill(learn);
    const score = 95 + ((teach.length * 7 + learn.length * 13) % 5);
    setSimulatedSynergy(score);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12 md:py-16 overflow-hidden">
      
      {/* Hero Section: Split-screen (text left, visual right) per DESIGN.md */}
      <section className="section-gap">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline and Callouts */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 tag-chip">
              <span className="w-2 h-2 rounded-none bg-[#55E6C1]" />
              <span>BILATERAL PEER PROTOCOL // V2.0</span>
            </div>

            <h1 className="display-hero text-[#F5F6FA]">
              DIRECT KNOWLEDGE BARTER.<br />
              <span className="text-[#6C5CE7]">NO CURRENCY.</span> <span className="text-[#55E6C1]">PURE MASTERY.</span>
            </h1>

            <p className="body-md text-base sm:text-lg text-[#A4B0BE]">
              SkillSwap links software engineers, designers, and systems architects to exchange 1:1 technical mentorship. Barter your production experience for skills you want to master through structured weekly milestones.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link to="/marketplace" className="btn btn-cta text-sm px-6 py-3 group">
                <span>Enter Marketplace</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/docs" className="btn btn-secondary text-sm px-5 py-3">
                Protocol Spec
              </Link>
            </div>

            {/* Indexed technical tracks */}
            <div className="pt-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#718093] uppercase">
                Active Tracks:
              </span>
              {['GO ROUTINES', 'NEXT.JS 15', 'DESIGN TOKENS', 'WEBRTC PIPELINES', 'RAG ARCHITECTURE'].map((track) => (
                <span key={track} className="tag-chip text-[11px]">
                  {track}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Visual 2D Poster Card on Solid Surface */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md ui-card p-6 bg-[#353B48] border border-[rgba(255,255,255,0.12)] relative shadow-xl">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.1)] mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-none bg-[#55E6C1]" />
                  <span className="font-mono text-xs font-semibold tracking-wide text-[#F5F6FA]">
                    ACTIVE EXCHANGE PAIR
                  </span>
                </div>
                <span className="font-mono text-[11px] bg-[#242A32] border border-[rgba(85,230,193,0.3)] text-[#55E6C1] px-2.5 py-0.5 font-medium">
                  {simulatedSynergy}% COMPATIBLE
                </span>
              </div>

              {/* Partner A */}
              <div className="p-3.5 bg-[#2B313A] border border-[rgba(255,255,255,0.08)] mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-none bg-[#6C5CE7] text-white font-mono font-bold flex items-center justify-center text-sm">
                    SL
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#F5F6FA]">Sarah Lin</p>
                    <p className="text-xs text-[#A4B0BE]">Lead Design Systems</p>
                  </div>
                </div>
                <span className="tag-chip text-[10px]">
                  Teaches Figma Tokens
                </span>
              </div>

              {/* Barter Direction Icon */}
              <div className="flex items-center justify-center my-2">
                <div className="w-8 h-8 rounded-none bg-[#FF7675] text-[#2F3640] flex items-center justify-center shadow-md">
                  <ArrowLeftRight size={15} strokeWidth={2.5} />
                </div>
              </div>

              {/* Partner B */}
              <div className="p-3.5 bg-[#2B313A] border border-[rgba(255,255,255,0.08)] mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-none bg-[#353B48] text-[#55E6C1] border border-[rgba(85,230,193,0.3)] font-mono font-bold flex items-center justify-center text-sm">
                    MT
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#F5F6FA]">Marcus Thorne</p>
                    <p className="text-xs text-[#A4B0BE]">Distributed Systems Architect</p>
                  </div>
                </div>
                <span className="tag-chip-purple text-[10px]">
                  Teaches Distributed Go
                </span>
              </div>

              {/* Progress Track */}
              <div className="p-4 bg-[#242A32] border border-[rgba(255,255,255,0.08)] space-y-2.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[#A4B0BE]">Cadence Progress</span>
                  <span className="text-[#F5F6FA] font-semibold">Week 3 of 4</span>
                </div>
                <div className="w-full h-2 rounded-none bg-[#2F3640] overflow-hidden">
                  <div className="h-full bg-[#6C5CE7] w-3/4" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#A4B0BE] pt-1">
                  <span>Target: WebRTC Data Channel Sync</span>
                  <span className="font-mono text-[#55E6C1] font-medium">VERIFIED</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Interactive Reciprocal Synergy Simulator */}
      <section className="section-gap ui-card p-6 sm:p-10 bg-[#353B48] border border-[rgba(255,255,255,0.12)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[rgba(255,255,255,0.1)]">
          <div>
            <span className="font-mono text-xs text-[#55E6C1] uppercase tracking-wider block mb-1">
              Engine Simulation // 01
            </span>
            <h2 className="heading-h2 text-[#F5F6FA]">
              COMPUTE RECIPROCAL SKILL SYNERGY
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#A4B0BE] max-w-sm mt-3 md:mt-0 font-normal">
            Choose what you can teach and what you want to learn. Our barter matrix calculates pairwise curriculum alignment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Skill Selectors */}
          <div className="md:col-span-7 space-y-5">
            <div>
              <label className="font-mono text-xs text-[#A4B0BE] block mb-2 uppercase">
                I Can Teach (My Production Skill)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleSimulate(skill, wantSkill)}
                    className={`text-xs p-3 rounded-none border text-left font-medium transition-colors duration-150 ${
                      mySkill === skill
                        ? 'bg-[#6C5CE7] text-white border-[#6C5CE7] font-bold shadow-sm'
                        : 'bg-[#2B313A] text-[#F5F6FA] border-[rgba(255,255,255,0.1)] hover:border-[#6C5CE7]'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-mono text-xs text-[#A4B0BE] block mb-2 uppercase">
                I Want To Learn (Target Mastery)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleSimulate(mySkill, skill)}
                    className={`text-xs p-3 rounded-none border text-left font-medium transition-colors duration-150 ${
                      wantSkill === skill
                        ? 'bg-[#242A32] text-[#55E6C1] border-[#55E6C1] font-bold shadow-sm ring-1 ring-[#55E6C1]'
                        : 'bg-[#2B313A] text-[#F5F6FA] border-[rgba(255,255,255,0.1)] hover:border-[#55E6C1]'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Computed Pairing Box */}
          <div className="md:col-span-5 bg-[#2B313A] p-6 rounded-none border border-[rgba(255,255,255,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
              <span className="font-mono text-xs text-[#A4B0BE] uppercase">Calculated Synergy</span>
              <span className="tag-chip-orange text-xs font-bold">
                {simulatedSynergy}% Match
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-[#718093] font-mono">Bilateral Vector:</p>
              <p className="text-sm font-bold text-[#F5F6FA] flex items-center gap-2">
                <span>{mySkill}</span>
                <ArrowLeftRight size={14} className="text-[#55E6C1]" />
                <span>{wantSkill}</span>
              </p>
            </div>

            <div className="p-3 bg-[#242A32] rounded-none border border-[rgba(255,255,255,0.08)] space-y-1">
              <p className="font-mono text-[10px] text-[#55E6C1] uppercase font-semibold">Suggested Cadence</p>
              <p className="text-xs text-[#A4B0BE] leading-relaxed">
                4-week structured exchange with weekly 45-minute live pair coding sessions and milestone code reviews.
              </p>
            </div>

            <Link
              to="/marketplace"
              className="btn btn-primary w-full text-xs py-2.5 justify-center"
            >
              <span>Explore Matching Mentors</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Sections: Zig-Zag Alternating Text+Visual Rows (No 3-equal-columns per DESIGN.md) */}
      <section className="section-gap space-y-16">
        
        {/* Row 1: Text Left, Visual Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-6 space-y-4">
            <div className="tag-chip text-xs">FEATURE // 01</div>
            <h2 className="heading-h1 text-[#F5F6FA]">
              Bilateral Pair Exchange
            </h2>
            <p className="body-md text-[#A4B0BE]">
              Traditional courses lack real accountability, and private tutoring is prohibitively expensive. SkillSwap establishes mutual equality: you teach an hour of your domain, and your partner teaches an hour of theirs.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-[#F5F6FA]">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#55E6C1] shrink-0" />
                <span>Direct 1:1 barter with verified engineering practitioners</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#55E6C1] shrink-0" />
                <span>Zero transactional commissions or hidden subscription gates</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#55E6C1] shrink-0" />
                <span>Objective reputation recorded via bilateral completion reviews</span>
              </li>
            </ul>
          </div>

          <div className="md:col-span-6">
            <div className="ui-card p-6 bg-[#353B48] border border-[rgba(255,255,255,0.12)]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-2">
                  <Terminal size={15} className="text-[#6C5CE7]" />
                  <span className="font-mono text-xs text-[#F5F6FA]">terminal_exchange.log</span>
                </div>
                <span className="font-mono text-[10px] text-[#55E6C1]">CONNECTED</span>
              </div>
              <pre className="p-4 rounded-none bg-[#242A32] border border-[rgba(255,255,255,0.08)] font-mono text-xs text-[#A4B0BE] overflow-x-auto leading-relaxed">
{`$ skillswap connect --peer marcus.chen
> Initiating bilateral socket handshake...
> Handshake verified via SHA-256 session signature
> Topic A: Distributed Go Routines & Sync Primaries
> Topic B: Figma Token Transformer Pipeline
> Status: Live pair coding session active`}
              </pre>
            </div>
          </div>
        </div>

        {/* Row 2: Visual Left, Text Right (Zig-Zag) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-6 order-2 md:order-1">
            <div className="ui-card p-6 bg-[#353B48] border border-[rgba(255,255,255,0.12)] space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
                <span className="font-mono text-xs font-semibold text-[#F5F6FA]">MILESTONE ROADMAP</span>
                <span className="font-mono text-[11px] text-[#718093]">4 WEEKS</span>
              </div>
              
              {[
                { week: '01', title: 'Architecture & Boundary Definition', status: 'Completed', color: 'text-[#55E6C1]' },
                { week: '02', title: 'Core Implementation & State Pipeline', status: 'Completed', color: 'text-[#55E6C1]' },
                { week: '03', title: 'Edge Case Profiling & Concurrency', status: 'In Progress', color: 'text-[#FFA502]' },
                { week: '04', title: 'Production PR Review & Validation', status: 'Scheduled', color: 'text-[#718093]' },
              ].map((m) => (
                <div key={m.week} className="p-3 bg-[#2B313A] border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#6C5CE7] font-bold w-6">{m.week}</span>
                    <span className="text-xs font-medium text-[#F5F6FA]">{m.title}</span>
                  </div>
                  <span className={`font-mono text-[10px] font-semibold ${m.color}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-6 order-1 md:order-2 space-y-4">
            <div className="tag-chip text-xs">FEATURE // 02</div>
            <h2 className="heading-h1 text-[#F5F6FA]">
              Structured Milestone Cadence
            </h2>
            <p className="body-md text-[#A4B0BE]">
              Unstructured meetings rarely yield lasting skills. When a swap is accepted, both partners co-author or AI-synthesize a 4-week milestones agenda. Each session has a clear goal, a repository artifact, and peer code review.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-[#F5F6FA]">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#55E6C1] shrink-0" />
                <span>Deterministic weekly objectives with hands-on exercises</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#55E6C1] shrink-0" />
                <span>AI-powered curriculum synthesis tailored to both participants</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#55E6C1] shrink-0" />
                <span>Earn skill credits on milestone completion to unlock senior tracks</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Row 3: Text Left, Visual Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-6 space-y-4">
            <div className="tag-chip text-xs">FEATURE // 03</div>
            <h2 className="heading-h1 text-[#F5F6FA]">
              Direct WebRTC Signaling
            </h2>
            <p className="body-md text-[#A4B0BE]">
              No third-party conference links or external tool fragmentation. Launch video calls, share screen windows, and inspect code side-by-side right within the exchange dashboard via low-latency Socket.io WebRTC signaling.
            </p>
            <div className="flex gap-3 pt-2">
              <Link to="/marketplace" className="btn btn-primary text-xs py-2.5 px-5">
                Find a Barter Partner
              </Link>
              <Link to="/feed" className="btn btn-secondary text-xs py-2.5 px-5">
                View Showcases
              </Link>
            </div>
          </div>

          <div className="md:col-span-6">
            <div className="ui-card p-6 bg-[#353B48] border border-[rgba(255,255,255,0.12)]">
              <div className="p-4 bg-[#242A32] border border-[rgba(255,255,255,0.08)] flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-none bg-[#6C5CE7] text-white flex items-center justify-center font-bold">
                    <Video size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#F5F6FA]">WebRTC Signaling Node</p>
                    <p className="font-mono text-[10px] text-[#A4B0BE]">STUN / TURN Enabled</p>
                  </div>
                </div>
                <span className="tag-chip text-[10px]">
                  READY
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-[#2B313A] border border-[rgba(255,255,255,0.08)]">
                  <p className="font-mono text-base font-bold text-[#F5F6FA]">&lt; 40ms</p>
                  <p className="font-mono text-[10px] text-[#718093]">Signaling Latency</p>
                </div>
                <div className="p-3 bg-[#2B313A] border border-[rgba(255,255,255,0.08)]">
                  <p className="font-mono text-base font-bold text-[#55E6C1]">Direct P2P</p>
                  <p className="font-mono text-[10px] text-[#718093]">Data Flow</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* CTA Bottom Banner */}
      <section className="ui-card p-8 sm:p-12 bg-[#353B48] border border-[rgba(255,255,255,0.15)] text-center relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="tag-chip text-xs">OPEN TECHNICAL COMMONS</div>
          <h2 className="heading-h1 text-[#F5F6FA]">
            Start Your First Bilateral Barter
          </h2>
          <p className="body-md text-sm text-[#A4B0BE] mx-auto leading-relaxed">
            Connect with seasoned engineers, designers, and researchers bartering knowledge for knowledge without corporate gatekeeping.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link to="/marketplace" className="btn btn-cta text-xs py-3 px-6">
              Browse Mentor Directory
            </Link>
            <Link to="/login" className="btn btn-secondary text-xs py-3 px-6">
              Create Member Account
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
