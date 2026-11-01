import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  Video, 
  MessageSquare, 
  Database, 
  UserCheck, 
  CheckCircle2, 
  ArrowLeft, 
  FileText,
  Bot
} from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 md:py-16">
      
      {/* Top Navigation / Breadcrumbs */}
      <div className="mb-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-mono text-[#A4B0C6] hover:text-[#FFEEA8] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="ui-card p-4 sm:p-10 bg-[#283144] border border-[rgba(255,255,255,0.12)] rounded-3xl mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(255,255,255,0.08)]">
          <div>
            <div className="inline-flex items-center gap-2 tag-chip mb-2">
              <ShieldCheck size={14} className="text-[#FFEEA8]" />
              <span>DATA PROTECTION & PRIVACY</span>
            </div>
            <h1 className="heading-h1 text-2xl sm:text-3xl text-[#F7F8FC]">
              SkillSwap Privacy Policy
            </h1>
          </div>
          <div className="text-left sm:text-right font-mono text-xs text-[#A4B0C6] bg-[#171D2B] p-3 rounded-xl border border-[rgba(255,255,255,0.08)]">
            <p className="text-[#FFEEA8] font-semibold">Version 1.0 (Active)</p>
            <p className="text-[11px] text-[#71809B] mt-0.5">Effective: October 2026</p>
          </div>
        </div>

        <p className="body-md text-sm text-[#A4B0C6] mt-6 leading-relaxed">
          At SkillSwap, our mission is direct peer-to-peer knowledge sharing. We believe learning works best when users can exchange expertise freely without surveillance or invasive data monetization. This policy explains what information we collect, how it is handled, and our explicit commitment to protecting your privacy.
        </p>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[rgba(255,255,255,0.08)]">
          <div className="p-4 bg-[#171D2B] rounded-xl border border-[rgba(255,255,255,0.06)] space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#2B3F74]/20 text-[#FFEEA8] flex items-center justify-center font-bold">
              <EyeOff size={16} />
            </div>
            <h3 className="text-xs font-bold text-[#F7F8FC] uppercase tracking-wide">No Ad Tracking</h3>
            <p className="text-xs text-[#A4B0C6] leading-relaxed">
              We never sell, rent, or monetize your personal information or browsing behavior with third-party advertising networks.
            </p>
          </div>

          <div className="p-4 bg-[#171D2B] rounded-xl border border-[rgba(255,255,255,0.06)] space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#FFEEA8]/20 text-[#FFEEA8] flex items-center justify-center font-bold">
              <Video size={16} />
            </div>
            <h3 className="text-xs font-bold text-[#F7F8FC] uppercase tracking-wide">Direct Video Calls</h3>
            <p className="text-xs text-[#A4B0C6] leading-relaxed">
              Live 1-on-1 audio and video calls connect directly between you and your partner. We do not record or store your calls.
            </p>
          </div>

          <div className="p-4 bg-[#171D2B] rounded-xl border border-[rgba(255,255,255,0.06)] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFA502]/20 text-[#FFA502] flex items-center justify-center font-bold">
              <Lock size={16} />
            </div>
            <h3 className="text-xs font-bold text-[#F7F8FC] uppercase tracking-wide">Encrypted & Protected</h3>
            <p className="text-xs text-[#A4B0C6] leading-relaxed">
              Passwords are strongly encrypted. Your policy acceptance timestamp is securely recorded upon registration.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-8 text-sm text-[#A4B0C6] leading-relaxed">
        
        {/* Section 1 */}
        <div className="ui-card p-6 bg-[#283144] border border-[rgba(255,255,255,0.1)] rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#171D2B] text-[#FFEEA8] border border-[rgba(255,255,255,0.08)]">
              <Database size={16} />
            </div>
            <h2 className="heading-h2 text-lg text-[#F7F8FC]">
              1. Information We Collect
            </h2>
          </div>
          <p>
            We only collect information essential to facilitating skill exchanges, community discovery, and account security:
          </p>
          <ul className="space-y-2.5 pl-2">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F7F8FC]">Profile & Account Data:</strong> Your name, email address, chosen role/title, geographic location or timezone, self-described bio, skills you offer to teach, and skills you want to learn.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F7F8FC]">Exchange Communications:</strong> Messages sent between swap partners in real-time chat so you can coordinate schedules, track shared links, and preserve conversation history.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F7F8FC]">Call Session Logs:</strong> When a 1-on-1 video call finishes, a call log entry (including participants, start time, and total session duration) is posted to your shared chat room for mutual verification and credit records.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F7F8FC]">Policy Acceptance Record:</strong> When you register an account, we record your confirmation, the exact date and time of acceptance, and the policy version.
              </div>
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="ui-card p-6 bg-[#283144] border border-[rgba(255,255,255,0.1)] rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#171D2B] text-[#FFEEA8] border border-[rgba(255,255,255,0.08)]">
              <Video size={16} />
            </div>
            <h2 className="heading-h2 text-lg text-[#F7F8FC]">
              2. Live Video & Audio Call Privacy
            </h2>
          </div>
          <p>
            SkillSwap connects live calls directly between user browsers:
          </p>
          <div className="p-4 bg-[#171D2B] border-l-2 border-[#FFEEA8] rounded-r-xl text-xs space-y-2">
            <p className="font-semibold text-[#F7F8FC]">Important Notice Regarding Live Calls:</p>
            <p>
              Your live video, screen shares, and audio streams travel <span className="text-[#FFEEA8] font-medium">directly between your device and your swap partner's device</span>. SkillSwap only helps connect the two devices at the start of the call.
            </p>
            <p className="text-[#F7F8FC] font-medium">
              We do NOT intercept, record, view, listen to, or save your live video or audio streams on our servers.
            </p>
          </div>
        </div>

        {/* Section 3 */}
        <div className="ui-card p-6 bg-[#283144] border border-[rgba(255,255,255,0.1)] rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#171D2B] text-[#FFEEA8] border border-[rgba(255,255,255,0.08)]">
              <Bot size={16} />
            </div>
            <h2 className="heading-h2 text-lg text-[#F7F8FC]">
              3. AI Study Companion (SkillBot) Interactions
            </h2>
          </div>
          <p>
            When you ask questions to our AI companion (SkillBot), your queries are processed solely to formulate direct study recommendations, learning exercises, and concept clarifications. SkillBot conversations are private to your session and are not used to train global public language models.
          </p>
        </div>

        {/* Section 4 */}
        <div className="ui-card p-6 bg-[#283144] border border-[rgba(255,255,255,0.1)] rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#171D2B] text-[#FFEEA8] border border-[rgba(255,255,255,0.08)]">
              <Lock size={16} />
            </div>
            <h2 className="heading-h2 text-lg text-[#F7F8FC]">
              4. Data Security & Storage Practices
            </h2>
          </div>
          <ul className="space-y-2.5 pl-2">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F7F8FC]">Password Security:</strong> Passwords are never saved in plain text. We utilize modern industry-standard encryption so your password is never readable by anyone.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F7F8FC]">Secure Sign-In:</strong> All account requests use secure, encrypted sign-in tokens.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F7F8FC]">No Unauthorized Sharing:</strong> We do not share, sell, or rent your personal profile information to third-party commercial vendors.
              </div>
            </li>
          </ul>
        </div>

        {/* Section 5 */}
        <div className="ui-card p-6 bg-[#283144] border border-[rgba(255,255,255,0.1)] rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#171D2B] text-[#FFEEA8] border border-[rgba(255,255,255,0.08)]">
              <UserCheck size={16} />
            </div>
            <h2 className="heading-h2 text-lg text-[#F7F8FC]">
              5. Your Rights & Data Ownership
            </h2>
          </div>
          <p>
            You retain complete control over your data on SkillSwap:
          </p>
          <ul className="space-y-2.5 pl-2">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F7F8FC]">Access & Update:</strong> You may edit your profile details, bio, skills offered, and skills needed at any time in your Profile settings.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#FFEEA8] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F7F8FC]">Account Deletion:</strong> You have the right to request deletion of your account and all associated messages and profile records from our databases.
              </div>
            </li>
          </ul>
        </div>

        {/* Section 6 */}
        <div className="ui-card p-6 bg-[#283144] border border-[rgba(255,255,255,0.1)] rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#171D2B] text-[#FFEEA8] border border-[rgba(255,255,255,0.08)]">
              <FileText size={16} />
            </div>
            <h2 className="heading-h2 text-lg text-[#F7F8FC]">
              6. Policy Modifications & Inquiries
            </h2>
          </div>
          <p>
            If we make significant updates to this policy, we will update the version number and effective date at the top of this document. Continued use of SkillSwap following changes constitutes acceptance of the revised terms.
          </p>
          <p>
            If you have questions about this Privacy Policy or your personal data, reach out directly to the SkillSwap team at <span className="font-mono text-[#FFEEA8]">privacy@skillswap.local</span>.
          </p>
        </div>

      </div>

      {/* Footer Navigation / CTA */}
      <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.1)] flex flex-wrap items-center justify-between gap-4">
        <Link 
          to="/login" 
          className="btn btn-primary text-xs py-2.5 px-5"
        >
          <span>Proceed to Account Creation</span>
        </Link>
        <Link 
          to="/marketplace" 
          className="btn btn-secondary text-xs py-2.5 px-5"
        >
          <span>Explore Skill Marketplace</span>
        </Link>
      </div>

    </div>
  );
};

export default PrivacyPolicy;
