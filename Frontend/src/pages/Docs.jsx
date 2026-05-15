import React from 'react';
import { BookOpen, ShieldCheck, HelpCircle, FileText, Sparkles, Layout } from 'lucide-react';

const Docs = () => {
  return (
    <div className="container py-16 max-w-5xl">
      <header className="mb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6">
          <BookOpen size={16} />
          <span>Platform Documentation</span>
        </div>
        <h1 className="display-lg text-5xl mb-6">The Curated <span className="text-secondary italic">Commons</span></h1>
        <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">
          Guidelines, system design tokens, and product requirements for the SkillSwap ecosystem.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 border-r border-outline-variant pr-8 hidden md:block">
          <nav className="sticky top-32 space-y-2">
            {[
              { title: "Introduction", icon: <FileText size={18} /> },
              { title: "Design System", icon: <Sparkles size={18} /> },
              { title: "Product Features", icon: <Layout size={18} /> },
              { title: "Safety & Trust", icon: <ShieldCheck size={18} /> },
              { title: "FAQ", icon: <HelpCircle size={18} /> }
            ].map((link, i) => (
              <button key={i} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                i === 0 ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}>
                {link.icon}
                {link.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-24">
          <section id="introduction">
            <h2 className="headline-sm mb-8">1. The Vision</h2>
            <div className="prose max-w-none text-on-surface-variant space-y-6">
              <p className="text-lg leading-relaxed">
                SkillSwap is designed to move away from the sterile, "template-first" look of traditional marketplaces. Instead, it adopts a <b>High-End Editorial</b> approach titled <b>"The Curated Commons."</b>
              </p>
              <p>
                The Creative North Star is a blend of professional authority and organic community warmth. We achieve this by rejecting rigid, boxed-in layouts in favor of Tonal Layering and Intentional Asymmetry. We don't just "list" skills; we showcase human potential through a layout that feels like a premium lifestyle magazine—airy, sophisticated, and deeply trustworthy.
              </p>
            </div>
          </section>

          <section id="design-system">
            <h2 className="headline-sm mb-8">2. Design System Tokens</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="card bg-surface-container-low border border-outline-variant p-8">
                <h3 className="font-bold mb-4">Color Philosophy</h3>
                <p className="text-sm text-on-surface-variant mb-6">Boundaries are defined solely through background shifts, not 1px solid borders.</p>
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#004ac6] border border-white/20"></div>
                  <div className="w-10 h-10 rounded-full bg-[#006c49] border border-white/20"></div>
                  <div className="w-10 h-10 rounded-full bg-[#faf8ff] border border-outline-variant"></div>
                  <div className="w-10 h-10 rounded-full bg-[#191b23] border border-white/20"></div>
                </div>
              </div>
              <div className="card bg-surface-container-low border border-outline-variant p-8">
                <h3 className="font-bold mb-4">Typography Scaling</h3>
                <p className="text-sm text-on-surface-variant mb-6">Manrope for Headlines, Plus Jakarta Sans for Body. Premium readability.</p>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-surface-container rounded-full"></div>
                  <div className="h-4 w-3/4 bg-surface-container rounded-full"></div>
                  <div className="h-4 w-1/2 bg-surface-container rounded-full"></div>
                </div>
              </div>
            </div>
          </section>

          <section id="product-requirements">
            <h2 className="headline-sm mb-8">3. Core Product Logic</h2>
            <div className="space-y-8">
              {[
                { title: "Matching Mechanism", desc: "Our algorithm suggests swaps based on 'Double-Sided Needs'. If Participant A needs Skill X and offers Skill Y, we find Participant B who needs Skill Y and offers Skill X." },
                { title: "Tonal Depth", desc: "The UI must maintain hierarchy through 'Physical Stacking', ensuring that interactive elements like profile cards feel 'lifted' by luminance, not artificial shadows." },
                { title: "Trust Verification", desc: "Identity and Professional verification are mandatory for mentors seeking the 'Premium' badge, ensuring high-quality exchanges." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                    <p className="text-on-surface-variant leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-16 border-t border-outline-variant text-center">
            <p className="label-md mb-8">Need more detailed specifications?</p>
            <button className="btn btn-secondary gap-2">
              Download Full PRD (PDF) <FileText size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
