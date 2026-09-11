import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Users,
  Search,
  CheckCircle,
  ShieldCheck,
  Plus,
  Receipt as ReceiptIcon,
  ChevronRight,
  Heart,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  FileText,
  Check,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Flame,
  Share2,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { svucStore, deduplicateMaterials } from '../../services/store';
import { MaterialDonation, MaterialCategory, Receipt } from '../../types';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { DevotionalHeaderBadge, TraditionalDiya } from '../../components/common/CulturalMotifs';
import { useToast } from '../../components/common/Toast';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { COLLECTIONS } from '../../services/firebase/firestoreService';
import { materialsFirebaseService } from '../../services/firebase/materialsFirebaseService';

interface MaterialsPageProps {
  onNavigate: (route: string) => void;
}

const MATERIAL_CATEGORIES: MaterialCategory[] = [
  'Food Supplies',
  'Flowers & Garlands',
  'Pooja Materials',
  'Decoration Material',
  'Electrical Items',
  'Cleaning Materials',
  'Utensils & Furniture',
  'Other',
];

export const MaterialsPage: React.FC<MaterialsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'OFFER' | 'REGISTER'>('OFFER');

  // Multi-step offering workflow states: 1 = Form, 2 = Review, 3 = Verifying/Ledger, 4 = Verified Receipt
  const [step, setStep] = useState<number>(1);

  // Form State - Custom Material Item
  const [materialName, setMaterialName] = useState<string>('');
  const [category, setCategory] = useState<MaterialCategory>('Food Supplies');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('kg');
  const [donorName, setDonorName] = useState<string>('');
  const [anonymous, setAnonymous] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [gothram, setGothram] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<string>('Direct Handover at Mandapam Counter');
  const [handoverDate, setHandoverDate] = useState<string>('2026-09-15');
  const [notes, setNotes] = useState<string>('');

  // Post-submission verification results
  const [createdMaterial, setCreatedMaterial] = useState<MaterialDonation | null>(null);
  const [generatedReceipt, setGeneratedReceipt] = useState<Receipt | null>(null);
  const [selectedReceiptForModal, setSelectedReceiptForModal] = useState<Receipt | null>(null);

  // Registry List state
  const [materials, setMaterials] = useState<MaterialDonation[]>(svucStore.getMaterials());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'DECLINED'>('ALL');

  const refreshMaterials = () => {
    setMaterials(svucStore.getMaterials());
  };

  useEffect(() => {
    // 1. Initial local load
    setMaterials(svucStore.getMaterials());

    // 2. Real-time Cloud Firestore live listener
    let unsubscribe: (() => void) | undefined;
    if (isFirebaseConfigured() && db) {
        unsubscribe = onSnapshot(
          collection(db, COLLECTIONS.MATERIALS),
          (snapshot) => {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MaterialDonation));
            const deduped = deduplicateMaterials(list);
            setMaterials(deduped);
          },
          (err) => console.warn('[Live Materials Firestore Stream]', err)
        );
    }

    const handleStoreUpdate = () => refreshMaterials();
    window.addEventListener('svuc_store_updated', handleStoreUpdate);
    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('svuc_store_updated', handleStoreUpdate);
    };
  }, []);

  const activeMaterials = useMemo(() => {
    return materials.filter((m) => m.status !== 'Declined' && m.status !== 'Rejected');
  }, [materials]);

  const declinedCount = useMemo(() => {
    return materials.filter((m) => m.status === 'Declined' || m.status === 'Rejected').length;
  }, [materials]);

  const pendingCount = useMemo(() => {
    return materials.filter((m) => m.status === 'Pending').length;
  }, [materials]);

  const verifiedCount = useMemo(() => {
    return materials.filter((m) => m.status === 'Approved' || m.status === 'Verified').length;
  }, [materials]);

  const totalQuantity = activeMaterials.reduce((sum, m) => sum + m.quantity, 0);
  const uniqueItems = new Set(activeMaterials.map((m) => m.materialName.toLowerCase())).size;
  const totalContributors = activeMaterials.length;

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim()) {
      showToast('Please enter the sacred material or provision name.', 'error');
      return;
    }
    if (quantity <= 0) {
      showToast('Please specify a valid quantity for this contribution.', 'error');
      return;
    }
    if (!anonymous && !donorName.trim()) {
      showToast('Please enter your name or check the Anonymous Devotee option.', 'error');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmAndRegister = () => {
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Simulate submission to committee ledger for review
    setTimeout(() => {
      const { material, receipt } = svucStore.addMaterial({
        donorName: anonymous ? 'Devotee (Anonymous)' : donorName.trim() || 'Devotee',
        anonymous,
        materialName: materialName.trim(),
        category,
        quantity,
        unit: unit.trim() || 'Units',
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        gothram: gothram.trim(),
        deliveryMethod,
        date: handoverDate || new Date().toISOString().split('T')[0],
        notes: notes.trim(),
        status: 'Pending', // Strictly pending for admin / treasurer review
      });

      // Sync to Firebase Cloud Firestore directly
      materialsFirebaseService
        .createMaterial({
          donorName: anonymous ? 'Devotee (Anonymous)' : donorName.trim() || 'Devotee',
          anonymous,
          materialName: materialName.trim(),
          category,
          quantity,
          unit: unit.trim() || 'Units',
          phoneNumber: phoneNumber.trim(),
          email: email.trim(),
          gothram: gothram.trim(),
          deliveryMethod,
          date: handoverDate || new Date().toISOString().split('T')[0],
          notes: notes.trim(),
          status: 'Pending',
        })
        .catch((err) => console.warn('[Firestore Material Sync Error]', err));

      setCreatedMaterial(material);
      setGeneratedReceipt(receipt);
      refreshMaterials();
      setStep(4);

      showToast('Material offering submitted for review! Pending Admin / Treasurer approval.', 'info');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  const handleResetForm = () => {
    setStep(1);
    setMaterialName('');
    setCategory('Food Supplies');
    setQuantity(1);
    setUnit('kg');
    setDonorName('');
    setAnonymous(false);
    setPhoneNumber('');
    setEmail('');
    setGothram('');
    setNotes('');
    setCreatedMaterial(null);
    setGeneratedReceipt(null);
  };

  const handleOpenReceipt = (receiptId: string) => {
    const rec = svucStore.getReceiptById(receiptId);
    if (rec) {
      setSelectedReceiptForModal(rec);
    } else {
      onNavigate(`/receipt/${receiptId}`);
    }
  };

  const handleDirectVerify = (receiptId: string) => {
    onNavigate(`/verify/${receiptId}`);
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.donorName.toLowerCase().includes(q) ||
        m.materialName.toLowerCase().includes(q) ||
        m.receiptId.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;

      const isAppr = m.status === 'Approved' || m.status === 'Verified';
      const isDeclined = m.status === 'Declined' || m.status === 'Rejected';
      const isPending = m.status === 'Pending';

      const matchesStatus =
        statusFilter === 'ALL'
          ? !isDeclined || (!!q && (m.receiptId.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)))
          : statusFilter === 'VERIFIED'
          ? isAppr
          : statusFilter === 'PENDING'
          ? isPending
          : isDeclined;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [materials, searchQuery, selectedCategory, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C9972B]/30 pb-6">
        <div>
          <DevotionalHeaderBadge />
          <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl md:text-4xl font-black text-[#7F1D1D] mt-2">
            Material Contributions & Seva
          </h1>
          <p className="text-xs sm:text-sm text-[#292524]/75 max-w-2xl mt-1">
            Devotees can offer sacred festival provisions — such as Annadanam rice, pure cow ghee, marigold garlands, and camphor. All submissions are recorded as pending offerings and officially verified and approved by an Admin or Treasurer upon physical handover at the Mandapam counter.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-2xl bg-[#FFF9ED] border-2 border-[#C9972B]/40 p-1 self-start md:self-center shadow-xs">
          <button
            onClick={() => setActiveTab('OFFER')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'OFFER'
                ? 'bg-[#7F1D1D] text-white shadow-md'
                : 'text-[#78350F] hover:bg-[#FEF3C7]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Offer Material Seva</span>
          </button>
          <button
            onClick={() => setActiveTab('REGISTER')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'REGISTER'
                ? 'bg-[#7F1D1D] text-white shadow-md'
                : 'text-[#78350F] hover:bg-[#FEF3C7]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Public Seva Register ({materials.length})</span>
          </button>
        </div>
      </div>

      {/* Top 3 Transparency Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#D97706]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Seva Items</span>
            <Package className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#D97706]">{totalQuantity.toLocaleString()} Units</div>
          <p className="text-xs text-[#292524]/60">Ghee, rice, flowers & items registered</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#166534]">
            <span className="text-xs font-bold uppercase tracking-wider">Unique Categories</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#166534]">{uniqueItems} Sacred Categories</div>
          <p className="text-xs text-[#292524]/60">Provisions categorized for Ganesh Utsav</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#7F1D1D]">
            <span className="text-xs font-bold uppercase tracking-wider">Devotees Contributing</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#7F1D1D]">{totalContributors} Devotees</div>
          <p className="text-xs text-[#292524]/60">Physical material seva records</p>
        </div>
      </div>

      {/* VIEW 1: OFFER MATERIAL SEVA WIZARD */}
      {activeTab === 'OFFER' && (
        <div className="space-y-6">
          {/* Progress Stepper */}
          <div className="bg-[#FFFDF7] border-2 border-[#C9972B]/40 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {[
                { stepNum: 1, label: 'Seva Details' },
                { stepNum: 2, label: 'Review Offering' },
                { stepNum: 3, label: 'Submission' },
                { stepNum: 4, label: 'Pending Review' },
              ].map((s, idx, arr) => (
                <div key={s.stepNum} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        step === s.stepNum
                          ? 'bg-[#7F1D1D] text-white ring-4 ring-[#C9972B]/30'
                          : step > s.stepNum
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {step > s.stepNum ? <Check className="w-4 h-4" /> : s.stepNum}
                    </div>
                    <span className="text-[11px] font-bold text-stone-700 mt-1 hidden sm:block">
                      {s.label}
                    </span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-all ${
                        step > s.stepNum ? 'bg-emerald-600' : 'bg-stone-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: Custom Material Seva Details */}
          {step === 1 && (
            <div className="bg-[#FFFDF7] border-2 border-[#C9972B]/40 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
              {/* Form Header */}
              <div className="border-b border-[#C9972B]/30 pb-4">
                <h3 className="font-['Cinzel',serif] text-lg sm:text-xl font-black text-[#7F1D1D] flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#D97706]" />
                  <span>Enter Custom Material Seva Details</span>
                </h3>
                <p className="text-xs text-[#292524]/75 mt-1">
                  Specify the sacred provisions or items you wish to contribute for Ganesh Utsav 2026.
                </p>
              </div>

              {/* Offering Form */}
              <form onSubmit={handleProceedToReview} className="space-y-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#7F1D1D] mb-1.5">
                      Material / Seva Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter material or seva item name (e.g. Rice, Ghee, Flowers)"
                      value={materialName}
                      onChange={(e) => setMaterialName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#C9972B]/40 bg-white text-xs sm:text-sm font-semibold text-[#292524] outline-none focus:border-[#7F1D1D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#7F1D1D] mb-1.5">
                      Material Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                      className="w-full p-3 rounded-xl border border-[#C9972B]/40 bg-white text-xs sm:text-sm font-semibold text-[#292524] outline-none focus:border-[#7F1D1D]"
                    >
                      {MATERIAL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#7F1D1D] mb-1.5">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                      className="w-full p-3 rounded-xl border border-[#C9972B]/40 bg-white text-xs sm:text-sm font-bold text-[#166534] outline-none focus:border-[#7F1D1D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#7F1D1D] mb-1.5">
                      Unit of Measure <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter unit of measure (e.g. kg, Litres, Bags, Tins)"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#C9972B]/40 bg-white text-xs sm:text-sm font-semibold text-[#292524] outline-none focus:border-[#7F1D1D]"
                    />
                  </div>
                </div>

                {/* Devotee Info */}
                <div className="pt-4 border-t border-[#C9972B]/20 space-y-4">
                  <h4 className="text-sm font-bold text-[#7F1D1D] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#D97706]" />
                    <span>Devotee & Sankalpam Information</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#292524] mb-1">
                        Devotee / Family Name {!anonymous && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        disabled={anonymous}
                        required={!anonymous}
                        placeholder={anonymous ? 'Offering Anonymously' : 'Enter devotee / family full name'}
                        value={anonymous ? '' : donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className={`w-full p-3 rounded-xl border border-[#C9972B]/40 bg-white text-xs sm:text-sm text-[#292524] outline-none focus:border-[#7F1D1D] ${
                          anonymous ? 'opacity-50 cursor-not-allowed bg-stone-100' : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#292524] mb-1">
                        Gothram (Optional for Sankalpam)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your gothram (if applicable)"
                        value={gothram}
                        onChange={(e) => setGothram(e.target.value)}
                        className="w-full p-3 rounded-xl border border-[#C9972B]/40 bg-white text-xs sm:text-sm text-[#292524] outline-none focus:border-[#7F1D1D]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="anonToggle"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded text-[#7F1D1D] focus:ring-[#7F1D1D]"
                    />
                    <label htmlFor="anonToggle" className="text-xs font-medium text-[#292524] cursor-pointer">
                      Offer anonymously (Your name will be kept confidential on public displays)
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#292524] mb-1">
                        Contact Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="Enter your 10-digit mobile number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full p-3 rounded-xl border border-[#C9972B]/40 bg-white text-xs sm:text-sm text-[#292524] outline-none focus:border-[#7F1D1D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#292524] mb-1">
                        Email Address (For Digital Receipt copy)
                      </label>
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 rounded-xl border border-[#C9972B]/40 bg-white text-xs sm:text-sm text-[#292524] outline-none focus:border-[#7F1D1D]"
                      />
                    </div>
                  </div>

                  {/* Delivery / Handover info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#292524] mb-1">
                        Handover / Delivery Method
                      </label>
                      <select
                        value={deliveryMethod}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className="w-full p-3 rounded-xl border border-[#C9972B]/40 bg-white text-xs sm:text-sm text-[#292524] outline-none focus:border-[#7F1D1D]"
                      >
                        <option value="Direct Handover at Mandapam Counter">
                          Direct Handover at Mandapam Counter
                        </option>
                        <option value="Committee Volunteer Collection">
                          Request Volunteer Collection (Local Anakapalle)
                        </option>
                        <option value="Direct Delivery via Merchant">
                          Direct Delivery via Merchant / Store
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#292524] mb-1">
                        Preferred Handover Date
                      </label>
                      <input
                        type="date"
                        value={handoverDate}
                        onChange={(e) => setHandoverDate(e.target.value)}
                        className="w-full p-3 rounded-xl border border-[#C9972B]/40 bg-white text-xs sm:text-sm text-[#292524] outline-none focus:border-[#7F1D1D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#292524] mb-1">
                      Sacred Sankalpam / Dedication Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Enter your devotional prayer, sankalpam, or seva dedication notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#C9972B]/40 bg-white text-xs sm:text-sm text-[#292524] outline-none focus:border-[#7F1D1D]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#C9972B]/30">
                  <div className="text-xs text-[#292524]/60">
                    Sri Siddhi Vinayaka Utsava Committee · Gandhinagar Anjayya Colony, Anakapalle
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Review Offering</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: Review Offering */}
          {step === 2 && (
            <div className="bg-[#FFFDF7] border-2 border-[#C9972B]/40 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 max-w-2xl mx-auto">
              <div className="border-b border-[#C9972B]/30 pb-4 text-center">
                <div className="inline-flex p-3 rounded-2xl bg-[#FEF3C7] text-[#7F1D1D] mb-2">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="font-['Cinzel',serif] text-xl sm:text-2xl font-black text-[#7F1D1D]">
                  Review Material Seva Offering
                </h3>
                <p className="text-xs text-[#292524]/75 mt-1">
                  Please verify the seva provisions before registering with the committee inventory ledger.
                </p>
              </div>

              {/* Review Card */}
              <div className="bg-[#FFF9ED] border-2 border-[#C9972B]/40 rounded-2xl p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-[#C9972B]/20 pb-3">
                  <span className="text-[#292524]/70 uppercase font-bold text-[10px]">Material Seva Item</span>
                  <span className="font-extrabold text-sm text-[#7F1D1D]">{materialName}</span>
                </div>

                <div className="flex items-center justify-between border-b border-[#C9972B]/20 pb-3">
                  <span className="text-[#292524]/70 uppercase font-bold text-[10px]">Quantity</span>
                  <span className="font-black text-base text-[#166534]">
                    {quantity} {unit}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#C9972B]/20 pb-3">
                  <span className="text-[#292524]/70 uppercase font-bold text-[10px]">Category</span>
                  <span className="font-semibold text-xs text-[#78350F] bg-[#D97706]/15 px-2.5 py-0.5 rounded-full">
                    {category}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#C9972B]/20 pb-3">
                  <span className="text-[#292524]/70 uppercase font-bold text-[10px]">Devotee Name</span>
                  <span className="font-bold text-xs text-[#292524]">
                    {anonymous ? 'Anonymous Devotee' : donorName || 'Devotee'}
                  </span>
                </div>

                {gothram && (
                  <div className="flex items-center justify-between border-b border-[#C9972B]/20 pb-3">
                    <span className="text-[#292524]/70 uppercase font-bold text-[10px]">Gothram</span>
                    <span className="font-semibold text-xs text-[#292524]">{gothram}</span>
                  </div>
                )}

                {phoneNumber && (
                  <div className="flex items-center justify-between border-b border-[#C9972B]/20 pb-3">
                    <span className="text-[#292524]/70 uppercase font-bold text-[10px]">Contact Phone</span>
                    <span className="font-mono text-xs text-[#292524]">{phoneNumber}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-[#C9972B]/20 pb-3">
                  <span className="text-[#292524]/70 uppercase font-bold text-[10px]">Handover Plan</span>
                  <span className="font-semibold text-xs text-[#292524]">{deliveryMethod} ({handoverDate})</span>
                </div>

                {notes && (
                  <div className="pt-1">
                    <span className="text-[#292524]/70 uppercase font-bold text-[10px] block mb-1">
                      Sankalpam / Remarks
                    </span>
                    <p className="text-xs text-[#292524]/80 italic bg-white/70 p-2.5 rounded-lg border border-[#C9972B]/20">
                      "{notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Devotional Note */}
              <div className="p-4 rounded-xl bg-[#FEF3C7]/60 border border-[#C9972B]/30 flex items-center gap-3 text-xs text-[#78350F]">
                <TraditionalDiya size={26} className="shrink-0" />
                <p className="leading-relaxed">
                  Upon submission, this material offering pledge will be recorded as <strong>Pending Review</strong> in the festival inventory ledger. An Admin or Treasurer will inspect and officially approve the offering upon physical handover at the Mandapam counter.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={handleConfirmAndRegister}
                  className="px-6 py-3 rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>Submit Offering for Review</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Submission in Progress */}
          {step === 3 && (
            <div className="bg-[#FFFDF7] border-2 border-[#C9972B]/40 rounded-3xl p-10 sm:p-14 shadow-xl text-center space-y-6 max-w-lg mx-auto">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full border-4 border-[#C9972B]/30 border-t-[#7F1D1D] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-[#7F1D1D]">
                  <Clock className="w-8 h-8 animate-pulse text-[#D97706]" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-['Cinzel',serif] text-xl font-bold text-[#7F1D1D]">
                  Submitting Offering for Review...
                </h3>
                <p className="text-xs text-[#292524]/70 max-w-xs mx-auto">
                  Recording sacred seva pledge in committee register. Awaiting Admin or Treasurer verification upon Mandapam handover.
                </p>
              </div>

              <div className="space-y-2 text-left max-w-xs mx-auto text-xs text-stone-600 bg-[#FFF9ED] p-3 rounded-xl border border-[#C9972B]/20">
                <div className="flex items-center gap-2 text-amber-800 font-semibold">
                  <Check className="w-3.5 h-3.5 text-amber-600" />
                  <span>Material seva details logged</span>
                </div>
                <div className="flex items-center gap-2 text-amber-800 font-semibold">
                  <Check className="w-3.5 h-3.5 text-amber-600" />
                  <span>Provisional receipt ID generated</span>
                </div>
                <div className="flex items-center gap-2 text-[#7F1D1D] font-bold animate-pulse">
                  <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Queued for Admin / Treasurer approval...</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Submitted for Review (Pending State) */}
          {step === 4 && generatedReceipt && createdMaterial && (
            <div className="bg-[#FFFDF7] border-3 border-amber-500/70 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 max-w-2xl mx-auto">
              {/* Header Badge */}
              <div className="text-center space-y-2 border-b border-amber-500/20 pb-6">
                <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-800 shadow-sm">
                  <Clock className="w-9 h-9 text-amber-700" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Pending Committee Review & Handover</span>
                </div>
                <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-black text-[#7F1D1D]">
                  Offering Submitted for Review!
                </h2>
                <p className="text-xs sm:text-sm text-[#292524]/80 max-w-md mx-auto">
                  Your material offering has been recorded in the committee register. An <strong>Admin or Treasurer</strong> will verify and officially approve the offering upon physical inspection and handover at the Mandapam counter.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-[#FFF9ED] border-2 border-[#C9972B]/40 rounded-2xl p-5 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Provisional Receipt No.</span>
                    <span className="font-mono font-bold text-sm text-[#7F1D1D]">
                      {generatedReceipt.receiptNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Verification Status</span>
                    <span className="font-bold text-xs text-amber-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Admin Approval
                    </span>
                  </div>
                </div>

                <div className="border-t border-[#C9972B]/20 pt-3 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Seva Contribution</span>
                    <span className="font-extrabold text-sm text-[#166534]">
                      {createdMaterial.quantity} {createdMaterial.unit}
                    </span>
                    <span className="text-xs text-[#292524] block">{createdMaterial.materialName}</span>
                  </div>
                  <div>
                    <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Offered By</span>
                    <span className="font-bold text-xs text-[#292524]">{createdMaterial.donorName}</span>
                    <span className="text-[11px] text-[#292524]/60 block">{createdMaterial.date}</span>
                  </div>
                </div>

                <div className="border-t border-[#C9972B]/20 pt-3 flex items-center justify-between text-[11px] text-[#78350F]">
                  <span>Provisional Code:</span>
                  <span className="font-mono font-bold">{generatedReceipt.verificationCode}</span>
                </div>
              </div>

              {/* Handover Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <TraditionalDiya size={20} className="shrink-0 mt-0.5" />
                <div>
                  <strong>Mandapam Handover Note:</strong> Please present your provisional receipt number (<span className="font-mono font-bold">{generatedReceipt.receiptNumber}</span>) to the committee desk at Gandhinagar Anjayya Colony, Anakapalle when handing over your items.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setSelectedReceiptForModal(generatedReceipt)}
                  className="w-full py-3 rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Provisional Receipt</span>
                </button>

                <button
                  onClick={() => handleDirectVerify(generatedReceipt.receiptNumber)}
                  className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>Track Review Status</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#C9972B]/30">
                <button
                  onClick={handleResetForm}
                  className="text-xs font-bold text-[#7F1D1D] hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Contribute Another Item</span>
                </button>

                <button
                  onClick={() => setActiveTab('REGISTER')}
                  className="text-xs font-bold text-[#78350F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Material Contributions ({materials.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PUBLIC SEVA REGISTER / TRANSPARENCY LEDGER */}
      {activeTab === 'REGISTER' && (
        <div className="space-y-6">
          {/* Explanation & Action Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9ED] border-2 border-[#C9972B]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <TraditionalDiya size={28} className="shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm text-[#7F1D1D] block">Public Material Seva Register:</strong>
                <p className="text-[#292524]/80">
                  Every item offered for Ganesh Utsav 2026 is published transparently. Devotees can click "Verify" on any entry to confirm its official cryptographic hash on the public verification portal.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab('OFFER');
                setStep(1);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs hover:bg-[#991B1B] shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Contribute Seva Item</span>
            </button>
          </div>

          {/* Search, Category, and Status Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D97706]" />
              <input
                type="text"
                placeholder="Search by material (Rice, Ghee, Garlands), donor, or receipt ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-white border border-[#C9972B]/30 outline-none focus:border-[#D97706]"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-white border border-[#C9972B]/30 outline-none focus:border-[#D97706]"
            >
              <option value="ALL">All Categories</option>
              {MATERIAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Filter Buttons */}
            <div className="inline-flex rounded-xl bg-white border border-[#C9972B]/30 p-1 flex-wrap gap-1">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  statusFilter === 'ALL' ? 'bg-[#7F1D1D] text-white' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                All Active ({activeMaterials.length})
              </button>
              <button
                onClick={() => setStatusFilter('VERIFIED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  statusFilter === 'VERIFIED' ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                ✓ Verified ({verifiedCount})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  statusFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                ⏳ Pending ({pendingCount})
              </button>
              {declinedCount > 0 && (
                <button
                  onClick={() => setStatusFilter('DECLINED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    statusFilter === 'DECLINED' ? 'bg-rose-700 text-white' : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  ✕ Declined ({declinedCount})
                </button>
              )}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-[#C9972B]/30 shadow-md overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FEF3C7]/60 text-[#7F1D1D] font-bold uppercase tracking-wider border-b border-[#C9972B]/30">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Devotee</th>
                  <th className="py-3.5 px-4">Material / Provision</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Ledger Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C9972B]/15">
                {filteredMaterials.map((m) => {
                  const isAppr = m.status === 'Approved' || m.status === 'Verified';
                  const isDeclined = m.status === 'Declined' || m.status === 'Rejected';
                  return (
                    <tr key={m.id} className="hover:bg-[#FFF9ED] transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-[#292524]/80">{m.date}</td>
                      <td className="py-3 px-4 font-bold text-[#292524]">
                        {m.anonymous ? (
                          <span className="italic text-stone-500">Devotee (Anonymous)</span>
                        ) : (
                          m.donorName
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#7F1D1D]">{m.materialName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#D97706]/10 text-[#78350F]">
                          {m.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#166534]">
                        {m.quantity} {m.unit}
                      </td>
                      <td className="py-3 px-4">
                        {isAppr ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified / Received
                          </span>
                        ) : isDeclined ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Declined / Not Accepted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> Pledge Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleDirectVerify(m.receiptId || m.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          title="Verify cryptographic authenticity"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                        <button
                          onClick={() => handleOpenReceipt(m.receiptId)}
                          className="px-2.5 py-1 rounded-lg bg-[#FFFDF7] border border-[#C9972B] text-[#7F1D1D] hover:bg-[#FEF3C7] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ReceiptIcon className="w-3.5 h-3.5 text-[#D97706]" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {filteredMaterials.map((m) => {
              const isAppr = m.status === 'Approved' || m.status === 'Verified';
              const isDeclined = m.status === 'Declined' || m.status === 'Rejected';
              return (
                <div key={m.id} className="p-4 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-bold text-[#7F1D1D] block">{m.materialName}</span>
                      <span className="text-xs text-[#292524]/75">
                        {m.anonymous ? 'Anonymous Devotee' : m.donorName}
                      </span>
                    </div>
                    <span className="text-base font-extrabold text-[#166534]">
                      {m.quantity} {m.unit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-[#292524]/60">
                      {m.date} · {m.category}
                    </span>
                    {isAppr ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    ) : isDeclined ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" /> Declined
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#C9972B]/15">
                    <button
                      onClick={() => handleDirectVerify(m.receiptId || m.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verify</span>
                    </button>
                    <button
                      onClick={() => handleOpenReceipt(m.receiptId)}
                      className="px-2.5 py-1 rounded-lg bg-[#FFFDF7] border border-[#C9972B] text-[#7F1D1D] text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ReceiptIcon className="w-3 h-3 text-[#D97706]" />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceiptForModal && (
        <ReceiptModal
          receipt={selectedReceiptForModal}
          onClose={() => setSelectedReceiptForModal(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
