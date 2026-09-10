import React from 'react';
import { Expense } from '../../types';
import { X, CheckCircle, Shield, FileText, Calendar, Building } from 'lucide-react';

interface BillModalProps {
  expense: Expense;
  onClose: () => void;
  isOpen?: boolean;
}

export const BillModal: React.FC<BillModalProps> = ({ expense, onClose, isOpen = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="relative w-full max-w-lg my-auto bg-[#FFF9ED] border-2 border-[#C9972B] rounded-2xl shadow-2xl p-6 overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-[#7F1D1D] text-white hover:bg-[#991B1B] shadow-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#C9972B]/30">
            <div className="w-10 h-10 rounded-xl bg-[#D97706]/20 border border-[#D97706] flex items-center justify-center text-[#7F1D1D]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706]">
                Verified Expense Voucher
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#7F1D1D]">{expense.receiptVoucherNo}</h3>
            </div>
          </div>

          {/* Details breakdown */}
          <div className="space-y-3 text-xs mb-4">
            <div className="p-3 rounded-xl bg-white border border-[#C9972B]/30 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#292524]/60">Expense Title</span>
                  <p className="text-sm font-bold text-[#292524]">{expense.expenseName}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#7F1D1D]/10 text-[#7F1D1D]">
                  {expense.category}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#C9972B]/15">
                <span className="text-[11px] font-medium text-[#292524]/70 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-[#D97706]" /> Vendor / Beneficiary:
                </span>
                <span className="font-semibold text-[#292524]">{expense.vendorName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium text-[#292524]/70 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#D97706]" /> Expense Date:
                </span>
                <span className="font-semibold text-[#292524]">{expense.date}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#C9972B]/15">
                <span className="text-xs font-bold text-[#292524]">Approved Amount:</span>
                <span className="text-base font-extrabold text-[#7F1D1D]">
                  ₹{expense.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FEF3C7]/60 border border-[#C9972B]/30 text-[#78350F] text-[11px]">
              <strong>Audited Description:</strong> {expense.description || 'No additional remarks provided.'}
            </div>
          </div>

          {/* Conditional Bill Image Rendering */}
          {expense.billUrl ? (
            <div className="mb-4">
              <span className="text-[11px] font-bold text-[#292524]/80 mb-1.5 flex items-center justify-between">
                <span>Official Invoice / Bill Copy</span>
                <span className="text-[10px] text-[#166534] font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Digitally Verified
                </span>
              </span>
              <div className="rounded-xl overflow-hidden border border-[#C9972B]/40 max-h-56 bg-white relative">
                <img
                  src={expense.billUrl}
                  alt={expense.expenseName}
                  className="w-full h-48 object-cover hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md">
                  Watermarked · Committee Records
                </div>
              </div>
            </div>
          ) : null}

          {/* Audit info */}
          <div className="flex items-center justify-between text-[11px] text-[#292524]/70 pt-2 border-t border-[#C9972B]/30">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#166534]" /> Authorized by: {expense.createdBy || 'Committee Treasurer'}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#7F1D1D] text-white text-xs font-semibold hover:bg-[#991B1B] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
