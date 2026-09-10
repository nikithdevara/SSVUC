import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { Receipt, Donation, MaterialDonation } from '../../types';
import { SacredGaneshaEmblem, TraditionalDiya } from './CulturalMotifs';
import { Printer, Download, Share2, CheckCircle, ShieldCheck, X, MessageSquare, AlertTriangle, Clock, Trash2, XCircle } from 'lucide-react';
import { useToast } from './Toast';
import { pdfReceiptService } from '../../services/pdfReceiptService';
import { svucStore } from '../../services/store';

export interface ReceiptModalProps {
  receipt?: Receipt | null;
  donation?: Donation | null;
  material?: MaterialDonation | null;
  isOpen?: boolean;
  onClose?: () => void;
  standalone?: boolean;
  onNavigate?: (route: string) => void;
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receipt,
  donation,
  material,
  isOpen = true,
  onClose,
  standalone = false,
  onNavigate,
  onApprove,
  onDecline,
  onRemove,
}) => {
  const { showToast } = useToast();
  const settings = svucStore.getSettings();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const effectiveReceipt = useMemo<Receipt | null>(() => {
    if (receipt) {
      if (receipt.donationId) {
        const d = svucStore.getDonations().find((item) => item.id === receipt.donationId || item.receiptId === receipt.receiptNumber);
        if (d && (d.status === 'Declined' || d.status === 'Rejected')) {
          return { ...receipt, status: 'VOID', voidReason: d.rejectionReason || receipt.voidReason || 'Declined by administration' };
        }
      }
      if (receipt.materialDonationId) {
        const m = svucStore.getMaterials().find((item) => item.id === receipt.materialDonationId || item.receiptId === receipt.receiptNumber);
        if (m && (m.status === 'Declined' || m.status === 'Rejected')) {
          return { ...receipt, status: 'VOID', voidReason: receipt.voidReason || 'Declined by administration' };
        }
      }
      return receipt;
    }
    if (donation) {
      const found = svucStore.getReceiptById(donation.receiptId) || svucStore.getReceiptById(donation.id);
      if (found) {
        if (donation.status === 'Declined' || donation.status === 'Rejected') {
          return { ...found, status: 'VOID', voidReason: donation.rejectionReason || 'Declined by administration' };
        }
        return found;
      }
      const isApproved = donation.status === 'Approved' || donation.status === 'Verified';
      const isDeclined = donation.status === 'Declined' || donation.status === 'Rejected';
      return {
        id: donation.receiptId || donation.id,
        receiptNumber: donation.receiptId || `REC-2026-${donation.id}`,
        type: 'MONETARY',
        donationId: donation.id,
        donorName: donation.donorName,
        anonymous: !!donation.anonymous,
        amount: donation.amount,
        paymentMethod: donation.paymentMethod,
        date: donation.date || new Date().toISOString().split('T')[0],
        verificationCode: isApproved
          ? `SVUC-${donation.id}-VERIFIED`
          : isDeclined
          ? `SVUC-${donation.id}-DECLINED`
          : `SVUC-${donation.id}-PENDING`,
        qrCodeData: `https://siddhivinayaka-utsav.org/verify/${donation.receiptId || donation.id}`,
        committeeName: 'Sri Siddhi Vinayaka Utsava Committee',
        location: 'Gandhinagar Anjayya Colony, Anakapalle',
        issuedBy: donation.approvedBy || 'Utsav Committee',
        createdAt: donation.createdAt || new Date().toISOString(),
        status: isApproved ? 'VERIFIED' : isDeclined ? 'VOID' : 'PENDING',
        voidReason: isDeclined ? (donation.rejectionReason || 'Declined by administration') : undefined,
      };
    }
    if (material) {
      const found = svucStore.getReceiptById(material.receiptId) || svucStore.getReceiptById(material.id);
      if (found) {
        if (material.status === 'Declined' || material.status === 'Rejected') {
          return { ...found, status: 'VOID', voidReason: 'Declined by administration' };
        }
        return found;
      }
      const isApproved = material.status === 'Approved' || material.status === 'Verified';
      const isDeclined = material.status === 'Declined' || material.status === 'Rejected';
      return {
        id: material.receiptId || material.id,
        receiptNumber: material.receiptId || `REC-MAT-2026-${material.id}`,
        type: 'MATERIAL',
        materialDonationId: material.id,
        donorName: material.donorName,
        anonymous: !!material.anonymous,
        materialName: material.materialName,
        quantity: material.quantity,
        unit: material.unit,
        date: material.date || new Date().toISOString().split('T')[0],
        verificationCode: isApproved
          ? `SVUC-${material.id}-VERIFIED`
          : isDeclined
          ? `SVUC-${material.id}-DECLINED`
          : `SVUC-${material.id}-PENDING`,
        qrCodeData: `https://siddhivinayaka-utsav.org/verify/${material.receiptId || material.id}`,
        committeeName: 'Sri Siddhi Vinayaka Utsava Committee',
        location: 'Gandhinagar Anjayya Colony, Anakapalle',
        issuedBy: material.approvedBy || 'Utsav Committee',
        createdAt: material.createdAt || new Date().toISOString(),
        status: isApproved ? 'VERIFIED' : isDeclined ? 'VOID' : 'PENDING',
        voidReason: isDeclined ? 'Declined by administration' : undefined,
      };
    }
    return null;
  }, [receipt, donation, material]);

  if (isOpen === false) return null;

  if (!effectiveReceipt) {
    if (standalone) return null;
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full my-auto text-center space-y-4 border border-stone-200 shadow-xl">
            <p className="text-sm font-semibold text-stone-800">Offering receipt details could not be loaded.</p>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isDeclined =
    effectiveReceipt.status === 'VOID' ||
    effectiveReceipt.status === 'REVOKED' ||
    (donation && (donation.status === 'Declined' || donation.status === 'Rejected')) ||
    (material && (material.status === 'Declined' || material.status === 'Rejected'));
  const isVoid = isDeclined;
  const isPending =
    !isDeclined &&
    (effectiveReceipt.status === 'PENDING' ||
      (donation && donation.status === 'Pending') ||
      (material && material.status === 'Pending'));

  useEffect(() => {
    let isMounted = true;
    if (effectiveReceipt?.receiptNumber) {
      const verifyUrl = `${window.location.origin}/#/verify/${effectiveReceipt.receiptNumber}`;
      QRCode.toDataURL(verifyUrl, {
        width: 260,
        margin: 1,
        color: {
          dark: '#1C1917',
          light: '#FFFFFF',
        },
      })
        .then((url) => {
          if (isMounted) setQrDataUrl(url);
        })
        .catch((err) => {
          console.warn('QR generation error in modal:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [effectiveReceipt?.receiptNumber]);

  const handlePrint = () => {
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-receipt');
    }, 1500);
  };

  const handleDownloadPdf = async () => {
    try {
      const fileName = await pdfReceiptService.generateReceiptPdf(effectiveReceipt, settings);
      showToast(`Downloaded official PDF receipt: ${fileName}`, 'success');
    } catch (err) {
      console.error('PDF generation error', err);
      showToast('Error generating PDF receipt, switching to print dialog', 'error');
      handlePrint();
    }
  };

  const handleWhatsAppShare = () => {
    const isMaterial = effectiveReceipt.type === 'MATERIAL';
    const amountOrMaterial = isMaterial
      ? `${effectiveReceipt.quantity} ${effectiveReceipt.unit} (${effectiveReceipt.materialName})`
      : `₹${effectiveReceipt.amount?.toLocaleString('en-IN')}`;
    const verifyUrl = `${window.location.origin}/#/verify/${effectiveReceipt.receiptNumber}`;

    const text = encodeURIComponent(
      `Sri Siddhi Vinayaka Utsava Committee\n` +
      `Ganesh Utsav 2026 · Gandhinagar Anjayya Colony, Anakapalle\n\n` +
      `Thank you for your generous contribution of ${amountOrMaterial}.\n\n` +
      `Receipt Number: ${effectiveReceipt.receiptNumber}\n` +
      `Verification Code: ${effectiveReceipt.verificationCode}\n\n` +
      `Verify receipt online:\n` +
      `${verifyUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/#/verify/${effectiveReceipt.receiptNumber}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Offering Receipt - Sri Siddhi Vinayaka Utsava Committee`,
          text: `Official offering receipt ${effectiveReceipt.receiptNumber} for Ganesh Utsav 2026, Anakapalle`,
          url,
        });
        showToast('Receipt shared successfully!', 'success');
      } catch (e) {
        // cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast('Verification link copied to clipboard!', 'success');
      } catch {
        showToast('Unable to copy link', 'error');
      }
    }
  };

  const handleVerify = () => {
    if (onNavigate) {
      if (onClose) onClose();
      onNavigate(`/verify/${effectiveReceipt.receiptNumber}`);
    } else {
      window.location.hash = `/verify/${effectiveReceipt.receiptNumber}`;
    }
  };

  const receiptContent = (
    <div
      id="printable-receipt-card"
      className={`bg-[#FFFDF7] border-4 ${isVoid ? 'border-red-600' : 'border-[#C9972B]'} rounded-2xl p-6 sm:p-8 max-w-xl mx-auto shadow-2xl relative overflow-hidden text-[#292524]`}
    >
      {/* VOID Watermark overlay */}
      {isVoid && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
          <div className="text-red-600/20 font-black text-6xl sm:text-7xl font-mono uppercase rotate-[-25deg] border-8 border-red-600/20 px-8 py-2 rounded-2xl">
            VOID / CANCELLED
          </div>
        </div>
      )}

      {/* Ornamental Corner accents */}
      <div className="absolute top-2 left-2 text-[#C9972B]/50 text-xs">卐</div>
      <div className="absolute top-2 right-2 text-[#C9972B]/50 text-xs">卐</div>
      <div className="absolute bottom-2 left-2 text-[#C9972B]/50 text-xs">卐</div>
      <div className="absolute bottom-2 right-2 text-[#C9972B]/50 text-xs">卐</div>

      {/* Sacred Top Ribbon */}
      <div className="text-center pb-4 border-b-2 border-[#C9972B]/30">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#7F1D1D] mb-1 font-['Noto_Serif_Devanagari',serif]">
          <TraditionalDiya size={18} />
          <span>॥ श्री गणेशाय नमः ॥</span>
          <TraditionalDiya size={18} />
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <SacredGaneshaEmblem size={36} />
        </div>
        <h2 className="font-['Cinzel',serif] text-lg sm:text-xl font-extrabold text-[#7F1D1D]">
          Sri Siddhi Vinayaka Utsava Committee
        </h2>
        <p className="text-xs font-semibold text-[#D97706] uppercase tracking-wider">
          Ganesh Utsav 2026 · Official Digital Receipt
        </p>
        <p className="text-[11px] text-[#292524]/75">
          Gandhinagar Anjayya Colony, Anakapalle, Andhra Pradesh — 531001
        </p>
      </div>

      {/* Void Notice banner if voided */}
      {isVoid && (
        <div className="my-3 p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <div>
            <strong className="block">THIS RECEIPT IS VOID AND NO LONGER VALID</strong>
            <span className="text-[11px] text-red-700">{effectiveReceipt.voidReason || 'Cancelled by authorized committee administration.'}</span>
          </div>
        </div>
      )}

      {/* Pending Verification Notice banner */}
      {isPending && !isVoid && (
        <div className="my-3 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2.5">
          <Clock className="w-4 h-4 shrink-0 text-amber-600" />
          <div>
            <strong className="block">PROVISIONAL ACKNOWLEDGEMENT — PENDING VERIFICATION</strong>
            <span className="text-[11px] text-amber-800">
              Awaiting Super Admin or Treasurer audit sign-off. Official cryptographic verification code will be activated upon approval.
            </span>
          </div>
        </div>
      )}

      {/* Official Badge & Receipt Info */}
      <div className="my-5 bg-[#FEF3C7]/50 rounded-xl p-3 border border-[#C9972B]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <span className="text-[#292524]/60 block text-[10px] uppercase font-bold">Receipt Number</span>
          <span className="font-mono font-bold text-sm text-[#7F1D1D]">{effectiveReceipt.receiptNumber}</span>
        </div>
        <div>
          <span className="text-[#292524]/60 block text-[10px] uppercase font-bold">Date Issued</span>
          <span className="font-semibold text-xs">{effectiveReceipt.date}</span>
        </div>
        <div>
          <span className="text-[#292524]/60 block text-[10px] uppercase font-bold">Status</span>
          {isVoid ? (
            <span className="inline-flex items-center gap-1 font-bold text-xs text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              Declined / Void
            </span>
          ) : isPending ? (
            <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
              <Clock className="w-3.5 h-3.5" />
              Pending Audit
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-bold text-xs text-[#166534]">
              <CheckCircle className="w-3.5 h-3.5" />
              Verified / Received
            </span>
          )}
        </div>
      </div>

      {/* Main Details Table */}
      <div className="space-y-3 text-xs border-b-2 border-[#C9972B]/30 pb-5">
        <div className="flex justify-between items-center py-1.5 border-b border-[#C9972B]/15">
          <span className="text-[#292524]/70 font-medium">Donor Name:</span>
          <span className="font-bold text-sm text-[#292524]">
            {effectiveReceipt.anonymous ? 'Devotee (Anonymous Seva)' : effectiveReceipt.donorName}
          </span>
        </div>

        {effectiveReceipt.type === 'MONETARY' ? (
          <>
            <div className="flex justify-between items-center py-1.5 border-b border-[#C9972B]/15">
              <span className="text-[#292524]/70 font-medium">Contribution Amount:</span>
              <span className="font-extrabold text-base sm:text-lg text-[#166534]">
                ₹{effectiveReceipt.amount?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[#C9972B]/15">
              <span className="text-[#292524]/70 font-medium">Payment Mode:</span>
              <span className="font-semibold px-2 py-0.5 rounded bg-[#D97706]/10 text-[#78350F]">
                {effectiveReceipt.paymentMethod || 'UPI'}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center py-1.5 border-b border-[#C9972B]/15">
              <span className="text-[#292524]/70 font-medium">Material Contributed:</span>
              <span className="font-bold text-sm text-[#D97706]">{effectiveReceipt.materialName}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[#C9972B]/15">
              <span className="text-[#292524]/70 font-medium">Quantity / Measure:</span>
              <span className="font-bold text-sm text-[#292524]">
                {effectiveReceipt.quantity} {effectiveReceipt.unit}
              </span>
            </div>
          </>
        )}

        <div className="flex justify-between items-center py-1.5">
          <span className="text-[#292524]/70 font-medium">Issued / Registered By:</span>
          <span className="font-semibold text-[#292524]">
            {(!effectiveReceipt.issuedBy || /satyam|treasurer|portal/i.test(effectiveReceipt.issuedBy))
              ? 'Utsav Committee'
              : effectiveReceipt.issuedBy}
          </span>
        </div>
      </div>

      {/* QR Code & Tamper Verification */}
      <div className="pt-4 flex items-center justify-between gap-4">
        {/* Verification Text */}
        <div className="space-y-1 text-left flex-1">
          {isPending ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pending Super Admin / Treasurer Audit</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#166534]">
              <ShieldCheck className="w-4 h-4 text-[#166534]" />
              <span>Cryptographically Verified Record</span>
            </div>
          )}
          <p className="text-[10px] text-[#292524]/65 leading-tight font-mono">
            Auth ID: {effectiveReceipt.verificationCode}
          </p>
          <p className="text-[10px] text-[#292524]/60">
            {isPending
              ? 'Provisional receipt registered. Official QR verification active upon committee approval.'
              : 'Scan QR code or click Verify Receipt to check authenticity.'}
          </p>
        </div>

        {/* Digital QR Code Display */}
        <div className="p-2 bg-white border-2 border-[#C9972B] rounded-xl shadow-xs shrink-0 text-center">
          <img
            src={qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(effectiveReceipt.qrCodeData)}`}
            alt="Receipt Verification QR"
            className="w-18 h-18 sm:w-20 sm:h-20"
          />
          <span className="text-[8px] font-bold text-[#78350F] uppercase tracking-wider block mt-0.5">
            VERIFY
          </span>
        </div>
      </div>

      {/* Blessing Inscription */}
      <div className="mt-5 pt-3 border-t border-[#C9972B]/30 text-center text-[11px] text-[#78350F] italic">
        "May Lord Sri Siddhi Vinayaka bestow health, wisdom, prosperity, and peace upon your family."
      </div>
    </div>
  );

  const actionButtons = (
    <div className="flex flex-wrap items-center justify-center gap-2.5 no-print">
      {isPending && onApprove && (
        <button
          onClick={() => {
            const targetId =
              material?.id ||
              donation?.id ||
              effectiveReceipt.materialDonationId ||
              effectiveReceipt.donationId ||
              effectiveReceipt.receiptNumber;
            onApprove(targetId);
            showToast('Offering accepted & official receipt approved!', 'success');
          }}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 shadow-md flex items-center gap-2 cursor-pointer transition-all"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Accept</span>
        </button>
      )}
      {isPending && onDecline && (
        <button
          onClick={() => {
            const targetId =
              material?.id ||
              donation?.id ||
              effectiveReceipt.materialDonationId ||
              effectiveReceipt.donationId ||
              effectiveReceipt.receiptNumber;
            onDecline(targetId);
            showToast('Offering declined', 'info');
          }}
          className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs hover:bg-rose-700 shadow-md flex items-center gap-2 cursor-pointer transition-all"
        >
          <XCircle className="w-4 h-4" />
          <span>Decline</span>
        </button>
      )}
      {onRemove && (
        <button
          onClick={() => {
            const targetId =
              material?.id ||
              donation?.id ||
              effectiveReceipt.materialDonationId ||
              effectiveReceipt.donationId ||
              effectiveReceipt.receiptNumber;
            onRemove(targetId);
            showToast('Record removed from ledger', 'info');
          }}
          className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold text-xs hover:bg-red-100 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
          <span>Remove</span>
        </button>
      )}
      <button
        onClick={handlePrint}
        className="px-4 py-2.5 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs hover:bg-[#991B1B] shadow-md flex items-center gap-1.5 cursor-pointer"
      >
        <Printer className="w-4 h-4" />
        <span>Print Receipt</span>
      </button>
      <button
        onClick={handleDownloadPdf}
        className="px-4 py-2.5 rounded-xl bg-[#166534] text-white font-bold text-xs hover:bg-[#15803d] shadow-md flex items-center gap-1.5 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>Download PDF</span>
      </button>
      <button
        onClick={handleWhatsAppShare}
        className="px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:bg-[#20bd5a] shadow-xs flex items-center gap-1.5 cursor-pointer"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Share via WhatsApp</span>
      </button>
      <button
        onClick={handleShare}
        className="px-4 py-2.5 rounded-xl bg-white border border-[#C9972B] text-[#78350F] font-bold text-xs hover:bg-[#FEF3C7] shadow-xs flex items-center gap-1.5 cursor-pointer"
      >
        <Share2 className="w-4 h-4" />
        <span>Share Link</span>
      </button>
      <button
        onClick={handleVerify}
        className="px-4 py-2.5 rounded-xl bg-[#FEF3C7] border border-[#C9972B] text-[#78350F] font-bold text-xs hover:bg-[#FDE68A] shadow-xs flex items-center gap-1.5 cursor-pointer"
      >
        <ShieldCheck className="w-4 h-4 text-[#166534]" />
        <span>Verify Receipt</span>
      </button>
      {onClose && (
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-[#292524] text-white font-medium text-xs hover:bg-[#44403C] cursor-pointer"
        >
          Close
        </button>
      )}
    </div>
  );

  if (standalone) {
    return (
      <div className="space-y-6">
        {receiptContent}
        {actionButtons}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs receipt-modal-backdrop">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="receipt-modal-container relative w-full max-w-xl my-auto py-4">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-1 right-1 sm:-top-2 sm:-right-2 z-10 p-2 bg-[#7F1D1D] text-white rounded-full hover:bg-[#991B1B] shadow-lg no-print cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {receiptContent}
          <div className="mt-4">{actionButtons}</div>
        </div>
      </div>
    </div>
  );
};
