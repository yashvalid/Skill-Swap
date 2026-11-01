import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeftRight, 
  CheckCircle2, 
  Video, 
  Layers, 
  Calendar, 
  Code2, 
  ShieldCheck, 
  Cpu, 
  GitBranch, 
  Activity,
  ArrowUpRight,
  MessageSquare,
  Bot
} from 'lucide-react';

const SKILL_OPTIONS = [
  'Conversational Spanish',
  'Full-Stack Web (React & Node)',
  'UI/UX & Figma Design',
  'Acoustic Guitar & Music',
  'Video Editing & Motion',
  'Python & Machine Learning',
  'Public Speaking & Pitching',
  'Digital Marketing & SEO'
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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 overflow-hidden">
      
      {/* Hero Section: Split-screen (text left, visual right) per DESIGN.md */}
      <section className="section-gap">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline and Callouts */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 tag-chip">
              <span className="w-2 h-2 rounded-full bg-[#FFEEA8]" />
              <span>DIRECT PEER LEARNING</span>
            </div>

            <h1 className="display-hero text-[#F7F8FC]">
              SWAP SKILLS 1-ON-1.<br />
              <span className="text-[#FFEEA8]">ZERO FEES.</span> <span className="text-[#D72E2B]">REAL SKILLS.</span>
            </h1>

            <p className="body-md text-base sm:text-lg text-[#A4B0C6]">
              SkillSwap connects developers, language speakers, designers, musicians, and creators to trade 1-on-1 mentorship. Trade code with design, Spanish with Python, or music production with digital marketing.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link to="/marketplace" className="btn btn-cta text-sm px-6 py-3 group justify-center text-center">
                <span>Enter Marketplace</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/docs" className="btn btn-secondary text-sm px-5 py-3 justify-center text-center">
                How it Works
              </Link>
            </div>

            {/* Indexed technical tracks */}
            <div className="pt-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#71809B] uppercase">
                Active Tracks:
              </span>
              {['WEB DEVELOPMENT', 'CONVERSATIONAL SPANISH', 'UI/UX DESIGN', 'VIDEO & MOTION', 'PYTHON & ML', 'MUSIC PRODUCTION'].map((track) => (
                <span key={track} className="tag-chip text-[11px]">
                  {track}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Visual 2D Poster Card on Solid Surface */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md ui-card p-6 bg-[#283144] rounded-2xl border border-[rgba(255,255,255,0.12)] relative shadow-xl">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.1)] mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FFEEA8]" />
                  <span className="font-mono text-xs font-semibold tracking-wide text-[#F7F8FC]">
                    ACTIVE EXCHANGE PAIR
                  </span>
                </div>
                <span className="font-mono text-[11px] bg-[#171D2B] border border-[rgba(255, 238, 168,0.3)] text-[#FFEEA8] px-2.5 py-0.5 rounded-full font-medium">
                  {simulatedSynergy}% COMPATIBLE
                </span>
              </div>

              {/* Partner A */}
              <div className="p-3.5 bg-[#202738] border border-[rgba(255,255,255,0.08)] rounded-xl mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2B3F74] text-white font-mono font-bold flex items-center justify-center text-sm">
                    SL
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#F7F8FC]">Sarah Lin</p>
                    <p className="text-xs text-[#A4B0C6]">UI/UX Designer</p>
                  </div>
                </div>
                <span className="tag-chip text-[10px]">
                  Teaches Figma Design
                </span>
              </div>

              {/* Swap Direction Icon */}
              <div className="flex items-center justify-center my-2">
                <div className="w-8 h-8 rounded-xl bg-[#D72E2B] text-white flex items-center justify-center shadow-md">
                  <ArrowLeftRight size={15} strokeWidth={2.5} />
                </div>
              </div>

              {/* Partner B */}
              <div className="p-3.5 bg-[#202738] border border-[rgba(255,255,255,0.08)] rounded-xl mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#283144] text-[#FFEEA8] border border-[rgba(255, 238, 168,0.3)] font-mono font-bold flex items-center justify-center text-sm">
                    MT
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#F7F8FC]">Marcus Thorne</p>
                    <p className="text-xs text-[#A4B0C6]">Language Coach</p>
                  </div>
                </div>
                <span className="tag-chip-purple text-[10px]">
                  Teaches Spanish Practice
                </span>
              </div>

              {/* Progress Track */}
              <div className="p-4 bg-[#171D2B] border border-[rgba(255,255,255,0.08)] rounded-xl space-y-2.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[#A4B0C6]">Swap Progress</span>
                  <span className="text-[#F7F8FC] font-semibold">Week 3 of 4</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#202738] overflow-hidden">
                  <div className="h-full bg-[#2B3F74] w-3/4" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#A4B0C6] pt-1">
                  <span>Goal: 45-min Practice Completed</span>
                  <span className="font-mono text-[#FFEEA8] font-medium">VERIFIED</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Interactive Reciprocal Synergy Simulator */}
      <section className="section-gap ui-card p-6 sm:p-10 bg-[#283144] border border-[rgba(255,255,255,0.12)] rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[rgba(255,255,255,0.1)]">
          <div>
            <span className="font-mono text-xs text-[#FFEEA8] uppercase tracking-wider block mb-1">
              Interactive Match Preview
            </span>
            <h2 className="heading-h2 text-[#F7F8FC]">
              FIND YOUR SKILL MATCH
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#A4B0C6] max-w-sm mt-3 md:mt-0 font-normal">
            Select what you can teach and what you want to learn. See how easily you can match with peers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Skill Selectors */}
          <div className="md:col-span-7 space-y-5">
            <div>
              <label className="font-mono text-xs text-[#A4B0C6] block mb-2 uppercase">
                I Can Teach (My Skill)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleSimulate(skill, wantSkill)}
                    className={`text-[11px] sm:text-xs p-2.5 sm:p-3 rounded-xl border text-left font-medium leading-snug transition-colors duration-150 ${
                      mySkill === skill
                        ? 'bg-[#2B3F74] text-white border-[#2B3F74] font-bold shadow-sm'
                        : 'bg-[#202738] text-[#F7F8FC] border-[rgba(255,255,255,0.1)] hover:border-[#2B3F74]'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-mono text-xs text-[#A4B0C6] block mb-2 uppercase">
                I Want To Learn (Target Skill)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleSimulate(mySkill, skill)}
                    className={`text-[11px] sm:text-xs p-2.5 sm:p-3 rounded-xl border text-left font-medium leading-snug transition-colors duration-150 ${
                      wantSkill === skill
                        ? 'bg-[#171D2B] text-[#FFEEA8] border-[#FFEEA8] font-bold shadow-sm ring-1 ring-[#FFEEA8]'
                        : 'bg-[#202738] text-[#F7F8FC] border-[rgba(255,255,255,0.1)] hover:border-[#FFEEA8]'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Computed Pairing Box */}
          <div className="md:col-span-5 bg-[#202738] p-6 rounded-2xl border border-[rgba(255,255,255,0.1)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
              <span className="font-mono text-xs text-[#A4B0C6] uppercase">Match Compatibility</span>
              <span className="tag-chip-orange text-xs font-bold">
                {simulatedSynergy}% Match
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-[#71809B] font-mono">Skill Match:</p>
              <p className="text-sm font-bold text-[#F7F8FC] flex items-center gap-2">
                <span>{mySkill}</span>
                <ArrowLeftRight size={14} className="text-[#FFEEA8]" />
                <span>{wantSkill}</span>
              </p>
            </div>

            <div className="p-3 bg-[#171D2B] rounded-xl border border-[rgba(255,255,255,0.08)] space-y-1">
              <p className="font-mono text-[10px] text-[#FFEEA8] uppercase font-semibold">Suggested Schedule</p>
              <p className="text-xs text-[#A4B0C6] leading-relaxed">
                4-week structured exchange with weekly 45-minute live practice sessions, milestone tracking, and shared progress reviews.
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
            <div className="tag-chip text-xs">FEATURE 1</div>
            <h2 className="heading-h1 text-[#F7F8FC]">
              Direct 1-on-1 Skill Swaps
            </h2>
            <p className="body-md text-[#A4B0C6]">
              Traditional courses lack real accountability, and private tutoring is prohibitively expensive. SkillSwap establishes mutual equality: you teach an hour of your domain, and your partner teaches an hour of theirs.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-[#F7F8FC]">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0" />
                <span>Direct 1-on-1 sessions with skilled peers and mentors</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0" />
                <span>Zero transactional commissions or hidden subscription gates</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0" />
                <span>Transparent reviews and verified ratings after every swap</span>
              </li>
            </ul>
          </div>

          <div className="md:col-span-6">
            <div className="ui-card p-6 bg-[#283144] rounded-2xl border border-[rgba(255,255,255,0.12)]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFEEA8] animate-pulse" />
                  <span className="font-mono text-xs text-[#F7F8FC] font-bold">LIVE SWAP SESSION</span>
                </div>
                <span className="font-mono text-[10px] bg-[#171D2B] text-[#FFEEA8] px-2.5 py-0.5 rounded-full border border-[rgba(255, 238, 168,0.3)]">
                  IN PROGRESS &bull; 35:00
                </span>
              </div>

              {/* Topics exchange */}
              <div className="space-y-2.5 mb-4">
                <div className="p-3 bg-[#202738] border border-[rgba(255,255,255,0.08)] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="tag-chip text-[9px]">PART 1</span>
                    <span className="text-xs font-semibold text-[#F7F8FC]">Conversational Spanish Practice</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#FFEEA8]">Sofia &bull; 30 min</span>
                </div>
                <div className="p-3 bg-[#202738] border border-[rgba(255,255,255,0.08)] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="tag-chip text-[9px]">PART 2</span>
                    <span className="text-xs font-semibold text-[#F7F8FC]">React & Modern Web Design</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#2B3F74]">Alex &bull; 30 min</span>
                </div>
              </div>

              {/* Session Agenda Checklist */}
              <div className="p-3.5 bg-[#171D2B] border border-[rgba(255,255,255,0.08)] rounded-xl space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#FFEEA8]">
                  <CheckCircle2 size={13} />
                  <span>Introductions & weekly goal review</span>
                </div>
                <div className="flex items-center gap-2 text-[#FFEEA8]">
                  <CheckCircle2 size={13} />
                  <span>Hands-on practice & live pronunciation feedback</span>
                </div>
                <div className="flex items-center gap-2 text-[#A4B0C6]">
                  <span className="w-3.5 h-3.5 rounded-md border border-[rgba(255,255,255,0.3)] inline-block shrink-0" />
                  <span>Component build review & next week milestones</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Visual Left, Text Right (Zig-Zag) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-6 order-2 md:order-1">
            <div className="ui-card p-6 bg-[#283144] rounded-2xl border border-[rgba(255,255,255,0.12)] space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
                <span className="font-mono text-xs font-semibold text-[#F7F8FC]">MILESTONE ROADMAP</span>
                <span className="font-mono text-[11px] text-[#71809B]">4 WEEKS</span>
              </div>
              
              {[
                { week: '01', title: 'Foundations & Goal Setting', status: 'Completed', color: 'text-[#FFEEA8]' },
                { week: '02', title: 'Core Practice & Guided Exercises', status: 'Completed', color: 'text-[#FFEEA8]' },
                { week: '03', title: 'Real-World Application & Review', status: 'In Progress', color: 'text-[#FFA502]' },
                { week: '04', title: 'Final Project & Skill Verification', status: 'Scheduled', color: 'text-[#71809B]' },
              ].map((m) => (
                <div key={m.week} className="p-3 bg-[#202738] border border-[rgba(255,255,255,0.08)] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#2B3F74] font-bold w-6">{m.week}</span>
                    <span className="text-xs font-medium text-[#F7F8FC]">{m.title}</span>
                  </div>
                  <span className={`font-mono text-[10px] font-semibold ${m.color}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-6 order-1 md:order-2 space-y-4">
            <div className="tag-chip text-xs">FEATURE 2</div>
            <h2 className="heading-h1 text-[#F7F8FC]">
              Structured 4-Week Learning Plans
            </h2>
            <p className="body-md text-[#A4B0C6]">
              Unstructured calls rarely yield lasting skills. When a swap is accepted, both partners get a tailored 4-week roadmap. Each session has a clear goal and hands-on practice — whether you're reviewing code, speaking Spanish, or refining audio tracks.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-[#F7F8FC]">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0" />
                <span>Clear weekly goals with practical hands-on exercises</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0" />
                <span>Personalized 4-week study plans tailored to both learners</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0" />
                <span>Earn skill credits on milestone completion to unlock advanced learning badges</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Row 3: Text Left, Visual Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-6 space-y-4">
            <div className="tag-chip text-xs">FEATURE 3</div>
            <h2 className="heading-h1 text-[#F7F8FC]">
              Real-Time Chat & 1-on-1 Video
            </h2>
            <p className="body-md text-[#A4B0C6]">
              Coordinate your sessions and practice together without juggling third-party tools. Message your swap partner in real-time, get instant study guidance from your 24/7 AI tutor, and launch browser-based 1-on-1 video calls with integrated call history and screen sharing.
            </p>
            <ul className="space-y-2 pt-1 text-sm text-[#F7F8FC]">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0" />
                <span>Direct real-time messaging with call records logged directly in chat</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0" />
                <span>24/7 AI study companion (SkillBot) to clarify concepts and suggest exercises</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0" />
                <span>One-click browser video calls with screen sharing — zero downloads or meeting codes</span>
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/marketplace" className="btn btn-primary text-xs py-2.5 px-5 justify-center text-center">
                Find a Swap Partner
              </Link>
              <Link to="/feed" className="btn btn-secondary text-xs py-2.5 px-5 justify-center text-center">
                View Showcases
              </Link>
            </div>
          </div>

          <div className="md:col-span-6">
            <div className="ui-card p-4 sm:p-6 bg-[#283144] border border-[rgba(255,255,255,0.12)] rounded-2xl">
              {/* Chat & Call Header Preview */}
              <div className="p-3 bg-[#171D2B] border border-[rgba(255,255,255,0.08)] rounded-xl flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2B3F74] text-white flex items-center justify-center font-bold text-xs">
                    SS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-[#F7F8FC]">Sofia & Alex</p>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFEEA8]" />
                    </div>
                    <p className="font-mono text-[10px] text-[#A4B0C6]">Spanish &bull; React Swap</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#202738] border border-[rgba(255,255,255,0.1)] text-[#FFEEA8]">
                    <Video size={14} />
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#202738] border border-[rgba(255,255,255,0.1)] text-[#A4B0C6]">
                    <MessageSquare size={14} />
                  </div>
                </div>
              </div>

              {/* Chat Stream Sample */}
              <div className="space-y-2.5 p-3.5 bg-[#171D2B] border border-[rgba(255,255,255,0.06)] rounded-xl mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-mono text-[#FFEEA8] shrink-0 font-bold">Sofia:</span>
                  <div className="p-2.5 bg-[#202738] text-xs text-[#F7F8FC] border border-[rgba(255,255,255,0.05)] rounded-2xl">
                    Ready for our session today? We can practice conversational Spanish first!
                  </div>
                </div>
                <div className="flex items-start justify-end gap-2">
                  <div className="p-2.5 bg-[#2B3F74]/40 text-xs text-[#F7F8FC] border border-[#2B3F74]/50 rounded-2xl text-right">
                    Sounds great! Jumping on the video call right now.
                  </div>
                  <span className="text-[10px] font-mono text-[#A4B0C6] shrink-0 font-bold">Alex:</span>
                </div>
                <div className="flex justify-center my-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono bg-[#202738] text-[#FFEEA8] border border-[rgba(255, 238, 168,0.3)]">
                    <Video size={10} /> Call ended &bull; 45:12 &bull; Logged to chat
                  </span>
                </div>
              </div>

              {/* Feature highlight chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-[#202738] border border-[rgba(255,255,255,0.08)] rounded-xl">
                  <MessageSquare size={14} className="mx-auto text-[#2B3F74] mb-1" />
                  <p className="font-mono text-[10px] font-bold text-[#F7F8FC]">Real-Time Chat</p>
                  <p className="font-mono text-[9px] text-[#71809B]">Instant sync</p>
                </div>
                <div className="p-2.5 bg-[#202738] border border-[rgba(255,255,255,0.08)] rounded-xl">
                  <Bot size={14} className="mx-auto text-[#FFEEA8] mb-1" />
                  <p className="font-mono text-[10px] font-bold text-[#FFEEA8]">AI SkillBot</p>
                  <p className="font-mono text-[9px] text-[#71809B]">24/7 tutor</p>
                </div>
                <div className="p-2.5 bg-[#202738] border border-[rgba(255,255,255,0.08)] rounded-xl">
                  <Video size={14} className="mx-auto text-[#FFA502] mb-1" />
                  <p className="font-mono text-[10px] font-bold text-[#F7F8FC]">1-on-1 Video</p>
                  <p className="font-mono text-[9px] text-[#71809B]">Screen share</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* CTA Bottom Banner */}
      <section className="ui-card p-8 sm:p-12 bg-[#283144] border border-[rgba(255,255,255,0.15)] rounded-3xl text-center relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="tag-chip text-xs">JOIN OUR COMMUNITY</div>
          <h2 className="heading-h1 text-[#F7F8FC]">
            Start Your First Skill Swap
          </h2>
          <p className="body-md text-sm text-[#A4B0C6] mx-auto leading-relaxed">
            Connect with developers, language speakers, designers, musicians, and creators trading knowledge freely without paywalls.
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
