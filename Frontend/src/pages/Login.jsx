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
  ArrowLeftRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
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
      const userData = {
        fullname: {
          firstname: formData.firstname,
          lastname: formData.lastname
        },
        email: formData.email,
        password: formData.password,
        role: formData.role,
        location: formData.location,
        bio: formData.bio
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
            <div className="w-8 h-8 rounded-none bg-[#6C5CE7] text-white font-bold flex items-center justify-center transition-transform group-hover:scale-105">
              <ArrowLeftRight size={17} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-[-0.025em] text-[#F5F6FA]">
              SKILL<span className="text-[#55E6C1]">SWAP</span>
            </span>
          </Link>
          <h1 className="heading-h1 text-[#F5F6FA] text-2xl sm:text-3xl">
            {isLogin ? 'Authenticate Access' : 'Create Member Account'}
          </h1>
          <p className="body-md text-xs sm:text-sm text-[#A4B0BE] mt-1.5 mx-auto">
            {isLogin 
              ? 'Access your active bilateral swaps, study syllabi, and peer messages.' 
              : 'Trade modern mastery without monetary transaction fees.'}
          </p>
        </div>

        {/* Form Card */}
        <div className="ui-card rounded-none p-6 sm:p-8 bg-[#353B48] border border-[rgba(255,255,255,0.12)] shadow-2xl">
          
          {/* Segmented Switcher */}
          <div className="flex p-1 bg-[#242A32] rounded-none mb-6 border border-[rgba(255,255,255,0.1)]">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-none text-xs font-mono font-medium uppercase tracking-tight transition-colors ${
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
              className={`flex-1 py-2 rounded-none text-xs font-mono font-medium uppercase tracking-tight transition-colors ${
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
                <div className="grid grid-cols-2 gap-3">
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
                        className="input-field pl-8 rounded-none"
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
                        className="input-field pl-8 rounded-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                        className="input-field pl-8 rounded-none"
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
                        className="input-field pl-8 rounded-none"
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
                      className="input-field pl-8 min-h-[70px] resize-none rounded-none"
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
                  className="input-field pl-8 rounded-none"
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
                  className="input-field pl-8 rounded-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn btn-cta py-2.5 justify-center text-xs sm:text-sm font-semibold mt-4 flex items-center gap-2 rounded-none"
            >
              <span>{isLogin ? 'Sign In to Account' : 'Create Exchange Account'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-center gap-2 text-xs font-mono text-[#A4B0BE]">
            <ShieldCheck size={14} className="text-[#55E6C1]" />
            <span>Zero monetary transaction fees. Built on mutual peer credits.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
