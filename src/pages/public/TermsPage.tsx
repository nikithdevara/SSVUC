import React from 'react';
import { FileText, AlertTriangle, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { DevotionalHeaderBadge } from '../../components/common/CulturalMotifs';

interface TermsPageProps {
  onNavigate: (route: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <DevotionalHeaderBadge />
        <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl md:text-4xl font-black text-[#7F1D1D] mt-2">
          Terms of Service & Festival Guidelines
        </h1>
        <p className="text-xs sm:text-sm text-[#292524]/75 max-w-xl mx-auto">
          Sri Siddhi Vinayaka Utsava Committee · Gandhinagar Anjayya Colony, Anakapalle
        </p>
      </div>

      <div className="bg-white border-2 border-[#C9972B]/30 rounded-3xl p-6 sm:p-10 shadow-lg space-y-8 text-xs sm:text-sm text-[#292524]/85 leading-relaxed">
        {/* Notice Box */}
        <div className="p-4 rounded-2xl bg-[#FEF3C7] border border-[#C9972B]/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
          <p className="text-xs text-[#78350F]">
            <strong>Demonstration & Testing Disclosure:</strong> This website is currently configured in demo mode for
            the upcoming Ganesh Utsav 2026. Online payments simulated during this preview generate sample verified
            receipts without real monetary debits.
          </p>
        </div>

        {/* Section 1 */}
        <div className="space-y-3">
          <h2 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> 1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using the public web portal of Sri Siddhi Vinayaka Utsava Committee, Gandhinagar Anjayya
            Colony, Anakapalle ("Committee", "we", or "us"), you agree to abide by these Terms of Service, all
            applicable laws of India, and temple ground etiquette.
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h2 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> 2. Voluntary Seva Donations (Monetary & In-Kind)
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              All monetary offerings and material supplies (rice, oil, flowers, grocery) made towards Ganesh Utsav 2026
              are voluntary religious contributions made out of personal faith.
            </li>
            <li>
              Once recorded and acknowledged with an official digital receipt, donations are deployed directly towards
              mandapam construction, Vedic poojas, electricity charges, and community Annadanam.
            </li>
            <li>
              Donations are non-refundable once the festival execution phase commences, except in case of accidental
              duplicate technical submissions.
            </li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-3">
          <h2 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> 3. Official Receipts & Verification
          </h2>
          <p>
            Official digital receipts issued through this platform are verifiable documents establishing contribution to
            the 2026 festival ledger. Devotees may print or download receipts for their family records. Any duplication or
            tampering with receipt identifiers is strictly prohibited.
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-3">
          <h2 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> 4. Program Schedule & Muhurthams
          </h2>
          <p>
            While the committee strives to conduct all daily rituals, Annadanam, and cultural programs exactly as
            scheduled, minor timing adjustments may occur due to Vedic Panchanga muhurtham timings, weather conditions,
            or directives from Anakapalle municipal/police authorities.
          </p>
        </div>

        {/* Section 5 */}
        <div className="space-y-3">
          <h2 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> 5. Mandapam Ground Protocol
          </h2>
          <p>
            All visitors to the Gandhinagar Anjayya Colony Mandapam are requested to maintain sanctity, observe orderly
            queues for darshan and Annadanam, follow eco-friendly waste disposal rules, and cooperate with youth
            volunteers and security personnel.
          </p>
        </div>

        {/* Section 6 */}
        <div className="space-y-3 pt-4 border-t border-[#C9972B]/20">
          <h2 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D]">
            6. Inquiries & Redressal
          </h2>
          <p>
            For any clarifications regarding festival rules or accounting questions, please visit our Mandapam camp
            office at Gandhinagar Anjayya Colony, Anakapalle, or reach our committee president at +91 63051 92846.
          </p>
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
