import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  User, 
  Briefcase, 
  MapPin, 
  AlignLeft, 
  ShieldCheck,
  ArrowLeftRight,
  X,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    role: '',
    location: '',
    bio: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      if (await login(formData.email, formData.password)) {
        navigate('/dashboard');
      }
    } else {
      if (!agreedToPolicy) {
        toast.error('Please read and agree to the Privacy Policy to create an account');
        return;
      }
      const userData = {
        fullname: {
          firstname: formData.firstname,
          lastname: formData.lastname
        },
        email: formData.email,
        password: formData.password,
        role: formData.role,
        location: formData.location,
        bio: formData.bio,
        agreedToPrivacyPolicy: true,
        privacyPolicyAccepted: true
      };
      if (await register(userData)) {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-lg">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-8 h-8 rounded-xl bg-[#6C5CE7] text-white font-bold flex items-center justify-center transition-transform group-hover:scale-105">
              <ArrowLeftRight size={17} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-[-0.025em] text-[#F5F6FA]">
              SKILL<span className="text-[#55E6C1]">SWAP</span>
            </span>
          </Link>
          <h1 className="heading-h1 text-[#F5F6FA] text-2xl sm:text-3xl">
            {isLogin ? 'Sign In to Account' : 'Create Your Account'}
          </h1>
          <p className="body-md text-xs sm:text-sm text-[#A4B0BE] mt-1.5 mx-auto">
            {isLogin 
              ? 'Access your active swaps, study plans, and messages.' 
              : 'Exchange skills 1-on-1 for free without paying fees.'}
          </p>
        </div>

        {/* Form Card */}
        <div className="ui-card rounded-2xl p-4 sm:p-8 bg-[#353B48] border border-[rgba(255,255,255,0.12)] shadow-2xl">
          
          {/* Segmented Switcher */}
          <div className="flex p-1 bg-[#242A32] rounded-xl mb-6 border border-[rgba(255,255,255,0.1)]">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium uppercase tracking-tight transition-colors ${
                isLogin
                  ? 'bg-[#6C5CE7] text-white font-bold shadow-xs'
                  : 'text-[#A4B0BE] hover:text-[#F5F6FA]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium uppercase tracking-tight transition-colors ${
                !isLogin
                  ? 'bg-[#6C5CE7] text-white font-bold shadow-xs'
                  : 'text-[#A4B0BE] hover:text-[#F5F6FA]'
              }`}
            >
              Create Account
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="input-group">
                    <label className="input-label">
                      First Name
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718093]">
                        <User size={14} />
                      </span>
                      <input 
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleChange}
                        type="text" 
                        required
                        placeholder="Alex" 
                        className="input-field pl-8"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      Last Name
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718093]">
                        <User size={14} />
                      </span>
                      <input 
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleChange}
                        type="text" 
                        required
                        placeholder="Chen" 
                        className="input-field pl-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="input-group">
                    <label className="input-label">
                      Role / Title
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718093]">
                        <Briefcase size={14} />
                      </span>
                      <input 
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        type="text" 
                        required
                        placeholder="Frontend Architect" 
                        className="input-field pl-8"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      Location
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718093]">
                        <MapPin size={14} />
                      </span>
                      <input 
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        type="text" 
                        required
                        placeholder="Remote" 
                        className="input-field pl-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Bio & Expertise Overview
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-[#718093]">
                      <AlignLeft size={14} />
                    </span>
                    <textarea 
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      required
                      placeholder="Share what skills you have mastered and what you want to learn..." 
                      className="input-field pl-8 min-h-[70px] resize-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="input-group">
              <label className="input-label">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718093]">
                  <Mail size={14} />
                </span>
                <input 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email" 
                  required
                  placeholder="alex.chen@example.com" 
                  className="input-field pl-8"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718093]">
                  <Lock size={14} />
                </span>
                <input 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type="password" 
                  required
                  placeholder="••••••••" 
                  className="input-field pl-8"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="p-3 bg-[#242A32] border border-[rgba(255,255,255,0.08)] space-y-2">
                <div className="flex items-start gap-2.5">
                  <input 
                    type="checkbox"
                    id="privacyPolicyConsent"
                    checked={agreedToPolicy}
                    onChange={(e) => setAgreedToPolicy(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded accent-[#6C5CE7] cursor-pointer shrink-0"
                    required
                  />
                  <label htmlFor="privacyPolicyConsent" className="text-xs text-[#A4B0BE] leading-relaxed cursor-pointer select-none">
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowPolicyModal(true)}
                      className="text-[#55E6C1] underline font-medium hover:text-[#55E6C1]/80 inline-flex items-center gap-0.5"
                    >
                      Privacy Policy
                    </button>
                    . I understand live video calls are peer-to-peer and my personal data is never monetized.
                  </label>
                </div>
                
                <div className="flex items-center justify-between pl-6 text-[11px] font-mono text-[#718093]">
                  <span>Status: {agreedToPolicy ? 'Agreed' : 'Agreement required'}</span>
                  <button
                    type="button"
                    onClick={() => setShowPolicyModal(true)}
                    className="text-[#55E6C1] hover:underline"
                  >
                    Read Policy
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full btn btn-cta py-2.5 justify-center text-xs sm:text-sm font-semibold mt-4 flex items-center gap-2 rounded-xl"
            >
              <span>{isLogin ? 'Sign In to Account' : 'Create Your Account'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-center gap-2 text-xs font-mono text-[#A4B0BE]">
            <ShieldCheck size={14} className="text-[#55E6C1]" />
            <span>Free 1-on-1 learning. Earn credits as you teach and learn.</span>
          </div>
        </div>
      </div>

      {/* Privacy Policy Reader Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-[#353B48] border border-[rgba(255,255,255,0.15)] shadow-2xl rounded-2xl flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between bg-[#242A32]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-[#55E6C1]" />
                <div>
                  <h3 className="text-sm font-bold text-[#F5F6FA] uppercase tracking-wide">
                    SkillSwap Privacy Policy
                  </h3>
                  <p className="font-mono text-[10px] text-[#A4B0BE]">
                    Version 1.0 &bull; Effective October 2026
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="p-1.5 text-[#A4B0BE] hover:text-[#F5F6FA] hover:bg-[#2F3640] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Policy Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-[#A4B0BE] leading-relaxed">
              <div className="p-3 bg-[#242A32] border-l-2 border-[#55E6C1] text-[#F5F6FA] font-medium">
                Summary: We respect your privacy. Video calls connect directly between devices, we do not record audio/video, and we never sell your personal data.
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-[#F5F6FA] uppercase tracking-wider">
                  1. Information We Collect
                </h4>
                <p>
                  We store your name, email, chosen role, skills offered/needed, bio, and time zone to pair you with learning partners. We log call session timestamps and duration to chat for exchange accountability.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-[#F5F6FA] uppercase tracking-wider">
                  2. Direct 1-on-1 Video & Audio
                </h4>
                <p>
                  Direct 1-on-1 video calls connect directly between you and your partner. SkillSwap does NOT listen to, record, or store your live calls on our servers.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-[#F5F6FA] uppercase tracking-wider">
                  3. SkillBot AI Tutor
                </h4>
                <p>
                  Questions to SkillBot are processed in real-time to generate study assistance and practice tips. They remain private to your session and are not used for third-party public model training.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-[#F5F6FA] uppercase tracking-wider">
                  4. Security & Encryption
                </h4>
                <p>
                  Passwords are encrypted with industry-standard security and sessions use encrypted sign-in tokens.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-[#F5F6FA] uppercase tracking-wider">
                  5. Recording of Acceptance
                </h4>
                <p>
                  When you create an account, your acceptance of these terms is recorded alongside a timestamp in our database.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-[rgba(255,255,255,0.1)] bg-[#242A32] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Link
                to="/privacy"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#55E6C1] hover:underline inline-flex items-center justify-center sm:justify-start gap-1 font-mono py-1"
              >
                <span>Full Policy Page</span>
                <ExternalLink size={12} />
              </Link>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="btn btn-secondary text-xs py-2 px-3 flex-1 sm:flex-initial justify-center"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAgreedToPolicy(true);
                    setShowPolicyModal(false);
                    toast.success('Privacy Policy accepted');
                  }}
                  className="btn btn-primary text-xs py-2 px-4 flex-1 sm:flex-initial justify-center"
                >
                  I Read & Agree
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
