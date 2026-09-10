import React, { useState } from 'react';
import { Settings, Save, CheckCircle, Shield, Building, Sliders, Receipt, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import { svucStore } from '../../services/store';
import { settingsService } from '../../services/adminService';
import { authService } from '../../services/authService';
import { AdminBreadcrumbs } from '../../components/admin/AdminBreadcrumbs';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { seedService } from '../../services/firebase/seedService';
import { isFirebaseConfigured } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

interface AdminSettingsPageProps {
  onNavigate: (route: string) => void;
}

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({ onNavigate }) => {
  const currentSettings = svucStore.getSettings();
  const [formData, setFormData] = useState({
    committeeName: currentSettings.committeeName,
    festivalName: currentSettings.festivalName || 'Sri Siddhi Vinayaka Ganesh Utsav 2026',
    year: currentSettings.year || currentSettings.festivalYear || '2026',
    festivalYear: currentSettings.festivalYear || currentSettings.year || '2026',
    festivalStartDate: currentSettings.festivalStartDate || '2026-09-14',
    festivalEndDate: currentSettings.festivalEndDate || '2026-09-22',
    location: currentSettings.location,
    targetBudget: currentSettings.targetBudget,
    annadanamCapacity: currentSettings.annadanamCapacity,
    upiId: currentSettings.upiId,
    contactPhone: currentSettings.contactPhone,
    contactEmail: currentSettings.contactEmail,
    enablePublicTransparency: currentSettings.enablePublicTransparency !== false,
    maintenanceMode: currentSettings.maintenanceMode || false,
    maintenanceMessage:
      currentSettings.maintenanceMessage ||
      "We're performing a short maintenance update. Please check back soon.",
    paymentEnvironment: currentSettings.paymentEnvironment || 'development',
    requireBillForExpensesAbove: 2000,
    receiptPrefix: currentSettings.receiptPrefix || `SSV-${currentSettings.festivalYear || '2026'}-`,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const isSuperAdmin = authService.hasRole('SUPER_ADMIN');
  const isConfigured = isFirebaseConfigured();

  const handleSeedData = async () => {
    setSeedingLoading(true);
    setSeedResult(null);
    try {
      const res = await seedService.seedInitialCommitteeData();
      setSeedResult(res);
    } catch (err: any) {
      setSeedResult({ success: false, message: err.message || 'Seeding failed' });
    } finally {
      setSeedingLoading(false);
      setShowSeedConfirm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingsService.update(
        {
          committeeName: formData.committeeName,
          festivalName: formData.festivalName,
          year: formData.year,
          festivalYear: formData.year,
          festivalStartDate: formData.festivalStartDate,
          festivalEndDate: formData.festivalEndDate,
          location: formData.location,
          targetBudget: Number(formData.targetBudget),
          annadanamCapacity: Number(formData.annadanamCapacity),
          upiId: formData.upiId,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          enablePublicTransparency: formData.enablePublicTransparency,
          maintenanceMode: formData.maintenanceMode,
          maintenanceMessage: formData.maintenanceMessage,
          paymentEnvironment: formData.paymentEnvironment as any,
          receiptPrefix: `SSV-${formData.year}-`,
        },
        'Updated committee configuration & financial thresholds'
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
    }
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Committee Settings' }]} onNavigate={onNavigate} />

      <AdminPageHeader
        title="Committee Configuration & Governance Controls"
        subtitle="Manage official identity, target financial mobilization goals, and compliance rules"
        actions={
          isSuperAdmin && (
            <button
              onClick={handleSubmit}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save System Settings</span>
            </button>
          )
        }
      />

      {savedSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center shadow-xs">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>
            Committee settings successfully saved and propagated. Changes have been recorded in the permanent audit trail.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Committee Identity */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-stone-100 mb-4">
            <Building className="w-4 h-4 text-[#7F1D1D]" />
            <h3 className="text-sm font-bold font-serif text-stone-900">
              Official Committee Identity
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Registered Committee Name
              </label>
              <input
                type="text"
                required
                disabled={!isSuperAdmin}
                value={formData.committeeName}
                onChange={(e) => setFormData({ ...formData, committeeName: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Festival Event Title
              </label>
              <input
                type="text"
                required
                disabled={!isSuperAdmin}
                value={formData.festivalName}
                onChange={(e) => setFormData({ ...formData, festivalName: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Active Festival Year
              </label>
              <input
                type="text"
                required
                disabled={!isSuperAdmin}
                value={formData.year}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    year: val,
                    festivalYear: val,
                    receiptPrefix: `SSV-${val}-`,
                  });
                }}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs font-mono font-bold text-amber-900 focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Controls annual sequence isolation (e.g., SSV-{formData.year}-D-XXXXX) preventing cross-year collision.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Festival Dates (Start & End)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  disabled={!isSuperAdmin}
                  value={formData.festivalStartDate}
                  onChange={(e) => setFormData({ ...formData, festivalStartDate: e.target.value })}
                  className="rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
                />
                <input
                  type="date"
                  required
                  disabled={!isSuperAdmin}
                  value={formData.festivalEndDate}
                  onChange={(e) => setFormData({ ...formData, festivalEndDate: e.target.value })}
                  className="rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
                />
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">
                Synchronizes the homepage countdown, daily pooja schedule, and concluding visarjan dates.
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">
                Mandapam Official Venue / Address
              </label>
              <input
                type="text"
                required
                disabled={!isSuperAdmin}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Helpline Phone Number
              </label>
              <input
                type="text"
                required
                disabled={!isSuperAdmin}
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Official Email</label>
              <input
                type="email"
                required
                disabled={!isSuperAdmin}
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
              />
            </div>
          </div>
        </div>

        {/* Treasury & Financial Controls */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-stone-100 mb-4">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold font-serif text-stone-900">
              Financial Targets & Treasury Controls
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Target Mobilization Budget (₹)
              </label>
              <input
                type="number"
                min="50000"
                required
                disabled={!isSuperAdmin}
                value={formData.targetBudget}
                onChange={(e) => setFormData({ ...formData, targetBudget: Number(e.target.value) })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs font-bold text-emerald-800 focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Controls the public transparency progress bar and mobilization targets
              </span>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Annadanam Daily Capacity (Meals)
              </label>
              <input
                type="number"
                min="100"
                required
                disabled={!isSuperAdmin}
                value={formData.annadanamCapacity}
                onChange={(e) =>
                  setFormData({ ...formData, annadanamCapacity: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs font-bold text-amber-900 focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Mandapam Official UPI VPA
              </label>
              <input
                type="text"
                required
                disabled={!isSuperAdmin}
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs font-mono focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Mandatory Bill Attachment Threshold (₹)
              </label>
              <input
                type="number"
                disabled={!isSuperAdmin}
                value={formData.requireBillForExpensesAbove}
                onChange={(e) =>
                  setFormData({ ...formData, requireBillForExpensesAbove: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={formData.enablePublicTransparency}
                onChange={(e) =>
                  setFormData({ ...formData, enablePublicTransparency: e.target.checked })
                }
                className="rounded text-[#7F1D1D] focus:ring-[#7F1D1D]"
              />
              <span className="text-xs font-semibold text-stone-800">
                Enable Public Financial Transparency Portal (Live ledger accessible to all devotees)
              </span>
            </label>
          </div>
        </div>

        {/* Receipt Generator Configuration */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-stone-100 mb-4">
            <Receipt className="w-4 h-4 text-indigo-700" />
            <h3 className="text-sm font-bold font-serif text-stone-900">
              Receipt & Verification Standards
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Receipt Number Prefix
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={formData.receiptPrefix}
                onChange={(e) => setFormData({ ...formData, receiptPrefix: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs font-mono focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Verification Route Pattern
              </label>
              <input
                type="text"
                disabled
                value="#/receipt/:receiptId"
                className="w-full rounded-lg border border-stone-300 p-2 text-xs font-mono bg-stone-100 text-stone-600"
              />
            </div>
          </div>
        </div>

        {/* Payment Gateway Production Status & Live Safety Controls (Sections 21, 22) */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold font-serif text-stone-900">
                Payment Integration & Live Readiness
              </h3>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                PAYMENT CONFIGURATION REQUIRED
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Gateway Environment Mode
              </label>
              <select
                disabled={!isSuperAdmin}
                value={formData.paymentEnvironment}
                onChange={(e) => setFormData({ ...formData, paymentEnvironment: e.target.value as any })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100 bg-white"
              >
                <option value="development">Development (Mock / Sandbox Mode)</option>
                <option value="staging">Staging (UAT Testing)</option>
                <option value="production">Production (Real Bank Settlement)</option>
              </select>
              <span className="text-[10px] text-stone-400 mt-1 block">
                Live payments remain safeguarded until merchant VPA, provider key, and server verification are configured.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Committee Settlement Account (UPI VPA)
              </label>
              <input
                type="text"
                disabled
                value={formData.upiId}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs font-mono bg-stone-50 text-stone-700"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Primary merchant identifier for all direct devotee UPI intent payments.
              </span>
            </div>
          </div>
        </div>

        {/* Public Maintenance Mode Controls (Section 43) */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-stone-100 mb-4">
            <Sliders className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm font-bold font-serif text-stone-900">
              Public Portal Maintenance Controls
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={formData.maintenanceMode}
                onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                className="rounded text-amber-700 focus:ring-amber-700"
              />
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  Enable Maintenance Mode for Public Visitors
                </span>
                <span className="text-[10px] text-stone-500">
                  Displays a respectful maintenance update to public visitors while allowing committee administrators full access to the management portal.
                </span>
              </div>
            </label>

            {formData.maintenanceMode && (
              <div className="pt-2 animate-in fade-in duration-200">
                <label className="block font-semibold text-stone-700 mb-1">
                  Public Maintenance Notice Message
                </label>
                <textarea
                  rows={2}
                  disabled={!isSuperAdmin}
                  value={formData.maintenanceMessage}
                  onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                  className="w-full rounded-lg border border-amber-300 p-2 text-xs bg-amber-50/50 focus:border-amber-600 outline-hidden disabled:bg-stone-100"
                />
              </div>
            )}
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 px-6 py-2.5 text-xs font-bold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Committee Settings</span>
            </button>
          </div>
        )}
      </form>

      {/* Super Admin Database Management & Seeding Section (Section 93) */}
      {isSuperAdmin && (
        <div className="mt-10 pt-6 border-t border-stone-200">
          <div className="bg-stone-900 text-white border border-stone-800 rounded-xl p-6 shadow-md">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif text-amber-300">
                    Firebase Cloud Database Administration
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Stage 4 Persistent Firestore & Storage Backend Management
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isConfigured ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' : 'bg-amber-900/50 text-amber-300 border border-amber-700/50'}`}>
                  {isConfigured ? '● Firebase Active' : '○ Firebase Preview Mode'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-800 text-xs text-stone-300 space-y-3">
              <p className="leading-relaxed">
                Production database operations must be explicitly triggered. Per committee governance, initial records (11-day utsav schedule, official announcements, gallery archives, and committee settings) can be seeded into your Firestore project on demand.
              </p>

              {seedResult && (
                <div className={`p-3 rounded-lg flex items-start gap-2 ${seedResult.success ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200' : 'bg-red-950/80 border border-red-800 text-red-200'}`}>
                  {seedResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                  <span>{seedResult.message}</span>
                </div>
              )}

              {showSeedConfirm ? (
                <div className="p-4 bg-stone-800/90 border border-amber-500/40 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Confirm Manual Database Seeding</span>
                  </div>
                  <p className="text-stone-300 text-xs">
                    This will populate Firestore collections with baseline committee records (settings, utsav events, announcements, gallery, and counter sequence). Existing non-conflicting documents will be preserved.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={seedingLoading}
                      onClick={handleSeedData}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {seedingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>{seedingLoading ? 'Seeding Firestore...' : 'Yes, Seed Baseline Data'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSeedConfirm(false)}
                      className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSeedConfirm(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-colors shadow-xs"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Seed Initial Committee Data</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
