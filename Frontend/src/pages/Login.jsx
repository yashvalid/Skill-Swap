import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, Code, User, Briefcase, MapPin, AlignLeft } from 'lucide-react';
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
    <div className="container min-h-[80vh] flex items-center justify-center py-20">
      <div className="w-full max-w-6xl flex flex-col md:flex-row bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/40">
        
        {/* Left Side - Image & Brand */}
        <div className="flex-1 bg-gradient-to-br from-primary to-primary-container p-12 md:p-16 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-container/20 blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-2xl mb-12">
              <Sparkles className="text-secondary-container" />
              <span style={{ fontFamily: 'var(--font-display)' }}>skillSwap</span>
            </Link>
            <h2 className="display-lg text-4xl mb-6">Welcome to the Curated Commons</h2>
            <p className="text-xl opacity-90 leading-relaxed">
              {isLogin 
                ? "Join a high-end collective focused on intentional growth and mutual mentorship."
                : "Create your profile and start offering your expertise to a world of active learners."}
            </p>
          </div>
          
          <div className="relative z-10 p-6 rounded-3xl bg-white/10 backdrop-blur-md">
            <p className="text-sm font-medium italic opacity-90">
              "SkillSwap has fundamentally changed how I view networking. It's not about what you can get, but what you can share."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elena" alt="Elena" />
              </div>
              <span className="text-xs font-bold font-display uppercase tracking-wider">Elena Vance, Product Designer</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 p-12 lg:p-16 bg-surface overflow-y-auto max-h-[90vh]">
          <div className="mb-8">
            <h1 className="headline-sm text-3xl mb-2">{isLogin ? 'Login to SkillSwap' : 'Create Account'}</h1>
            <p className="text-on-surface-variant font-medium">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-primary font-bold hover:underline"
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="md:col-span-1">
                  <label className="label-md mb-2 block font-bold">First Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                      <User size={18} />
                    </span>
                    <input 
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleChange}
                      type="text" 
                      required
                      placeholder="John" 
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-container-low border-none focus:ring-2 ring-primary/20 outline-none font-medium"
                    />
                  </div>
                </div>
                <div className="md:col-span-1">
                  <label className="label-md mb-2 block font-bold">Last Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                      <User size={18} />
                    </span>
                    <input 
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleChange}
                      type="text" 
                      required
                      placeholder="Doe" 
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-container-low border-none focus:ring-2 ring-primary/20 outline-none font-medium"
                    />
                  </div>
                </div>
                <div className="md:col-span-1">
                  <label className="label-md mb-2 block font-bold">Role/Occupation</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                      <Briefcase size={18} />
                    </span>
                    <input 
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      type="text" 
                      required
                      placeholder="Developer" 
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-container-low border-none focus:ring-2 ring-primary/20 outline-none font-medium"
                    />
                  </div>
                </div>
                <div className="md:col-span-1">
                  <label className="label-md mb-2 block font-bold">Location</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                      <MapPin size={18} />
                    </span>
                    <input 
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      type="text" 
                      required
                      placeholder="New York" 
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-container-low border-none focus:ring-2 ring-primary/20 outline-none font-medium"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="label-md mb-2 block font-bold">Bio</label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-on-surface-variant">
                      <AlignLeft size={18} />
                    </span>
                    <textarea 
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      required
                      placeholder="Tell us about yourself..." 
                      className="w-full pl-12 pr-4 py-3 min-h-[100px] rounded-2xl bg-surface-container-low border-none focus:ring-2 ring-primary/20 outline-none font-medium"
                    ></textarea>
                  </div>
                </div>
              </>
            )}
            
            <div className={isLogin ? 'md:col-span-2' : 'md:col-span-2'}>
              <label className="label-md mb-2 block font-bold">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <Mail size={18} />
                </span>
                <input 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email" 
                  required
                  placeholder="name@example.com" 
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-container-low border-none focus:ring-2 ring-primary/20 outline-none font-medium"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-2">
                <label className="label-md block font-bold">Password</label>
                {isLogin && <button type="button" className="text-xs font-bold text-primary hover:underline">Forgot password?</button>}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <Lock size={18} />
                </span>
                <input 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type="password" 
                  required
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-container-low border-none focus:ring-2 ring-primary/20 outline-none font-medium"
                />
              </div>
            </div>

            <button type="submit" className="md:col-span-2 w-full btn btn-primary py-4 justify-center text-lg mt-4">
              {isLogin ? 'Login to Account' : 'Create My Account'} <ArrowRight size={20} />
            </button>
          </form>

          <div className="relative my-8 text-center md:col-span-2">
            <span className="relative z-10 px-4 bg-surface text-on-surface-variant text-sm font-bold">OR CONTINUE WITH</span>
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:col-span-2">
            <button className="flex items-center justify-center gap-3 p-4 rounded-2xl border border-outline-variant hover:bg-white transition-colors font-bold text-sm">
              <Code size={20} /> Github
            </button>
            <button className="flex items-center justify-center gap-3 p-4 rounded-2xl border border-outline-variant hover:bg-white transition-colors font-bold text-sm">
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5 opacity-70" alt="Google" /> Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
