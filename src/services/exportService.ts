import { Donation, Expense, MaterialDonation, AuditLog } from '../types';
import { svucStore } from './store';

export const exportService = {
  /**
   * Helper to trigger real file download in browser
   */
  downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Helper to escape CSV cell values
   */
  escapeCsv(value: any): string {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  },

  /**
   * Section 41: Donation CSV Export
   * Columns: Receipt ID, Date, Donor, Amount, Payment Method, Payment Status, Approval Status
   */
  exportDonationsCsv(donations: Donation[], filename = `SVUC_Donations_${new Date().toISOString().slice(0, 10)}.csv`) {
    const headers = ['Receipt ID', 'Date', 'Donor', 'Amount', 'Payment Method', 'Payment Status', 'Approval Status'];
    const rows = donations.map((d) => [
      this.escapeCsv(d.receiptId || d.id),
      this.escapeCsv(d.date),
      this.escapeCsv(d.anonymous ? 'Devotee (Anonymous)' : d.donorName),
      this.escapeCsv(d.amount),
      this.escapeCsv(d.paymentMethod),
      this.escapeCsv(d.paymentStatus || 'paid'),
      this.escapeCsv(d.status),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  },

  /**
   * Section 42: Expense CSV Export
   * Columns: Expense ID, Date, Expense, Category, Amount, Status
   */
  exportExpensesCsv(expenses: Expense[], filename = `SVUC_Expenses_${new Date().toISOString().slice(0, 10)}.csv`) {
    const headers = ['Expense ID', 'Date', 'Expense', 'Category', 'Amount', 'Status'];
    const rows = expenses.map((e) => [
      this.escapeCsv(e.receiptVoucherNo || e.id),
      this.escapeCsv(e.date),
      this.escapeCsv(e.expenseName),
      this.escapeCsv(e.category),
      this.escapeCsv(e.amount),
      this.escapeCsv(e.status),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  },

  /**
   * Section 43: Material CSV Export
   * Columns: Receipt ID, Date, Contributor, Material, Quantity, Unit, Status
   */
  exportMaterialsCsv(materials: MaterialDonation[], filename = `SVUC_Materials_${new Date().toISOString().slice(0, 10)}.csv`) {
    const headers = ['Receipt ID', 'Date', 'Contributor', 'Material', 'Quantity', 'Unit', 'Status'];
    const rows = materials.map((m) => [
      this.escapeCsv(m.receiptId || m.id),
      this.escapeCsv(m.date),
      this.escapeCsv(m.anonymous ? 'Devotee (Anonymous)' : m.donorName),
      this.escapeCsv(m.materialName),
      this.escapeCsv(m.quantity),
      this.escapeCsv(m.unit),
      this.escapeCsv(m.status),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  },

  /**
   * Section 77: Audit Log CSV Export
   */
  exportAuditLogsCsv(logs: AuditLog[], filename = `SVUC_AuditLogs_${new Date().toISOString().slice(0, 10)}.csv`) {
    const headers = ['Log ID', 'Timestamp', 'Actor', 'Role', 'Action', 'Entity', 'Record ID', 'Details', 'Reason'];
    const rows = logs.map((l) => [
      this.escapeCsv(l.id),
      this.escapeCsv(l.timestamp),
      this.escapeCsv(l.userName),
      this.escapeCsv(l.userRole),
      this.escapeCsv(l.action),
      this.escapeCsv(l.entity),
      this.escapeCsv(l.recordId),
      this.escapeCsv(l.details),
      this.escapeCsv(l.reason || l.auditReason || ''),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  },

  /**
   * Section 40: Excel Spreadsheet Export (XML Workbook format compatible with Microsoft Excel, Google Sheets, LibreOffice)
   */
  exportExcelWorkbook(title: string, sheetName: string, headers: string[], rows: (string | number)[][]) {
    const xmlRows = rows
      .map((row) => {
        const cells = row
          .map(
            (val) =>
              `<Cell><Data ss:Type="${typeof val === 'number' ? 'Number' : 'String'}">${String(val)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')}</Data></Cell>`
          )
          .join('');
        return `<Row>${cells}</Row>`;
      })
      .join('');

    const headerCells = headers
      .map(
        (h) =>
          `<Cell ss:StyleID="Header"><Data ss:Type="String">${String(h)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')}</Data></Cell>`
      )
      .join('');

    const excelXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#7F1D1D" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sheetName}">
  <Table>
   <Row>${headerCells}</Row>
   ${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`;

    this.downloadFile(excelXml, `${title}_${new Date().toISOString().slice(0, 10)}.xls`, 'application/vnd.ms-excel');
  },

  /**
   * Section 72 & 73: Super Admin Full Database System Backup
   */
  exportFullDatabaseBackup(): { success: boolean; filename: string } {
    const backupData = {
      committee: 'Sri Siddhi Vinayaka Utsava Committee',
      festivalYear: '2026',
      exportedAt: new Date().toISOString(),
      disclaimer: 'Exports are administrative backups and should be stored securely.',
      data: {
        settings: svucStore.getSettings(),
        donations: svucStore.getDonations(),
        materials: svucStore.getMaterials(),
        expenses: svucStore.getExpenses(),
        events: svucStore.getEvents(),
        announcements: svucStore.getAnnouncements(),
        gallery: svucStore.getGallery(),
        users: svucStore.getUsers(),
        auditLogs: svucStore.getAuditLogs(),
      },
    };

    const content = JSON.stringify(backupData, null, 2);
    const filename = `SVUC_Full_System_Backup_${Date.now()}.json`;
    this.downloadFile(content, filename, 'application/json');

    svucStore.addAuditLog(
      'System',
      'BACKUP-FULL',
      'EXPORT',
      'Super Admin generated full JSON system database backup.',
      'Routine festival archive'
    );

    return { success: true, filename };
  },

  /**
   * Universal CSV exporter for arbitrary row records
   */
  exportToCSV(filename: string, rows: Record<string, any>[]) {
    if (!rows || rows.length === 0) {
      this.downloadFile('', `${filename}.csv`, 'text/csv;charset=utf-8;');
      return;
    }
    const headers = Object.keys(rows[0]);
    const lines = rows.map((r) => headers.map((h) => this.escapeCsv(r[h])).join(','));
    const content = '\uFEFF' + [headers.join(','), ...lines].join('\r\n');
    this.downloadFile(content, `${filename}.csv`, 'text/csv;charset=utf-8;');
  },

  /**
   * Universal Excel XML exporter for arbitrary row records
   */
  exportToExcelHtml(filename: string, rows: Record<string, any>[], sheetName = 'Sheet1') {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const matrix = rows.map((r) => headers.map((h) => r[h]));
    this.exportExcelWorkbook(filename, sheetName, headers, matrix);
  },

  /**
   * Convenience alias
   */
  exportFullSystemBackupJSON() {
    return this.exportFullDatabaseBackup();
  },
};
