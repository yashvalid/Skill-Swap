import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2, Star, Users, LayoutDashboard } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="container py-24">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center gap-16 mb-40">
        <div className="flex-1 text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-container/30 text-secondary font-bold text-sm mb-8">
            <Sparkles size={16} />
            <span>Join 1,200+ active learners</span>
          </div>
          <h1 className="display-lg leading-[1.1] mb-8">
            Master Every <span className="text-primary italic">Skill</span> Through Human <span className="text-secondary">Connection</span>
          </h1>
          <p className="text-xl text-on-surface-variant mb-12 max-w-xl">
            Experience the "Curated Commons"—where expertise isn't sold, but shared. Connect with mentors and peers in a collaborative marketplace designed for high-end growth.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/marketplace" className="btn btn-primary text-lg px-8 py-4">
              Explore Marketplace <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-secondary text-lg px-2 py-4">
              Learn More
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-6">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4]?.map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-background bg-surface-container-high flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="User" />
                </div>
              ))}
            </div>
            <div className="text-sm">
              <div className="flex text-secondary mb-1">
                {[1, 2, 3, 4, 5]?.map((s) => <Star key={s} size={14} fill="currentColor" />)}
              </div>
              <p className="font-semibold text-on-surface">Trusted by world-class experts</p>
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          <div className="aspect-square bg-gradient-to-br from-primary-container/20 to-secondary-container/20 rounded-[3rem] absolute -rotate-6 scale-105 z-0"></div>
          <div className="card h-full relative z-10 p-0 overflow-hidden shadow-2xl border border-white/40">
            <img
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
              alt="Community Learning"
              className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-x-8 bottom-8 glass p-8 rounded-3xl border border-white/20">
              <div className="flex items-center gap-4 mb-3 text-secondary">
                <Users />
                <span className="font-bold">Next Open Swap</span>
              </div>
              <p className="text-lg font-bold mb-4">UI/UX Mentorship Session</p>
              <div className="flex justify-between items-center">
                <span className="label-md">Starts in 3 hours</span>
                <span className="btn btn-primary py-2 px-6 rounded-full text-sm">Remind Me</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-40">
        <div className="text-center mb-20">
          <h2 className="display-lg text-4xl mb-6">Built for Intentional Growth</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-lg text-pretty">
            We've reimagined the marketplace experience. No rigid grids. No generic patterns. Just a high-end platform focused on what matters most: human potential.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Tonal Layering",
              desc: "Experience depth through light and color, not artificial borders. A clean, premium aesthetic for focused learning.",
              color: "primary",
              icon: <Sparkles />
            },
            {
              title: "Editorial Design",
              desc: "Layouts that breathe. We use oversized typography and generous whitespace to create a magazine-like feel.",
              color: "secondary",
              icon: <LayoutDashboard />
            },
            {
              title: "The Collective",
              desc: "A marketplace built on trust. Review profiles, check endorsements, and find the perfect learning partner.",
              color: "tertiary",
              icon: <ArrowRight />
            }
          ]?.map((feature, i) => (
            <div key={i} className="card border border-outline-variant hover:border-primary/20 bg-surface-container-low">
              <div className={`w-14 h-14 rounded-2xl bg-${feature.color}/10 text-${feature.color} flex items-center justify-center mb-8`}>
                {feature.icon}
              </div>
              <h3 className="headline-sm mb-4">{feature.title}</h3>
              <p className="text-on-surface-variant">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mb-24">
        <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary to-primary-container p-16 md:p-24 text-center text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-container/20 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="display-lg mb-8 leading-tight">Ready to unlock your potential?</h2>
            <p className="text-xl opacity-90 mb-12">
              Join the collective today and start swapping skills with experts around the globe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login" className="btn bg-white text-primary py-4 px-10 text-lg hover:bg-surface-container">
                Get Started Now
              </Link>
              <Link to="/docs" className="btn border border-white/40 text-white py-4 px-10 text-lg hover:bg-white/10">
                View Guidelines
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
