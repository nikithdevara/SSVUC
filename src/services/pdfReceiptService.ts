import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Receipt, CommitteeSettings } from '../types';

export const pdfReceiptService = {
  /**
   * Generate official, high-quality Printable PDF Donation / Material Receipt
   */
  async generateReceiptPdf(receipt: Receipt, settings?: Partial<CommitteeSettings>): Promise<string> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5', // Standard compact official Indian temple receipt format
    });

    const committeeName = settings?.committeeName || 'Sri Siddhi Vinayaka Utsava Committee';
    const location = settings?.location || 'Gandhinagar Anjayya Colony, Anakapalle, AP';
    const festivalYear = settings?.festivalYear || '2026';
    const isMaterial = receipt.type === 'MATERIAL';
    const isVoid = receipt.status === 'VOID' || receipt.status === 'REVOKED';

    // Page dimensions (A5: 148 x 210 mm)
    const pageWidth = 148;
    const pageHeight = 210;

    // Background Warm Ivory
    doc.setFillColor(255, 253, 247);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Outer Ornamental Border (Antique Gold)
    doc.setDrawColor(201, 151, 43); // #C9972B
    doc.setLineWidth(1.2);
    doc.rect(6, 6, pageWidth - 12, pageHeight - 12);

    // Inner Subtle Maroon Border
    doc.setDrawColor(127, 29, 29); // #7F1D1D
    doc.setLineWidth(0.4);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Sacred Devanagari Invocation
    doc.setTextColor(127, 29, 29);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('|| Sri Ganeshaya Namaha ||', pageWidth / 2, 16, { align: 'center' });

    // Committee Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(committeeName.toUpperCase(), pageWidth / 2, 24, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(217, 119, 6); // #D97706
    doc.text(`GANESH UTSAV ${festivalYear} · OFFICIAL DIGITAL RECEIPT`, pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setTextColor(80, 70, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`${location} — Pin: 531001`, pageWidth / 2, 35, { align: 'center' });

    // Header Divider Line
    doc.setDrawColor(201, 151, 43);
    doc.setLineWidth(0.6);
    doc.line(14, 38, pageWidth - 14, 38);

    // VOID Watermark if cancelled
    if (isVoid) {
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('VOID RECEIPT / CANCELLED', pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 30,
      });
    }

    // Receipt Meta Badge Box
    doc.setFillColor(254, 243, 199); // #FEF3C7
    doc.roundedRect(14, 42, pageWidth - 28, 16, 2, 2, 'F');
    doc.setDrawColor(201, 151, 43);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, 42, pageWidth - 28, 16, 2, 2, 'D');

    // Left Column: Receipt Number
    doc.setFontSize(7);
    doc.setTextColor(100, 90, 80);
    doc.text('RECEIPT NUMBER', 18, 47);
    doc.setFontSize(10);
    doc.setTextColor(127, 29, 29);
    doc.setFont('helvetica', 'bold');
    doc.text(receipt.receiptNumber, 18, 53);

    // Middle: Date
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 90, 80);
    doc.text('DATE ISSUED', 70, 47);
    doc.setFontSize(9);
    doc.setTextColor(30, 25, 20);
    doc.setFont('helvetica', 'bold');
    doc.text(receipt.date, 70, 53);

    // Right: Type
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 90, 80);
    doc.text('CONTRIBUTION TYPE', 105, 47);
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52); // #166534
    doc.setFont('helvetica', 'bold');
    doc.text(isMaterial ? 'Material Seva' : 'Monetary Seva', 105, 53);

    // Main Details Table Box
    let currentY = 66;
    const leftLabelX = 18;
    const rightValueX = pageWidth - 18;

    const printRow = (label: string, value: string, isHighlight = false, color?: [number, number, number]) => {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 75, 70);
      doc.text(label, leftLabelX, currentY);

      doc.setFont('helvetica', 'bold');
      if (color) {
        doc.setTextColor(color[0], color[1], color[2]);
      } else if (isHighlight) {
        doc.setTextColor(127, 29, 29);
      } else {
        doc.setTextColor(30, 25, 20);
      }
      doc.text(value, rightValueX, currentY, { align: 'right' });

      // Subtle horizontal divider
      doc.setDrawColor(230, 220, 200);
      doc.setLineWidth(0.2);
      doc.line(leftLabelX, currentY + 2.5, rightValueX, currentY + 2.5);

      currentY += 8;
    };

    const donorDisplayName = receipt.anonymous ? 'Devotee (Anonymous Seva)' : receipt.donorName;
    printRow('Devotee / Donor Name:', donorDisplayName);

    if (isMaterial) {
      printRow('Contributed Material:', receipt.materialName || 'Pooja Items');
      printRow('Quantity / Measure:', `${receipt.quantity || 1} ${receipt.unit || 'units'}`, true, [217, 119, 6]);
    } else {
      const formattedAmount = `Rs. ${(receipt.amount || 0).toLocaleString('en-IN')}/-`;
      printRow('Donation Amount:', formattedAmount, true, [22, 101, 52]);
      printRow('Payment Mode:', receipt.paymentMethod || 'UPI');
    }

    const displayIssuedBy = (!receipt.issuedBy || /satyam|treasurer|portal/i.test(receipt.issuedBy))
      ? 'Utsav Committee'
      : receipt.issuedBy;
    printRow('Issued / Registered By:', displayIssuedBy);
    printRow('Cryptographic Auth Code:', receipt.verificationCode);
    printRow('Record Status:', isVoid ? 'REVOKED / VOID' : 'OFFICIALLY VERIFIED', false, isVoid ? [220, 38, 38] : [22, 101, 52]);

    currentY += 4;

    // Security & Verification Callout Box with Live QR Code
    const boxHeight = 36;
    doc.setFillColor(250, 248, 242);
    doc.roundedRect(14, currentY, pageWidth - 28, boxHeight, 2, 2, 'F');
    doc.setDrawColor(201, 151, 43);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, currentY, pageWidth - 28, boxHeight, 2, 2, 'D');

    // Generate crisp QR code data URL
    const verifyBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://siddhivinayaka-utsav.org';
    const verifyUrl = `${verifyBaseUrl}/#/verify/${receipt.receiptNumber}`;

    try {
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 260,
        margin: 1,
        color: {
          dark: '#1C1917',
          light: '#FFFFFF',
        },
      });

      // White frame for QR code
      const qrBoxSize = 28;
      const qrBoxX = pageWidth - 14 - qrBoxSize - 4;
      const qrBoxY = currentY + 3.5;

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 1.5, 1.5, 'F');
      doc.setDrawColor(201, 151, 43);
      doc.setLineWidth(0.3);
      doc.roundedRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 1.5, 1.5, 'D');

      // Embed QR image
      doc.addImage(qrDataUrl, 'PNG', qrBoxX + 1.5, qrBoxY + 1.5, qrBoxSize - 3, qrBoxSize - 3);

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 53, 15);
      doc.text('SCAN TO VERIFY', qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 3.5, { align: 'center' });
    } catch (qrErr) {
      console.warn('Could not render QR code in PDF:', qrErr);
    }

    // Left text inside Verification box
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text('Authentic Committee Digital Record', 18, currentY + 6.5);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 95, 90);
    doc.text('This digital voucher is recorded permanently in the festival ledger.', 18, currentY + 11.5);
    doc.text('Verify authenticity anytime online at:', 18, currentY + 16.5);

    doc.setTextColor(127, 29, 29);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    const displayHost = typeof window !== 'undefined' ? window.location.host : 'utsav.anakapalle.org';
    doc.text(`${displayHost}/#/verify/${receipt.receiptNumber}`, 18, currentY + 22);

    doc.setFontSize(6);
    doc.setTextColor(120, 115, 110);
    doc.setFont('helvetica', 'italic');
    doc.text('Scan the QR code directly with any smartphone camera or UPI scanner.', 18, currentY + 28.5);

    // Blessing Inscription Footer
    const blessingY = pageHeight - 24;
    doc.setDrawColor(201, 151, 43);
    doc.setLineWidth(0.4);
    doc.line(14, blessingY - 4, pageWidth - 14, blessingY - 4);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 53, 15);
    doc.text('"May Lord Sri Siddhi Vinayaka bestow health, wisdom, prosperity, and peace upon your family."', pageWidth / 2, blessingY + 1, {
      align: 'center',
    });

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 130, 120);
    doc.text('Sri Siddhi Vinayaka Utsava Committee · Gandhinagar Anjayya Colony, Anakapalle', pageWidth / 2, blessingY + 6, {
      align: 'center',
    });

    // Save and trigger browser download
    const fileName = `${receipt.receiptNumber}_SVUC_Receipt.pdf`;
    doc.save(fileName);
    return fileName;
  },

  /**
   * Generate official PDF Financial Summary Report
   */
  generateFinancialReportPdf(reportData: {
    periodTitle: string;
    totalDonations: number;
    totalExpenses: number;
    availableBalance: number;
    donorsCount: number;
    materialsCount: number;
    expensesCount: number;
    categories: { category: string; amount: number }[];
    generatedBy: string;
    festivalYear?: string;
  }) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;

    // Header Background
    doc.setFillColor(127, 29, 29); // #7F1D1D
    doc.rect(0, 0, pageWidth, 42, 'F');

    // Accent line
    doc.setFillColor(201, 151, 43); // Gold
    doc.rect(0, 42, pageWidth, 2.5, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('SRI SIDDHI VINAYAKA UTSAVA COMMITTEE', pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(254, 243, 199);
    doc.text(`Official Financial & Audit Report · Ganesh Utsav ${reportData.festivalYear || '2026'}`, pageWidth / 2, 23, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setTextColor(240, 235, 230);
    doc.setFont('helvetica', 'normal');
    doc.text('Gandhinagar Anjayya Colony, Anakapalle, Andhra Pradesh', pageWidth / 2, 29, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(254, 215, 170);
    doc.text(`Report Period: ${reportData.periodTitle.toUpperCase()}`, pageWidth / 2, 36, { align: 'center' });

    let currentY = 56;

    // Summary Metric Cards
    const cardWidth = 55;
    const cardHeight = 24;

    // Card 1: Total Donations
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(15, currentY, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.roundedRect(15, currentY, cardWidth, cardHeight, 2, 2, 'D');
    doc.setTextColor(22, 101, 52);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL DONATIONS', 18, currentY + 6);
    doc.setFontSize(13);
    doc.text(`Rs. ${reportData.totalDonations.toLocaleString('en-IN')}`, 18, currentY + 14);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${reportData.donorsCount} Approved Contributions`, 18, currentY + 20);

    // Card 2: Total Expenses
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(77, currentY, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(77, currentY, cardWidth, cardHeight, 2, 2, 'D');
    doc.setTextColor(153, 27, 27);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL EXPENDITURES', 80, currentY + 6);
    doc.setFontSize(13);
    doc.text(`Rs. ${reportData.totalExpenses.toLocaleString('en-IN')}`, 80, currentY + 14);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${reportData.expensesCount} Verified Vouchers`, 80, currentY + 20);

    // Card 3: Available Balance
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(140, currentY, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(217, 119, 6);
    doc.roundedRect(140, currentY, cardWidth, cardHeight, 2, 2, 'D');
    doc.setTextColor(120, 53, 15);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('NET FESTIVAL BALANCE', 143, currentY + 6);
    doc.setFontSize(13);
    doc.text(`Rs. ${reportData.availableBalance.toLocaleString('en-IN')}`, 143, currentY + 14);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${reportData.materialsCount} Material Offerings`, 143, currentY + 20);

    currentY += 34;

    // Category Breakdown Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(127, 29, 29);
    doc.text('Expenditure Category Breakdown', 15, currentY);

    currentY += 5;

    // Table Header
    doc.setFillColor(245, 245, 240);
    doc.rect(15, currentY, pageWidth - 30, 8, 'F');
    doc.setDrawColor(200, 200, 190);
    doc.rect(15, currentY, pageWidth - 30, 8, 'D');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 55, 50);
    doc.text('Category', 20, currentY + 5.5);
    doc.text('Amount (INR)', 120, currentY + 5.5);
    doc.text('% of Total Expenses', 165, currentY + 5.5);

    currentY += 8;

    reportData.categories.forEach((cat, index) => {
      const pct = reportData.totalExpenses > 0 ? ((cat.amount / reportData.totalExpenses) * 100).toFixed(1) : '0';
      if (index % 2 === 1) {
        doc.setFillColor(252, 250, 247);
        doc.rect(15, currentY, pageWidth - 30, 7, 'F');
      }

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 35, 30);
      doc.text(cat.category, 20, currentY + 4.8);
      doc.text(`Rs. ${cat.amount.toLocaleString('en-IN')}`, 120, currentY + 4.8);
      doc.text(`${pct}%`, 165, currentY + 4.8);

      currentY += 7;
    });

    currentY += 12;

    // Material Seva Summary
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(127, 29, 29);
    doc.text('Devotional Material Seva Contributions', 15, currentY);

    currentY += 6;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 65, 60);
    doc.text(`A total of ${reportData.materialsCount} material offerings (Annadanam rice, pooja oils, flowers, electrical items, coconuts) have been received and utilized with total community transparency.`, 15, currentY, {
      maxWidth: pageWidth - 30,
    });

    // Section 45: Official Mandatory Report Disclaimer
    const footerY = pageHeight - 32;
    doc.setDrawColor(201, 151, 43);
    doc.setLineWidth(0.5);
    doc.line(15, footerY - 4, pageWidth - 15, footerY - 4);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 53, 15);
    doc.text('Official Audit Statement:', 15, footerY);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 75, 70);
    doc.text(
      '"Figures are based on approved records available in the system at the time this report was generated."',
      15,
      footerY + 4.5
    );

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')} by ${reportData.generatedBy}`, 15, footerY + 9);
    doc.text('Sri Siddhi Vinayaka Utsava Committee · Gandhinagar Anjayya Colony, Anakapalle', pageWidth - 15, footerY + 9, { align: 'right' });

    const fileName = `SVUC_Financial_Report_${Date.now()}.pdf`;
    doc.save(fileName);
    return fileName;
  },

  /**
   * Generates formatted Financial Statement PDF from summary and settings
   */
  generateFinancialStatementPdf(summary: any, settings?: any): string {
    return this.generateFinancialReportPdf({
      periodTitle: 'Complete Ganesh Utsav 2026 Season',
      totalDonations: summary.totalDonations || 0,
      totalExpenses: summary.totalExpenses || 0,
      availableBalance: summary.availableBalance || 0,
      donorsCount: summary.totalDonors || summary.donationCount || 0,
      expensesCount: summary.expenseCount || 0,
      materialsCount: summary.materialCount || 0,
      expenseByCategory: summary.expenseByCategory || {},
      generatedBy: settings?.mandapamLocation ? `${settings.mandapamLocation} Accounts` : 'Committee Treasury',
      festivalYear: '2026',
    });
  },
};
