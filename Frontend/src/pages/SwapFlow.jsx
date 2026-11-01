import React, { useState, useEffect } from 'react';
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
  Shield, 
  Globe, 
  Download, 
  ExternalLink 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { swapService } from '../services/swapService';
import toast from 'react-hot-toast';
import { isUserVerified } from '../utils/userVerification';
import { generateGoogleCalendarUrl, downloadIcsFile, formatSessionDate } from '../utils/calendar';

const TIME_SLOTS = [
  { time: '10:00', label: '10:00 AM', period: 'Morning' },
  { time: '11:30', label: '11:30 AM', period: 'Morning' },
  { time: '14:00', label: '02:00 PM', period: 'Afternoon' },
  { time: '16:00', label: '04:00 PM', period: 'Afternoon' },
  { time: '18:00', label: '06:00 PM', period: 'Evening' },
  { time: '19:30', label: '07:30 PM', period: 'Evening' }
];

const DURATIONS = [
  { minutes: 30, label: '30 mins', desc: 'Quick Milestone' },
  { minutes: 45, label: '45 mins', desc: 'Standard Swap' },
  { minutes: 60, label: '60 mins', desc: 'Deep Dive' }
];

const SwapFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const passedPartner = location.state?.partner;
  const partner = passedPartner ? {
    _id: passedPartner._id,
    name: `${passedPartner.fullname?.firstname || ''} ${passedPartner.fullname?.lastname || ''}`.trim() || 'Partner',
    skill: passedPartner.skillsOffered?.[0] || 'Technical Mentorship',
    seeking: passedPartner.skillsNeeded?.[0] || 'Peer Exchange'
  } : {
    _id: null,
    name: "Partner",
    skill: "Mentorship",
    seeking: "Skill Exchange"
  };

  useEffect(() => {
    if (!passedPartner) {
      toast('Please choose a partner from the marketplace to propose a swap.', { icon: '🔍' });
      navigate('/marketplace');
    }
  }, [passedPartner, navigate]);

  const [selectedOffering, setSelectedOffering] = useState("Web Development (React & Node)");
  const [proposalNotes, setProposalNotes] = useState(
    `Hi ${partner.name.split(' ')[0]}! I'd love to swap skills with you. I can help you with ${partner.seeking || 'what you want to learn'} in exchange for practicing ${partner.skill}. Let's build a great milestone together!`
  );

  // Scheduling state
  const upcomingDays = React.useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push({
        dateObj: d,
        dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dateStr: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        isoDate: d.toISOString().split('T')[0]
      });
    }
    return list;
  }, []);

  const [selectedDay, setSelectedDay] = useState(upcomingDays[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[2]); // 02:00 PM
  const [selectedDuration, setSelectedDuration] = useState(45);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const scheduledDateTime = React.useMemo(() => {
    if (!selectedDay || !selectedTimeSlot) return null;
    return new Date(`${selectedDay.isoDate}T${selectedTimeSlot.time}:00`);
  }, [selectedDay, selectedTimeSlot]);

  const [submitting, setSubmitting] = useState(false);
  const [proposalSentData, setProposalSentData] = useState(null);

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const steps = [
    { title: "SKILL", desc: "Select offering" },
    { title: "PROPOSAL", desc: "Draft message" },
    { title: "SCHEDULE", desc: "Pick slot" },
    { title: "CONFIRM", desc: "Review & Send" }
  ];

  const handleFinish = async () => {
    if (!partner._id) return;
    setSubmitting(true);
    try {
      const payload = {
        toUserId: partner._id,
        offersSkill: selectedOffering,
        requestsSkill: partner.skill,
        scheduledTime: scheduledDateTime ? scheduledDateTime.toISOString() : null,
        durationMinutes: selectedDuration,
        proposalNotes
      };

      const res = await swapService.requestSwap(payload);
      toast.success(`Swap proposal sent to ${partner.name}!`);
      setProposalSentData({
        ...payload,
        swapId: res.data?.skillSwap?._id
      });
    } catch (err) {
      console.error('Swap request error', err);
      toast.error(err.response?.data?.message || 'Failed to send proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadIcs = () => {
    if (!scheduledDateTime) return;
    downloadIcsFile({
      title: `SkillSwap: ${selectedOffering} ⇄ ${partner.skill} with ${partner.name}`,
      description: proposalNotes,
      startTime: scheduledDateTime,
      durationMinutes: selectedDuration,
      locationUrl: window.location.origin + '/dashboard',
      filename: `skillswap-${partner.name.toLowerCase().replace(/\s+/g, '-')}.ics`
    });
    toast.success('Calendar event (.ics) downloaded');
  };

  const googleCalendarUrl = scheduledDateTime ? generateGoogleCalendarUrl({
    title: `SkillSwap: ${selectedOffering} ⇄ ${partner.skill} with ${partner.name}`,
    description: proposalNotes,
    startTime: scheduledDateTime,
    durationMinutes: selectedDuration,
    locationUrl: window.location.origin + '/dashboard'
  }) : '#';

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-12 flex flex-col items-center">
      <div className="w-full">
        
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="tag-chip mb-2 inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FFEEA8]" />
            <span>START A SKILL SWAP</span>
          </div>
          <h1 className="heading-h1 text-[#F7F8FC]">
            Propose a Skill Swap
          </h1>
          <p className="body-md text-xs sm:text-sm text-[#A4B0C6] mt-1.5 mx-auto">
            Set expectations, pick meeting times, and coordinate session milestones.
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
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs font-mono transition-colors ${
                    isCompleted
                      ? 'bg-[#2B3F74] text-white shadow-sm'
                      : isCurrent
                      ? 'bg-[#171D2B] text-[#FFEEA8] border-2 border-[#FFEEA8] shadow-md'
                      : 'bg-[#202738] text-[#71809B] border border-[rgba(255,255,255,0.12)]'
                  }`}
                >
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : `0${i + 1}`}
                </div>
                <p className={`mt-2 font-mono text-[10px] font-semibold ${
                  isCurrent ? 'text-[#FFEEA8]' : 'text-[#71809B]'
                }`}>
                  {s.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Main Card Container */}
        <div className="ui-card bg-[#283144] shadow-2xl rounded-2xl overflow-hidden min-h-[460px] flex flex-col md:flex-row border border-[rgba(255,255,255,0.12)]">
          
          {/* Details Sidebar */}
          <div className="w-full md:w-72 bg-[#202738] p-6 border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.1)] flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-[#A4B0C6] uppercase block mb-4 font-semibold">
                Partner
              </span>
              
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-11 h-11 rounded-2xl overflow-hidden bg-[#171D2B] border border-[rgba(255,255,255,0.15)] shrink-0">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.name}`} alt={partner.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#F7F8FC]">{partner.name}</p>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    {isUserVerified(passedPartner || partner) ? (
                      <span className="text-[#FFEEA8] flex items-center gap-1">VERIFIED <CheckCircle2 size={11} /></span>
                    ) : (
                      <span className="text-[#71809B]">COMMUNITY MEMBER</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#171D2B] border border-[rgba(255,255,255,0.08)]">
                  <p className="font-mono text-[9px] text-[#71809B] mb-1 uppercase">Receiving from {partner.name.split(' ')[0]}</p>
                  <p className="font-bold text-xs text-[#F7F8FC]">{partner.skill}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#171D2B] border border-[rgba(255,238,168,0.3)]">
                  <p className="font-mono text-[9px] text-[#FFEEA8] mb-1 uppercase font-semibold">Offering to {partner.name.split(' ')[0]}</p>
                  <p className="font-bold text-xs text-[#F7F8FC]">{selectedOffering}</p>
                </div>
                {scheduledDateTime && (
                  <div className="p-3 rounded-xl bg-[#283144] border border-[rgba(255,255,255,0.08)]">
                    <p className="font-mono text-[9px] text-[#A4B0C6] uppercase mb-0.5">Proposed Slot</p>
                    <p className="text-xs font-bold text-[#FFEEA8]">
                      {selectedDay.dayName}, {selectedDay.dateStr} • {selectedTimeSlot.label}
                    </p>
                    <span className="text-[10px] text-[#A4B0C6] font-mono">({selectedDuration} mins)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 text-[10px] text-[#71809B] font-mono">
              <span>ZERO FEES • 100% FREE RECIPROCAL SWAP</span>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-grow p-6 sm:p-10 flex flex-col justify-between bg-[#202738]">
            {proposalSentData ? (
              /* Success Confirmation Screen */
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#2B3F74] text-[#FFEEA8] flex items-center justify-center mx-auto shadow-lg border border-[rgba(255,238,168,0.3)]">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="heading-h1 text-xl text-[#F7F8FC]">Proposal Dispatched!</h3>
                  <p className="text-xs text-[#A4B0C6] mt-1 max-w-sm mx-auto">
                    {partner.name} has been notified. Keep your calendar aligned by adding this kickoff slot right now.
                  </p>
                </div>

                {/* Calendar Sync Card */}
                <div className="p-4 rounded-xl bg-[#283144] border border-[rgba(255,238,168,0.3)] max-w-md mx-auto text-left space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#FFEEA8]">
                    <Calendar size={14} />
                    <span className="font-bold">Sync Kickoff Meeting to Your Calendar</span>
                  </div>
                  <p className="text-xs text-[#F7F8FC] font-medium">
                    {formatSessionDate(scheduledDateTime)} ({selectedDuration} mins)
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={googleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 rounded-lg"
                    >
                      <ExternalLink size={13} className="text-[#FFEEA8]" />
                      <span>Google Calendar</span>
                    </a>
                    <button
                      onClick={handleDownloadIcs}
                      className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 rounded-lg"
                    >
                      <Download size={13} className="text-[#FFEEA8]" />
                      <span>Download .ics</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-primary text-xs py-2.5 px-6 rounded-xl"
                  >
                    Go to Swaps Dashboard →
                  </button>
                </div>
              </div>
            ) : (
              <>
                {step === 1 && (
                  <div>
                    <span className="tag-chip text-[10px] mb-2 inline-block">STEP 01</span>
                    <h3 className="heading-h2 text-lg text-[#F7F8FC] mb-1">Select Your Knowledge Offering</h3>
                    <p className="body-md text-xs text-[#A4B0C6] mb-6">Choose the skill you will teach during this reciprocal exchange.</p>
                    
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
                          className={`flex items-center gap-3.5 p-4 rounded-xl border transition-colors cursor-pointer ${
                            selectedOffering === skill.title
                              ? 'border-[#2B3F74] bg-[#283144] shadow-xs'
                              : 'border-[rgba(255,255,255,0.1)] hover:border-[#2B3F74] hover:bg-[#283144]/50'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="skill" 
                            checked={selectedOffering === skill.title}
                            onChange={() => setSelectedOffering(skill.title)}
                            className="w-4 h-4 accent-[#2B3F74]" 
                          />
                          <div className="flex-1">
                            <p className="font-bold text-xs sm:text-sm text-[#F7F8FC]">{skill.title}</p>
                            <p className="font-mono text-[10px] text-[#71809B]">ESTABLISHED COMPETENCY</p>
                          </div>
                          {skill.match && (
                            <span className="tag-chip text-[9px] py-0.5 px-2 bg-[rgba(255,238,168,0.15)] text-[#FFEEA8] border border-[rgba(255,238,168,0.3)] font-bold">
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
                    <h3 className="heading-h2 text-lg text-[#F7F8FC] mb-1">Draft Exchange Proposal</h3>
                    <p className="body-md text-xs text-[#A4B0C6] mb-5">State your shared learning goal, current projects, and preferred discussion topics.</p>
                    
                    <textarea 
                      value={proposalNotes}
                      onChange={(e) => setProposalNotes(e.target.value)}
                      className="input-field h-36 resize-none text-xs sm:text-sm rounded-xl"
                      placeholder="Explain what project or concept you want to tackle together..."
                    />
                    
                    <div className="mt-4 p-3.5 rounded-xl bg-[#283144] border border-[rgba(255,255,255,0.1)] flex items-center gap-2.5 text-xs text-[#F7F8FC]">
                      <Sparkles size={16} className="text-[#FFEEA8] shrink-0" />
                      <span className="text-[#A4B0C6]">Pro-tip: Concrete milestones (e.g. "Build an API together") lead to 3x higher swap completion rates.</span>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="tag-chip text-[10px]">STEP 03</span>
                      <span className="font-mono text-[10px] text-[#A4B0C6] flex items-center gap-1">
                        <Globe size={11} className="text-[#FFEEA8]" />
                        <span>{userTimezone}</span>
                      </span>
                    </div>
                    <h3 className="heading-h2 text-lg text-[#F7F8FC] mb-1">Schedule Kickoff Session</h3>
                    <p className="body-md text-xs text-[#A4B0C6] mb-5">Pick an upcoming day and time slot for your initial 1-on-1 video call.</p>
                    
                    {/* Day Selector */}
                    <label className="font-mono text-[10px] text-[#A4B0C6] uppercase font-semibold block mb-2">Select Day</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
                      {upcomingDays.map((d, i) => {
                        const isSelected = selectedDay.isoDate === d.isoDate;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedDay(d)}
                            className={`p-2 rounded-xl text-center border transition-all ${
                              isSelected
                                ? 'bg-[#2B3F74] text-white border-[#FFEEA8] shadow-sm'
                                : 'bg-[#171D2B] text-[#A4B0C6] border-[rgba(255,255,255,0.08)] hover:border-[#2B3F74]'
                            }`}
                          >
                            <p className="font-mono text-[10px] uppercase">{d.dayName}</p>
                            <p className="font-bold text-xs mt-0.5">{d.dateStr.split(' ')[1]}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Time Slot Selector */}
                    <label className="font-mono text-[10px] text-[#A4B0C6] uppercase font-semibold block mb-2">Select Time Slot ({selectedDay.dayName}, {selectedDay.dateStr})</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
                      {TIME_SLOTS.map((slot, i) => {
                        const isSelected = selectedTimeSlot.time === slot.time;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#283144] border-[#FFEEA8] text-white shadow-xs'
                                : 'bg-[#171D2B] border-[rgba(255,255,255,0.08)] text-[#A4B0C6] hover:border-[#2B3F74]'
                            }`}
                          >
                            <div>
                              <p className="text-xs font-bold text-[#F7F8FC]">{slot.label}</p>
                              <span className="font-mono text-[9px] text-[#71809B]">{slot.period}</span>
                            </div>
                            <Clock size={13} className={isSelected ? 'text-[#FFEEA8]' : 'text-[#71809B]'} />
                          </button>
                        );
                      })}
                    </div>

                    {/* Duration Selector */}
                    <label className="font-mono text-[10px] text-[#A4B0C6] uppercase font-semibold block mb-2">Session Duration</label>
                    <div className="grid grid-cols-3 gap-2">
                      {DURATIONS.map((dur) => (
                        <button
                          key={dur.minutes}
                          type="button"
                          onClick={() => setSelectedDuration(dur.minutes)}
                          className={`p-2 rounded-xl text-center border transition-all ${
                            selectedDuration === dur.minutes
                              ? 'bg-[#2B3F74] text-white border-[#FFEEA8]'
                              : 'bg-[#171D2B] text-[#A4B0C6] border-[rgba(255,255,255,0.08)] hover:border-[#2B3F74]'
                          }`}
                        >
                          <p className="text-xs font-bold">{dur.label}</p>
                          <span className="font-mono text-[9px] opacity-75">{dur.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="text-center py-2">
                    <div className="w-12 h-12 bg-[#202738] text-[#FFEEA8] rounded-xl flex items-center justify-center mx-auto mb-3 border border-[rgba(255,238,168,0.3)]">
                      <ArrowLeftRight size={22} strokeWidth={2.5} />
                    </div>
                    <h3 className="heading-h2 text-lg text-[#F7F8FC] mb-1">Swap Proposal Review</h3>
                    <p className="body-md text-xs text-[#A4B0C6] max-w-sm mx-auto mb-5">
                      Review your reciprocal exchange contract before notifying {partner.name.split(' ')[0]}.
                    </p>
                    
                    <div className="p-4 rounded-xl bg-[#283144] border border-[rgba(255,255,255,0.1)] text-left mb-4 space-y-3 max-w-md mx-auto">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#171D2B] border border-[rgba(255,255,255,0.08)] text-[#FFEEA8]">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#F7F8FC]">KICKOFF DATE & TIME</p>
                          <p className="font-mono text-[10px] text-[#FFEEA8]">
                            {selectedDay.dayName}, {selectedDay.dateStr} • {selectedTimeSlot.label} ({selectedDuration} mins)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#171D2B] border border-[rgba(255,255,255,0.08)] text-[#FFEEA8]">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#F7F8FC]">TIMEZONE</p>
                          <p className="font-mono text-[10px] text-[#A4B0C6]">{userTimezone}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
                        <p className="font-mono text-[9px] text-[#A4B0C6] uppercase mb-1">Exchange Summary</p>
                        <p className="text-xs text-[#F7F8FC]">
                          <span className="text-[#FFEEA8]">You Teach:</span> {selectedOffering}
                        </p>
                        <p className="text-xs text-[#F7F8FC] mt-0.5">
                          <span className="text-[#A4B0C6]">You Learn:</span> {partner.skill}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="pt-6 border-t border-[rgba(255,255,255,0.1)] flex justify-between items-center">
                  <button 
                    onClick={prevStep}
                    className={`flex items-center gap-1.5 text-xs font-semibold text-[#A4B0C6] hover:text-[#F7F8FC] transition-colors ${
                      step === 1 ? 'invisible' : ''
                    }`}
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                  
                  {step < totalSteps ? (
                    <button onClick={nextStep} className="btn btn-primary text-xs py-2 px-5 rounded-xl">
                      <span>Continue</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleFinish} 
                      disabled={submitting}
                      className="btn btn-cta text-xs py-2 px-5 rounded-xl flex items-center gap-1.5"
                    >
                      <span>{submitting ? 'Sending...' : 'Confirm & Send Proposal'}</span>
                      <Zap size={14} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapFlow;
