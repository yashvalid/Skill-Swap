import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Clock, 
  Zap, 
  CheckCircle2,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';

const SwapFlow = () => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const partner = {
    name: "Elena Vance",
    skill: "Product Design",
    seeking: "React Basics"
  };

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const steps = [
    { title: "Choose Skill", desc: "Select what you'll offer" },
    { title: "Propose Swap", desc: "Draft your proposal" },
    { title: "Schedule", desc: "Pick your first session" },
    { title: "Confirm", desc: "Send your request" }
  ];

  return (
    <div className="container py-12 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        
        {/* Progress Stepper */}
        <div className="flex justify-between mb-16 relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant -z-10"></div>
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center bg-background px-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step > i + 1 ? 'bg-secondary text-white' : 
                step === i + 1 ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 
                'bg-surface-container text-on-surface-variant'
              }`}>
                {step > i + 1 ? <CheckCircle2 size={20} /> : i + 1}
              </div>
              <p className={`mt-3 text-xs font-bold uppercase tracking-widest ${
                step === i + 1 ? 'text-primary' : 'text-on-surface-variant'
              }`}>
                {s.title}
              </p>
            </div>
          ))}
        </div>

        {/* Card Content */}
        <div className="card shadow-2xl bg-white p-0 overflow-hidden min-h-[500px] flex flex-col md:flex-row border border-white/40">
          
          {/* Details Sidebar */}
          <div className="w-full md:w-80 bg-surface-container-low p-8 border-r border-outline-variant flex flex-col">
            <h2 className="headline-sm text-lg mb-8" style={{ fontFamily: 'var(--font-display)' }}>Swap Request</h2>
            
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white shadow-sm shrink-0">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.name}`} alt={partner.name} />
              </div>
              <div>
                <p className="font-bold">{partner.name}</p>
                <div className="flex items-center gap-1 text-secondary font-bold text-[10px] uppercase tracking-wider">
                  Verified Mentor <CheckCircle2 size={10} />
                </div>
              </div>
            </div>
            
            <div className="space-y-6 mt-auto">
              <div className="p-4 rounded-2xl bg-white border border-outline-variant">
                <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Learning from Elena</p>
                <p className="font-bold text-sm">{partner.skill}</p>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/10">
                <p className="text-[10px] uppercase tracking-widest font-bold text-secondary mb-1">Offering Elena</p>
                <p className="font-bold text-sm">{partner.seeking}</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-grow p-8 md:p-12 flex flex-col">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="headline-sm mb-4">What skill will you offer?</h3>
                <p className="text-on-surface-variant mb-10">Elena is specifically looking for <b>React Basics</b>, but you can propose others.</p>
                
                <div className="space-y-4">
                  {["React Basics", "CSS Architecture", "TypeScript Fundamentals"].map((skill, i) => (
                    <label key={i} className="flex items-center gap-4 p-5 rounded-2xl border-2 border-outline-variant cursor-pointer hover:border-primary/20 hover:bg-surface-container-low transition-all">
                      <input type="radio" name="skill" defaultChecked={i === 0} className="w-5 h-5 accent-primary" />
                      <div>
                        <p className="font-bold">{skill}</p>
                        <p className="text-xs text-on-surface-variant">42 hours of expertise verified</p>
                      </div>
                      {i === 0 && <span className="ml-auto text-[10px] font-bold bg-secondary/10 text-secondary px-2 py-1 rounded-full">MATCHED</span>}
                    </label>
                  ))}
                  <button className="text-primary font-bold text-sm mt-4 flex items-center gap-1">
                    Add new skill to profile <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="headline-sm mb-4">Draft your proposal</h3>
                <p className="text-on-surface-variant mb-8">Personalized messages increase swap acceptance rates by 80%.</p>
                
                <textarea 
                  className="w-full h-48 p-6 rounded-3xl bg-surface-container-low border-none focus:ring-2 ring-primary/20 outline-none font-medium resize-none"
                  placeholder="Hi Elena! I saw you're looking for React help. I've been building apps with React for 2 years and would love to swap for some Product Design knowledge..."
                ></textarea>
                
                <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                  <Sparkles size={18} className="text-primary shrink-0" />
                  <p className="text-xs text-on-surface-variant font-medium">Tip: Be specific about what you want to achieve in the first 2 weeks.</p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="headline-sm mb-4">Pick a starting window</h3>
                <p className="text-on-surface-variant mb-10">Choose when you'd like to have your first 1:1 session.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { day: "Mon, Apr 14", slots: "3 slots available" },
                    { day: "Tue, Apr 15", slots: "1 slot available" },
                    { day: "Wed, Apr 16", slots: "Fully booked" },
                    { day: "Thu, Apr 17", slots: "5 slots available" }
                  ].map((s, i) => (
                    <div key={i} className={`p-6 rounded-3xl border-2 ${s.slots === "Fully booked" ? 'opacity-50 pointer-events-none' : 'border-outline-variant hover:border-primary/20 cursor-pointer'} transition-all`}>
                      <Calendar className="text-on-surface-variant mb-4" size={24} />
                      <p className="font-bold mb-1">{s.day}</p>
                      <p className="text-xs text-on-surface-variant">{s.slots}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-10">
                <div className="w-24 h-24 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-secondary/5">
                  <Zap size={48} fill="currentColor" />
                </div>
                <h3 className="headline-sm mb-4">Almost there!</h3>
                <p className="text-on-surface-variant max-w-sm mx-auto mb-10 text-lg">
                  Review your swap details. Once sent, Elena will have 48 hours to accept your proposal.
                </p>
                
                <div className="p-8 rounded-3xl bg-surface-container border border-outline-variant text-left mb-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="label-md font-bold uppercase tracking-widest text-primary">Swap Details</span>
                    <button onClick={() => setStep(1)} className="text-primary text-xs font-bold hover:underline">Edit</button>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-2xl bg-white"><Clock size={20} className="text-primary" /></div>
                    <div>
                      <p className="font-bold">Weekly Commitment</p>
                      <p className="text-xs text-on-surface-variant">2 Sessions (1h each)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white"><Calendar size={20} className="text-primary" /></div>
                    <div>
                      <p className="font-bold">First Session</p>
                      <p className="text-xs text-on-surface-variant">Mon, Apr 14 @ 14:00</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-auto pt-10 flex justify-between items-center">
              <button 
                onClick={prevStep}
                className={`flex items-center gap-2 font-bold text-on-surface-variant hover:text-primary transition-colors ${step === 1 ? 'invisible' : ''}`}
              >
                <ArrowLeft size={18} /> Previous
              </button>
              
              {step < totalSteps ? (
                <button onClick={nextStep} className="btn btn-primary px-10">
                  Continue <ArrowRight size={18} />
                </button>
              ) : (
                <button className="btn btn-primary px-12 py-4">
                  Send Swap Request <Zap size={20} />
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
