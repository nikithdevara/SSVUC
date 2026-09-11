import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft, Heart } from 'lucide-react';
import { DevotionalHeaderBadge } from '../../components/common/CulturalMotifs';

interface PrivacyPageProps {
  onNavigate: (route: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <DevotionalHeaderBadge />
        <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl md:text-4xl font-black text-[#7F1D1D] mt-2">
          Privacy Policy & Public Transparency Statement
        </h1>
        <p className="text-xs sm:text-sm text-[#292524]/75 max-w-xl mx-auto">
          Sri Siddhi Vinayaka Utsava Committee · Gandhinagar Anjayya Colony, Anakapalle
        </p>
      </div>

      <div className="bg-white border-2 border-[#C9972B]/30 rounded-3xl p-6 sm:p-10 shadow-lg space-y-8 text-xs sm:text-sm text-[#292524]/85 leading-relaxed">
        <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#166534] shrink-0 mt-0.5" />
          <p className="text-xs text-[#78350F]">
            <strong>Last Updated: September 2026</strong> — This policy explains how we balance complete public
            financial accountability with the personal privacy of our devotees and donors.
          </p>
        </div>

        {/* Section 1 */}
        <div className="space-y-3">
          <h2 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> 1. Public Financial Transparency Principles
          </h2>
          <p>
            The Sri Siddhi Vinayaka Utsava Committee operates on a 100% open-book philosophy. In accordance with this
            principle, all approved monetary donations and material contributions are logged in our public digital
            ledger to maintain community trust and prevent financial irregularities.
          </p>
          <p>
            The public registry displays the contribution date, contribution amount or material quantity, payment mode,
            and verification receipt number.
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h2 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> 2. Protection of Donor Personal Information
          </h2>
          <p>
            We strictly protect the personal privacy and contact details of our devotees:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong>Anonymous Donations:</strong> Devotees can choose the "Anonymous Seva" toggle during donation.
              Their names will be displayed publicly as <em>"Anonymous Devotee"</em>.
            </li>
            <li>
              <strong>Phone Numbers & Email Addresses:</strong> Contact numbers and email addresses collected during
              donation or receipt generation are <strong>never</strong> displayed on public pages, tables, or export
              spreadsheets.
            </li>
            <li>
              <strong>No Marketing or Commercial Sale:</strong> We do not sell, rent, or trade your contact information
              with third-party advertisers or external organizations under any circumstances.
            </li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-3">
          <h2 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> 3. Digital Receipts & Verification
          </h2>
          <p>
            Every transaction generates an official receipt with a unique identifier (e.g., <code>REC-2026-001</code>).
            Anyone with the exact receipt number can verify its authenticity using our Verification tool. Verification
            reveals only the name (or Anonymous designation), date, amount, and purpose to prevent duplicate or
            fraudulent claims.
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-3">
          <h2 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> 4. Contact Form Inquiries
          </h2>
          <p>
            Information submitted through our contact form (such as pooja sankalpam requests, annadanam seva inquiries,
            or volunteer registrations) is forwarded directly to the committee office bearers and used exclusively to
            coordinate festival services.
          </p>
        </div>

        {/* Section 5 */}
        <div className="space-y-3">
          <h2 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> 5. Data Security & Integrity
          </h2>
          <p>
            All records are preserved with audit log entries documenting any creations or updates. Access to administrative
            functions is strictly role-restricted to authorized committee members (President, Secretary, Treasurer).
          </p>
        </div>

        {/* Section 6 */}
        <div className="space-y-3 pt-4 border-t border-[#C9972B]/20">
          <h2 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D]">
            6. Contacting the Committee
          </h2>
          <p>
            If you have any questions regarding your donation listing, wish to anonymize a prior contribution, or request
            a corrected receipt, please contact:
          </p>
          <div className="p-4 rounded-xl bg-[#FFF9ED] border border-[#C9972B]/20 text-xs font-mono space-y-1 text-[#292524]">
            <div>Sri Siddhi Vinayaka Utsava Committee</div>
            <div>Gandhinagar Anjayya Colony, Anakapalle - 531001, Andhra Pradesh</div>
            <div>Email: contact@siddhivinayaka-utsav.org | Phone: +91 63051 92846</div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => onNavigate('/')}
          className="px-6 py-2.5 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs hover:bg-[#991B1B] flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Utsav Home</span>
        </button>
      </div>
    </div>
  );
};
