import { Donation, Expense, MaterialDonation } from '../types';
import { svucStore } from './store';

export interface FinancialSummaryData {
  totalApprovedDonations: number;
  totalApprovedExpenses: number;
  availableBalance: number;
  totalDonationCount: number;
  approvedDonationCount: number;
  pendingDonationCount: number;
  totalExpenseCount: number;
  approvedExpenseCount: number;
  pendingExpenseCount: number;
  totalMaterialCount: number;
  approvedMaterialCount: number;
  pendingMaterialCount: number;
  totalMaterialItemsCount: number;
  todayDonations: number;
  todayExpenses: number;
  totalUniqueDonors: number;
  categoryExpenses: { category: string; amount: number; percentage: number; count: number }[];
  donationsByMethod: { method: string; amount: number; count: number }[];
  donationsByDate: { date: string; donations: number; expenses: number }[];
}

export const financialService = {
  // Returns strictly approved donations (including legacy 'Verified' status)
  getApprovedDonations(): Donation[] {
    return svucStore.getDonations().filter((d) => d.status === 'Approved' || d.status === 'Verified');
  },

  // Returns all donations
  getAllDonations(): Donation[] {
    return svucStore.getDonations();
  },

  // Returns strictly approved expenses (and 'Paid')
  getApprovedExpenses(): Expense[] {
    return svucStore.getExpenses().filter((e) => e.status === 'Approved' || e.status === 'Paid');
  },

  getAllExpenses(): Expense[] {
    return svucStore.getExpenses();
  },

  // Returns strictly approved material contributions
  getApprovedMaterials(): MaterialDonation[] {
    return svucStore.getMaterials().filter((m) => m.status === 'Approved' || m.status === 'Verified');
  },

  getAllMaterials(): MaterialDonation[] {
    return svucStore.getMaterials();
  },

  // Formula per Section 82: Available Balance = Approved Monetary Donations - Approved Expenses
  calculateBalance(): number {
    const totalDonations = this.getApprovedDonations().reduce((sum, d) => sum + d.amount, 0);
    const totalExpenses = this.getApprovedExpenses().reduce((sum, e) => sum + e.amount, 0);
    return totalDonations - totalExpenses;
  },

  calculateSummaryFromData(
    allDonations: Donation[],
    allExpenses: Expense[],
    allMaterials: MaterialDonation[]
  ): FinancialSummaryData {
    const approvedDonations = allDonations.filter((d) => d.status === 'Approved' || d.status === 'Verified');
    const pendingDonations = allDonations.filter((d) => d.status === 'Pending');

    const approvedExpenses = allExpenses.filter((e) => e.status === 'Approved' || e.status === 'Paid');
    const pendingExpenses = allExpenses.filter((e) => e.status === 'Pending');

    const approvedMaterials = allMaterials.filter((m) => m.status === 'Approved' || m.status === 'Verified');
    const pendingMaterials = allMaterials.filter((m) => m.status === 'Pending');

    const totalApprovedDonations = approvedDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalApprovedExpenses = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const availableBalance = totalApprovedDonations - totalApprovedExpenses;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayDonations = approvedDonations
      .filter((d) => d.date === todayStr)
      .reduce((sum, d) => sum + d.amount, 0);
    const todayExpenses = approvedExpenses
      .filter((e) => e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);

    const uniqueDonors = new Set(approvedDonations.map((d) => d.donorName.trim().toLowerCase())).size;

    const catMap: Record<string, { amount: number; count: number }> = {};
    approvedExpenses.forEach((e) => {
      if (!catMap[e.category]) catMap[e.category] = { amount: 0, count: 0 };
      catMap[e.category].amount += e.amount;
      catMap[e.category].count += 1;
    });

    const categoryExpenses = Object.entries(catMap)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalApprovedExpenses > 0 ? Math.round((data.amount / totalApprovedExpenses) * 100) : 0,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    const methodMap: Record<string, { amount: number; count: number }> = {};
    approvedDonations.forEach((d) => {
      if (!methodMap[d.paymentMethod]) methodMap[d.paymentMethod] = { amount: 0, count: 0 };
      methodMap[d.paymentMethod].amount += d.amount;
      methodMap[d.paymentMethod].count += 1;
    });

    const donationsByMethod = Object.entries(methodMap).map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
    }));

    const totalMaterialItemsCount = approvedMaterials.reduce((sum, m) => sum + m.quantity, 0);

    const dateMap: Record<string, { donations: number; expenses: number }> = {};
    approvedDonations.forEach((d) => {
      if (!dateMap[d.date]) dateMap[d.date] = { donations: 0, expenses: 0 };
      dateMap[d.date].donations += d.amount;
    });
    approvedExpenses.forEach((e) => {
      if (!dateMap[e.date]) dateMap[e.date] = { donations: 0, expenses: 0 };
      dateMap[e.date].expenses += e.amount;
    });

    const donationsByDate = Object.entries(dateMap)
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalApprovedDonations,
      totalApprovedExpenses,
      availableBalance,
      totalDonationCount: allDonations.length,
      approvedDonationCount: approvedDonations.length,
      pendingDonationCount: pendingDonations.length,
      totalExpenseCount: allExpenses.length,
      approvedExpenseCount: approvedExpenses.length,
      pendingExpenseCount: pendingExpenses.length,
      totalMaterialCount: allMaterials.length,
      approvedMaterialCount: approvedMaterials.length,
      pendingMaterialCount: pendingMaterials.length,
      totalMaterialItemsCount,
      todayDonations,
      todayExpenses,
      totalUniqueDonors: uniqueDonors,
      categoryExpenses,
      donationsByMethod,
      donationsByDate,
    };
  },

  getSummary(): FinancialSummaryData {
    return this.calculateSummaryFromData(
      this.getAllDonations(),
      this.getAllExpenses(),
      this.getAllMaterials()
    );
  },
};
