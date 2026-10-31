import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Clock, 
  Zap, 
  CheckCircle2,
  Check,
  ArrowLeftRight,
  Shield
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { swapService } from '../services/swapService';
import toast from 'react-hot-toast';

const SwapFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const passedPartner = location.state?.partner;
  const partner = passedPartner ? {
    _id: passedPartner._id,
    name: `${passedPartner.fullname?.firstname} ${passedPartner.fullname?.lastname}`,
    skill: passedPartner.skillsOffered?.[0] || 'Technical Mentorship',
    seeking: passedPartner.skillsNeeded?.[0] || 'Peer Exchange'
  } : {
    _id: 'peer-3',
    name: "Elena Vance",
    skill: "Product Design & Spatial UX",
    seeking: "React Basics & State Architecture"
  };

  const [selectedOffering, setSelectedOffering] = useState("React Basics & State Architecture");
  const [proposalNotes, setProposalNotes] = useState(
    `Hi ${partner.name.split(' ')[0]}! I reviewed your work on ${partner.skill} and would love to exchange knowledge. I have built production applications and can walk through core architectural patterns.`
  );

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const steps = [
    { title: "SKILL", desc: "Select offering" },
    { title: "PROPOSAL", desc: "Draft message" },
    { title: "SCHEDULE", desc: "Pick slot" },
    { title: "CONFIRM", desc: "Transmit" }
  ];

  const handleFinish = async () => {
    if (partner._id && !partner._id.startsWith('peer-')) {
      try {
        await swapService.requestSwap({
          toUserId: partner._id,
          offersSkill: selectedOffering,
          requestsSkill: partner.skill
        });
      } catch (err) {
        console.error('Swap request error', err);
      }
    }
    toast.success(`Swap proposal transmitted to ${partner.name}!`);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12 flex flex-col items-center">
      <div className="w-full">
        
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="tag-chip mb-2 inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-none bg-[#55E6C1]" />
            <span>START A SKILL SWAP</span>
          </div>
          <h1 className="heading-h1 text-[#F5F6FA]">
            Propose a Skill Swap
          </h1>
          <p className="body-md text-xs sm:text-sm text-[#A4B0BE] mt-1.5 mx-auto">
            Set expectations, pick meeting times, and agree on milestones with your partner.
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="flex justify-between items-center mb-10 relative px-4 max-w-2xl mx-auto">
          <div className="absolute top-5 left-10 right-10 h-[2px] bg-[rgba(255,255,255,0.1)] -z-0" />
          {steps.map((s, i) => {
            const isCompleted = step > i + 1;
            const isCurrent = step === i + 1;
            return (
              <div key={i} className="flex flex-col items-center z-10">
                <div
                  className={`w-10 h-10 rounded-none flex items-center justify-center font-bold text-xs font-mono transition-colors ${
                    isCompleted
                      ? 'bg-[#6C5CE7] text-white shadow-sm'
                      : isCurrent
                      ? 'bg-[#242A32] text-[#55E6C1] border-2 border-[#55E6C1] shadow-md'
                      : 'bg-[#2B313A] text-[#718093] border border-[rgba(255,255,255,0.12)]'
                  }`}
                >
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : `0${i + 1}`}
                </div>
                <p className={`mt-2 font-mono text-[10px] font-semibold ${
                  isCurrent ? 'text-[#55E6C1]' : 'text-[#718093]'
                }`}>
                  {s.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Main Card Container */}
        <div className="ui-card bg-[#353B48] shadow-2xl rounded-none overflow-hidden min-h-[460px] flex flex-col md:flex-row border border-[rgba(255,255,255,0.12)]">
          
          {/* Details Sidebar */}
          <div className="w-full md:w-72 bg-[#2B313A] p-6 border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.1)] flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-[#A4B0BE] uppercase block mb-4 font-semibold">
                Partner
              </span>
              
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-11 h-11 rounded-none overflow-hidden bg-[#242A32] border border-[rgba(255,255,255,0.15)] shrink-0">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.name}`} alt={partner.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#F5F6FA]">{partner.name}</p>
                  <div className="flex items-center gap-1 text-[#55E6C1] font-mono text-[10px]">
                    VERIFIED <CheckCircle2 size={11} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3.5 rounded-none bg-[#242A32] border border-[rgba(255,255,255,0.08)]">
                  <p className="font-mono text-[9px] text-[#718093] mb-1 uppercase">Receiving from {partner.name.split(' ')[0]}</p>
                  <p className="font-bold text-xs text-[#F5F6FA]">{partner.skill}</p>
                </div>
                <div className="p-3.5 rounded-none bg-[#242A32] border border-[rgba(85,230,193,0.3)]">
                  <p className="font-mono text-[9px] text-[#55E6C1] mb-1 uppercase font-semibold">Offering to {partner.name.split(' ')[0]}</p>
                  <p className="font-bold text-xs text-[#F5F6FA]">{selectedOffering}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 text-[10px] text-[#718093] font-mono">
              <span>ZERO FEES • 100% FREE PEER EXCHANGE</span>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-grow p-6 sm:p-10 flex flex-col justify-between bg-[#2F3640]">
            {step === 1 && (
              <div>
                <span className="tag-chip text-[10px] mb-2 inline-block">STEP 01</span>
                <h3 className="heading-h2 text-lg text-[#F5F6FA] mb-1">Select Your Knowledge Offering</h3>
                <p className="body-md text-xs text-[#A4B0BE] mb-6">Choose the skill you will teach during this swap.</p>
                
                <div className="space-y-3">
                  {[
                    { title: partner.seeking, match: true },
                    { title: "React Basics & State Architecture", match: false },
                    { title: "CSS Architecture & Tailwind CSS v4", match: false },
                    { title: "TypeScript & Production Tooling", match: false }
                  ].map((skill, i) => (
                    <label
                      key={i}
                      onClick={() => setSelectedOffering(skill.title)}
                      className={`flex items-center gap-3.5 p-4 rounded-none border transition-colors cursor-pointer ${
                        selectedOffering === skill.title
                          ? 'border-[#6C5CE7] bg-[#353B48] shadow-xs'
                          : 'border-[rgba(255,255,255,0.1)] hover:border-[#6C5CE7] hover:bg-[#353B48]/50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="skill" 
                        checked={selectedOffering === skill.title}
                        onChange={() => setSelectedOffering(skill.title)}
                        className="w-4 h-4 accent-[#6C5CE7]" 
                      />
                      <div className="flex-1">
                        <p className="font-bold text-xs sm:text-sm text-[#F5F6FA]">{skill.title}</p>
                        <p className="font-mono text-[10px] text-[#718093]">ESTABLISHED COMPETENCY</p>
                      </div>
                      {skill.match && (
                        <span className="tag-chip text-[9px] py-0.5 px-2 bg-[rgba(85,230,193,0.15)] text-[#55E6C1] border border-[rgba(85,230,193,0.3)] font-bold">
                          EXACT MATCH
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <span className="tag-chip text-[10px] mb-2 inline-block">STEP 02</span>
                <h3 className="heading-h2 text-lg text-[#F5F6FA] mb-1">Draft Exchange Proposal</h3>
                <p className="body-md text-xs text-[#A4B0BE] mb-5">State your shared learning goal, current projects, and preferred discussion topics.</p>
                
                <textarea 
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  className="input-field h-36 resize-none text-xs sm:text-sm rounded-none"
                />
                
                <div className="mt-4 p-3.5 rounded-none bg-[#2B313A] border border-[rgba(255,255,255,0.1)] flex items-center gap-2.5 text-xs text-[#F5F6FA]">
                  <Sparkles size={16} className="text-[#55E6C1] shrink-0" />
                  <span className="text-[#A4B0BE]">Recommendation: Propose a specific mini-project to build together across 2-4 weeks for best retention.</span>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <span className="tag-chip text-[10px] mb-2 inline-block">STEP 03</span>
                <h3 className="heading-h2 text-lg text-[#F5F6FA] mb-1">Propose Kickoff Window</h3>
                <p className="body-md text-xs text-[#A4B0BE] mb-6">Choose an ideal time slot for your initial 30-minute sync.</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { day: "Mon, Apr 14", slots: "3 slots available" },
                    { day: "Tue, Apr 15", slots: "1 slot available" },
                    { day: "Wed, Apr 16", slots: "FULLY BOOKED" },
                    { day: "Thu, Apr 17", slots: "4 slots available" }
                  ].map((s, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-none border ${
                        s.slots === "FULLY BOOKED"
                          ? 'opacity-40 pointer-events-none bg-[#242A32]'
                          : 'border-[rgba(255,255,255,0.12)] hover:border-[#6C5CE7] hover:bg-[#353B48] cursor-pointer'
                      } transition-colors`}
                    >
                      <Calendar className="text-[#55E6C1] mb-2" size={18} />
                      <p className="font-bold text-xs text-[#F5F6FA] mb-0.5">{s.day}</p>
                      <p className="font-mono text-[9px] text-[#A4B0BE]">{s.slots}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-[#2B313A] text-[#55E6C1] rounded-none flex items-center justify-center mx-auto mb-4 border border-[rgba(85,230,193,0.3)]">
                  <ArrowLeftRight size={22} strokeWidth={2.5} />
                </div>
                <h3 className="heading-h2 text-lg text-[#F5F6FA] mb-1">Proposal Ready For Transmission</h3>
                <p className="body-md text-xs text-[#A4B0BE] max-w-sm mx-auto mb-6">
                  {partner.name.split(' ')[0]} will receive a notification in dashboard and inbox to confirm the swap.
                </p>
                
                <div className="p-4 rounded-none bg-[#2B313A] border border-[rgba(255,255,255,0.1)] text-left mb-4 space-y-3 max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-none bg-[#242A32] border border-[rgba(255,255,255,0.08)] text-[#55E6C1]">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#F5F6FA]">CADENCE</p>
                      <p className="font-mono text-[10px] text-[#A4B0BE]">2 SESSIONS PER WEEK (45 MINS)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-none bg-[#242A32] border border-[rgba(255,255,255,0.08)] text-[#55E6C1]">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#F5F6FA]">INITIAL KICKOFF</p>
                      <p className="font-mono text-[10px] text-[#A4B0BE]">Monday • 14:00 UTC</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="pt-6 border-t border-[rgba(255,255,255,0.1)] flex justify-between items-center">
              <button 
                onClick={prevStep}
                className={`flex items-center gap-1.5 text-xs font-semibold text-[#A4B0BE] hover:text-[#F5F6FA] transition-colors ${
                  step === 1 ? 'invisible' : ''
                }`}
              >
                <ArrowLeft size={15} /> Back
              </button>
              
              {step < totalSteps ? (
                <button onClick={nextStep} className="btn btn-primary text-xs py-2 px-5 rounded-none">
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button onClick={handleFinish} className="btn btn-cta text-xs py-2 px-5 rounded-none">
                  <span>Transmit Proposal</span>
                  <Zap size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapFlow;
