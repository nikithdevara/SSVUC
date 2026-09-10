import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  FileText,
  Calendar,
  Filter,
} from 'lucide-react';
import { financialService } from '../../services/financialService';
import { reportService } from '../../services/adminService';
import { svucStore } from '../../services/store';
import { AdminBreadcrumbs } from '../../components/admin/AdminBreadcrumbs';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStats, StatCardItem } from '../../components/admin/AdminStats';
import { exportService } from '../../services/exportService';
import { pdfReceiptService } from '../../services/pdfReceiptService';
import { useToast } from '../../components/common/Toast';

interface AdminReportsPageProps {
  onNavigate: (route: string) => void;
}

export const AdminReportsPage: React.FC<AdminReportsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const summary = financialService.getSummary();
  const settings = svucStore.getSettings();
  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY' | 'WEEK'>('ALL');

  const stats: StatCardItem[] = [
    {
      id: 'rep-donations',
      label: 'Total Approved Revenue',
      value: `₹${summary.totalApprovedDonations.toLocaleString('en-IN')}`,
      subtext: `${summary.approvedDonationCount} verified vouchers`,
      icon: <DollarSign className="w-5 h-5 text-emerald-700" />,
      iconBg: 'bg-emerald-50 text-emerald-700',
      positive: true,
    },
    {
      id: 'rep-expenses',
      label: 'Total Disbursed Expenses',
      value: `₹${summary.totalApprovedExpenses.toLocaleString('en-IN')}`,
      subtext: `${summary.approvedExpenseCount} approved expenses`,
      icon: <FileText className="w-5 h-5 text-red-700" />,
      iconBg: 'bg-red-50 text-red-700',
    },
    {
      id: 'rep-balance',
      label: 'Net Treasury Surplus',
      value: `₹${summary.availableBalance.toLocaleString('en-IN')}`,
      subtext: 'Liquid available funds',
      icon: <TrendingUp className="w-5 h-5 text-amber-700" />,
      iconBg: 'bg-amber-50 text-amber-700',
      highlight: true,
    },
    {
      id: 'rep-budget',
      label: 'Target Budget',
      value: `₹${settings.targetBudget.toLocaleString('en-IN')}`,
      subtext: `${Math.round((summary.totalApprovedDonations / settings.targetBudget) * 100)}% mobilized`,
      icon: <BarChart3 className="w-5 h-5 text-indigo-700" />,
      iconBg: 'bg-indigo-50 text-indigo-700',
    },
  ];

  const handleExportFullCSV = () => {
    const donations = financialService.getApprovedDonations();
    const rows = donations.map((d) => ({
      'Type': 'OFFERING',
      'Ref No': d.receiptId,
      'Name/Payee': d.donorName,
      'Category': 'General Fund',
      'Inflow (INR)': d.amount,
      'Outflow (INR)': 0,
      'Date': d.date,
      'Mode': d.paymentMethod,
    }));

    const expenses = financialService.getApprovedExpenses();
    expenses.forEach((e) => {
      rows.push({
        'Type': 'EXPENSE',
        'Ref No': e.receiptVoucherNo,
        'Name/Payee': e.vendorName,
        'Category': e.category,
        'Inflow (INR)': 0,
        'Outflow (INR)': e.amount,
        'Date': e.date,
        'Mode': e.paymentMethod,
      });
    });

    exportService.exportToCSV('SSV_Financial_Summary_Statement_2026', rows);
    showToast('Exported CSV Audit Ledger successfully', 'success');
  };

  const handleExportExcel = () => {
    const donations = financialService.getApprovedDonations();
    const rows = donations.map((d) => ({
      'Type': 'DONATION',
      'Ref No': d.receiptId,
      'Name/Payee': d.donorName,
      'Category': 'General Fund',
      'Inflow (INR)': d.amount,
      'Outflow (INR)': 0,
      'Date': d.date,
      'Mode': d.paymentMethod,
    }));

    const expenses = financialService.getApprovedExpenses();
    expenses.forEach((e) => {
      rows.push({
        'Type': 'EXPENSE',
        'Ref No': e.receiptVoucherNo,
        'Name/Payee': e.vendorName,
        'Category': e.category,
        'Inflow (INR)': 0,
        'Outflow (INR)': e.amount,
        'Date': e.date,
        'Mode': e.paymentMethod,
      });
    });

    exportService.exportToExcelHtml('SSV_Financial_Summary_Statement_2026', rows, 'Financial Ledger');
    showToast('Exported Excel (.xls) file successfully', 'success');
  };

  const handlePrintPDF = () => {
    try {
      const fileName = pdfReceiptService.generateFinancialStatementPdf(summary, settings);
      showToast(`Downloaded Official PDF Financial Statement: ${fileName}`, 'success');
    } catch (err) {
      console.error(err);
      reportService.exportPDF('Sri Siddhi Vinayaka Utsav Financial Report 2026');
    }
  };

  const handleSystemBackup = () => {
    exportService.exportFullSystemBackupJSON();
    showToast('Full system cryptographic JSON backup generated', 'success');
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Financial Reports' }]} onNavigate={onNavigate} />

      <AdminPageHeader
        title="Audit & Financial Statements"
        subtitle="Consolidated cash-flow summaries, expenditure ledgers, and official treasury reports"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintPDF}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-stone-500" />
              <span>Official PDF Statement</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportFullCSV}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Full Audit CSV</span>
            </button>

            <button
              onClick={handleSystemBackup}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              <span>JSON Backup</span>
            </button>
          </div>
        }
      />

      <AdminStats stats={stats} />

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Expenditure Breakdown */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
            <h3 className="text-sm font-bold font-serif text-stone-900">
              Approved Expenditure by Category
            </h3>
            <span className="text-xs text-stone-500">
              Total: ₹{summary.totalApprovedExpenses.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-3">
            {summary.categoryExpenses.map((cat) => (
              <div key={cat.category} className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-stone-800">{cat.category}</span>
                  <div className="space-x-2">
                    <span className="font-bold text-stone-900">₹{cat.amount.toLocaleString('en-IN')}</span>
                    <span className="text-stone-400 font-mono">({cat.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-red-600 to-amber-600 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collections by Payment Method */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
            <h3 className="text-sm font-bold font-serif text-stone-900">
              Collections by Inflow Channel
            </h3>
            <span className="text-xs text-stone-500">
              Total: ₹{summary.totalApprovedDonations.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-4">
            {summary.donationsByMethod.map((m) => {
              const pct =
                summary.totalApprovedDonations > 0
                  ? Math.round((m.amount / summary.totalApprovedDonations) * 100)
                  : 0;
              return (
                <div key={m.method} className="p-3 rounded-lg border border-stone-100 bg-stone-50/50">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-stone-900">{m.method}</span>
                      <span className="text-stone-400 ml-2">({m.count} offerings)</span>
                    </div>
                    <span className="font-bold text-emerald-800 text-sm">
                      ₹{m.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Official Audit Statement Certification Footer */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs text-xs text-stone-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-4">
          <div>
            <h4 className="font-bold text-stone-900 font-serif text-sm">
              Official Sri Siddhi Vinayaka Utsav Financial Audit Registry
            </h4>
            <p className="text-stone-500 mt-0.5">
              Gandhinagar Anjayya Colony, Anakapalle, Andhra Pradesh
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-stone-500">Report Generated:</span>
            <div className="font-mono text-stone-700">{new Date().toLocaleString('en-IN')}</div>
          </div>
        </div>

        <p className="leading-relaxed text-stone-500">
          This document certifies that all recorded monetary offerings and vendor disbursements reflect genuine transactions submitted to the Treasury of Sri Siddhi Vinayaka Utsava Committee. Only records verified by the appointed counter in-charges and signed by the committee Treasurer are included in public transparency calculations.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 mt-4 text-center font-serif text-stone-700">
          <div>
            <div className="h-8 border-b border-dashed border-stone-300 mb-1" />
            <span className="font-bold text-xs text-stone-900">Super Admin</span>
            <div className="text-[10px] text-stone-500 font-sans">President / Super Admin</div>
          </div>
          <div>
            <div className="h-8 border-b border-dashed border-stone-300 mb-1" />
            <span className="font-bold text-xs text-stone-900">Treasurer</span>
            <div className="text-[10px] text-stone-500 font-sans">Treasury Officer</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="h-8 border-b border-dashed border-stone-300 mb-1" />
            <span className="font-bold text-xs text-stone-900">Committee Admin</span>
            <div className="text-[10px] text-stone-500 font-sans">Secretary / Admin</div>
          </div>
        </div>
      </div>
    </div>
  );
};
