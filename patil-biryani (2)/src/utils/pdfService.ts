import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { BusinessProfile, StaffEmployee, SalaryCalculation, Invoice } from '../types';
import { formatINR, formatDateDisplay, formatMonthDisplay, formatTimeWithPattern } from './formatters';
import { formatFullAddress } from '../data/geoData';

// Number to Words in Indian Rupees format for formal salary slips & invoices
export function numberToIndianWords(num: number): string {
  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero Rupees Only';

  const convertChunk = (val: number): string => {
    let result = '';
    if (val >= 100) {
      result += singleDigits[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
      if (val > 0) result += 'and ';
    }
    if (val >= 20) {
      result += tens[Math.floor(val / 10)] + ' ';
      val %= 10;
    }
    if (val > 0) {
      result += singleDigits[val] + ' ';
    }
    return result;
  };

  let str = '';
  let remainder = n;

  // Crores (1,00,00,000)
  if (remainder >= 10000000) {
    const crores = Math.floor(remainder / 10000000);
    str += convertChunk(crores) + 'Crore ';
    remainder %= 10000000;
  }

  // Lakhs (1,00,000)
  if (remainder >= 100000) {
    const lakhs = Math.floor(remainder / 100000);
    str += convertChunk(lakhs) + 'Lakh ';
    remainder %= 100000;
  }

  // Thousands (1,000)
  if (remainder >= 1000) {
    const thousands = Math.floor(remainder / 1000);
    str += convertChunk(thousands) + 'Thousand ';
    remainder %= 1000;
  }

  // Hundreds & Below
  if (remainder > 0) {
    str += convertChunk(remainder);
  }

  const cleaned = str.replace(/\s+/g, ' ').trim();
  return `${cleaned} Rupees Only`;
}

/**
 * Generate high-quality, professional Salary Slip PDF with guaranteed alignment
 */
export function generateSalarySlipPDF(
  salary: SalaryCalculation,
  employee: StaffEmployee | undefined,
  profile: BusinessProfile
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 32;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 24;

  // Clean White Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer Border Box with exact padding
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.roundedRect(16, 16, pageWidth - 32, pageHeight - 32, 6, 6, 'D');

  // Business Logo / Header
  let headerLeftX = marginX;
  const showSalaryLogo = Boolean(profile.logoUrl && profile.logoUrl.startsWith('data:image'));
  const salaryLogoSize = 44;

  if (showSalaryLogo) {
    try {
      doc.addImage(profile.logoUrl!, 'PNG', marginX, currentY - 2, salaryLogoSize, salaryLogoSize, undefined, 'FAST');
      headerLeftX = marginX + salaryLogoSize + 12;
    } catch (e) {
      console.warn('Could not render logo in PDF:', e);
    }
  }

  const maxHeaderWidth = pageWidth - marginX - headerLeftX;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(profile.name || 'PATIL BIRYANI', headerLeftX, currentY + 11, { maxWidth: maxHeaderWidth });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(100, 116, 139);
  const addrText = `${profile.addressLine1 || 'Main Road'}, ${profile.city || 'Kolhapur'}, ${profile.state || 'Maharashtra'} - ${profile.pinCode || '416001'}`;
  doc.text(addrText, headerLeftX, currentY + 23, { maxWidth: maxHeaderWidth });

  const contactText = `Mobile: ${profile.mobile || 'N/A'}${profile.gstNumber ? ` | GSTIN: ${profile.gstNumber}` : ''}${profile.fssaiNumber ? ` | FSSAI: ${profile.fssaiNumber}` : ''}`;
  doc.text(contactText, headerLeftX, currentY + 34, { maxWidth: maxHeaderWidth });

  currentY += Math.max(showSalaryLogo ? salaryLogoSize + 8 : 42, 44);

  // Title Ribbon
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.roundedRect(marginX, currentY, contentWidth, 24, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `SALARY SLIP FOR THE MONTH OF ${formatMonthDisplay(salary.month).toUpperCase()}`,
    pageWidth / 2,
    currentY + 16,
    { align: 'center', maxWidth: contentWidth - 16 }
  );

  currentY += 30;

  // Employee Information Grid via AutoTable with balanced 22% / 28% proportions
  const empColLabelWidth = contentWidth * 0.22;
  const empColValueWidth = contentWidth * 0.28;

  autoTable(doc, {
    startY: currentY,
    body: [
      [
        { content: 'Employee ID:', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
        { content: employee?.employeeId || salary.employeeId, styles: { textColor: [15, 23, 42], fontStyle: 'bold' } },
        { content: 'Employee Name:', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
        { content: salary.employeeName, styles: { textColor: [15, 23, 42], fontStyle: 'bold' } },
      ],
      [
        { content: 'Designation:', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
        { content: salary.designation || employee?.designation || 'Staff', styles: { textColor: [15, 23, 42] } },
        { content: 'Department:', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
        { content: employee?.department || 'Kitchen / Service', styles: { textColor: [15, 23, 42] } },
      ],
      [
        { content: 'Joining Date:', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
        { content: employee?.joiningDate ? formatDateDisplay(employee.joiningDate) : '01 Jan 2024', styles: { textColor: [15, 23, 42] } },
        { content: 'Salary Model:', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
        { content: `${salary.salaryType} (Base: Rs. ${salary.basicSalary.toLocaleString('en-IN')})`, styles: { textColor: [15, 23, 42] } },
      ],
      [
        { content: 'Paid Days:', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
        { content: `${salary.paidDays} Days / ${salary.totalMonthDays} Days`, styles: { textColor: [15, 23, 42] } },
        { content: 'Payment Status:', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
        { content: `${salary.status}${salary.paymentMode ? ` (${salary.paymentMode})` : ''}`, styles: { textColor: [15, 23, 42], fontStyle: 'bold' } },
      ],
    ],
    theme: 'grid',
    styles: {
      fontSize: 7.8,
      cellPadding: { top: 4.5, bottom: 4.5, left: 6, right: 6 },
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      valign: 'middle',
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: empColLabelWidth, halign: 'left' },
      1: { cellWidth: empColValueWidth, halign: 'left' },
      2: { cellWidth: empColLabelWidth, halign: 'left' },
      3: { cellWidth: empColValueWidth, halign: 'left' },
    },
    margin: { left: marginX, right: marginX },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 12;

  // Earnings & Deductions Table
  const earnedBasic = salary.earnedBasic ?? (salary.grossSalary - (salary.allowancesTotal || 0) - (salary.overtimeAmount || 0));
  const totalDeductions = (salary.advancesDeduction || 0) + (salary.drawingsDeduction || 0) + (salary.otherDeductions || 0);

  const tableBody = [
    [
      'Basic Salary Earned',
      `Rs. ${earnedBasic.toLocaleString('en-IN')}`,
      'Salary Advance Recovered',
      `Rs. ${(salary.advancesDeduction || 0).toLocaleString('en-IN')}`,
    ],
    [
      `Overtime Pay (${salary.overtimeHours || 0} hrs)`,
      `Rs. ${(salary.overtimeAmount || 0).toLocaleString('en-IN')}`,
      'Staff Drawings Recovered',
      `Rs. ${(salary.drawingsDeduction || 0).toLocaleString('en-IN')}`,
    ],
    [
      'Food & Shift Allowances',
      `Rs. ${(salary.allowancesTotal || 0).toLocaleString('en-IN')}`,
      'Other Statutory Deductions',
      `Rs. ${(salary.otherDeductions || 0).toLocaleString('en-IN')}`,
    ],
    [
      'TOTAL GROSS EARNINGS (A)',
      `Rs. ${salary.grossSalary.toLocaleString('en-IN')}`,
      'TOTAL DEDUCTIONS (B)',
      `Rs. ${totalDeductions.toLocaleString('en-IN')}`,
    ],
  ];

  const colWidthLabel = contentWidth * 0.30;
  const colWidthAmount = contentWidth * 0.20;

  autoTable(doc, {
    startY: currentY,
    head: [['EARNINGS DESCRIPTION', 'AMOUNT (Rs.)', 'DEDUCTIONS DESCRIPTION', 'AMOUNT (Rs.)']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
    },
    bodyStyles: {
      fontSize: 7.8,
      textColor: [30, 41, 59],
      cellPadding: { top: 4.5, bottom: 4.5, left: 6, right: 6 },
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: colWidthLabel, halign: 'left', overflow: 'linebreak' },
      1: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: colWidthAmount },
      2: { cellWidth: colWidthLabel, halign: 'left', overflow: 'linebreak' },
      3: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72], cellWidth: colWidthAmount },
    },
    didParseCell: (data) => {
      // Highlight the Summary Row (row index 3)
      if (data.section === 'body' && data.row.index === 3) {
        data.cell.styles.fontStyle = 'bold';
        if (data.column.index === 0 || data.column.index === 1) {
          data.cell.styles.fillColor = [236, 253, 245];
          data.cell.styles.textColor = [6, 78, 59];
        } else {
          data.cell.styles.fillColor = [255, 241, 242];
          data.cell.styles.textColor = [159, 18, 57];
        }
      }
    },
    margin: { left: marginX, right: marginX },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 12;

  // Net Pay Box (with dynamic height calculation based on Indian words wrapping and exact padding)
  const wordsText = `Amount in Words: ${numberToIndianWords(salary.netSalary)}`;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.8);
  const splitWords = doc.splitTextToSize(wordsText, contentWidth - 28);
  const netBoxHeight = 36 + splitWords.length * 10;

  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1.2);
  doc.roundedRect(marginX, currentY, contentWidth, netBoxHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(6, 78, 59);
  doc.text('NET SALARY DISBURSED (A - B):', marginX + 12, currentY + 16);

  doc.setFontSize(12);
  doc.setTextColor(5, 150, 105);
  doc.text(`Rs. ${salary.netSalary.toLocaleString('en-IN')}`, pageWidth - marginX - 12, currentY + 16, { align: 'right' });

  // Divider Line inside Net Box
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.5);
  doc.line(marginX + 12, currentY + 23, pageWidth - marginX - 12, currentY + 23);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);
  doc.text(splitWords, marginX + 12, currentY + 34);

  currentY += netBoxHeight + 12;

  // Bank & Disbursal Details with bounded text wrapping
  const bankParts: string[] = [];
  if (employee?.bankDetails?.bankName) bankParts.push(`Bank: ${employee.bankDetails.bankName}`);
  if (employee?.bankDetails?.accountNumber) bankParts.push(`A/C: ${employee.bankDetails.accountNumber}`);
  if (employee?.bankDetails?.ifscCode) bankParts.push(`IFSC: ${employee.bankDetails.ifscCode}`);
  if (employee?.bankDetails?.upiId) bankParts.push(`UPI ID: ${employee.bankDetails.upiId}`);
  if (salary.paymentMode) bankParts.push(`Payment Mode: ${salary.paymentMode}`);

  const bankDetailsStr = bankParts.length > 0
    ? `Disbursal Account Details: ${bankParts.join('  |  ')}`
    : `Payment Status: ${salary.status}  |  Payment Mode: ${salary.paymentMode || 'Cash / Bank'}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const splitBank = doc.splitTextToSize(bankDetailsStr, contentWidth - 24);
  const bankBoxHeight = 16 + splitBank.length * 10;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.75);
  doc.roundedRect(marginX, currentY, contentWidth, bankBoxHeight, 4, 4, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.text(splitBank, marginX + 12, currentY + 12);
  currentY += bankBoxHeight + 14;

  // Signatures (Calculated with equal width and centered labels, safely bounded above the footer)
  const sigY = Math.max(currentY + 24, pageHeight - 96);
  const sigWidth = 150;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.75);

  // Left signature (Employee)
  doc.line(marginX + 12, sigY, marginX + 12 + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Employee Signature', marginX + 12 + sigWidth / 2, sigY + 13, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(salary.employeeName, marginX + 12 + sigWidth / 2, sigY + 23, { align: 'center', maxWidth: sigWidth });

  // Right signature (Authorized Signatory)
  doc.line(pageWidth - marginX - 12 - sigWidth, sigY, pageWidth - marginX - 12, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Authorized Signatory', pageWidth - marginX - 12 - sigWidth / 2, sigY + 13, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`For ${profile.name || 'Patil Biryani'}`, pageWidth - marginX - 12 - sigWidth / 2, sigY + 23, { align: 'center', maxWidth: sigWidth });

  // Footer Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a system-generated salary slip from Patil Biryani Financial Management & POS System.',
    pageWidth / 2,
    pageHeight - 24,
    { align: 'center' }
  );

  return doc;
}

/**
 * Utility to silently print a jsPDF document via isolated iframe or browser dialog with clean download fallback
 */
export function printJsPdfDoc(doc: jsPDF, filename: string) {
  try {
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          doc.save(filename);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        }
      }, 350);
    };
  } catch (e) {
    console.warn('Iframe print failed, falling back to direct save:', e);
    doc.save(filename);
  }
}

/**
 * Trigger immediate download of Salary Slip PDF
 */
export function downloadSalarySlipPDF(
  salary: SalaryCalculation,
  employee: StaffEmployee | undefined,
  profile: BusinessProfile
) {
  const doc = generateSalarySlipPDF(salary, employee, profile);
  const cleanName = salary.employeeName.replace(/\s+/g, '_');
  const filename = `SalarySlip_${cleanName}_${salary.month}.pdf`;
  doc.save(filename);
}

/**
 * Print Salary Slip directly via isolated PDF iframe with download fallback
 */
export function printSalarySlipPDF(
  salary: SalaryCalculation,
  employee: StaffEmployee | undefined,
  profile: BusinessProfile
) {
  const doc = generateSalarySlipPDF(salary, employee, profile);
  const cleanName = salary.employeeName.replace(/\s+/g, '_');
  const filename = `SalarySlip_${cleanName}_${salary.month}.pdf`;
  printJsPdfDoc(doc, filename);
}

/**
 * Share Salary Slip PDF via Web Share API or Clipboard
 */
export async function shareSalarySlipPDF(
  salary: SalaryCalculation,
  employee: StaffEmployee | undefined,
  profile: BusinessProfile
) {
  const doc = generateSalarySlipPDF(salary, employee, profile);
  const cleanName = salary.employeeName.replace(/\s+/g, '_');
  const filename = `SalarySlip_${cleanName}_${salary.month}.pdf`;

  if (navigator.share && navigator.canShare) {
    const blob = doc.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Salary Slip - ${salary.employeeName} (${salary.month})`,
          text: `Salary Slip for ${salary.employeeName} for the month of ${salary.month} from Patil Biryani. Net Payable: Rs. ${salary.netSalary}`,
        });
        return true;
      } catch (e) {
        if ((e as Error).name !== 'AbortError') console.warn('Share error:', e);
      }
    }
  }

  // Fallback: download
  doc.save(filename);
  return 'downloaded';
}

/**
 * Helper to safely render multi-line text with guaranteed line-by-line Y advancement and proper baseline offsets
 */
function renderSafeMultiLineText(
  doc: jsPDF,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  options?: { align?: 'left' | 'center' | 'right' | 'justify' }
): number {
  if (!text || !text.trim()) return startY;
  const sanitized = text.replace(/₹/g, 'Rs. ').trim();
  const lines = doc.splitTextToSize(sanitized, Math.max(maxWidth, 20));
  const baselineOffset = lineHeight * 0.75;
  lines.forEach((line: string, idx: number) => {
    doc.text(line, x, startY + baselineOffset + idx * lineHeight, options);
  });
  return startY + lines.length * lineHeight;
}

/**
 * Helper to render high-contrast dashed or solid divider lines for thermal receipts with guaranteed pre/post padding
 */
function renderThermalDivider(
  doc: jsPDF,
  x1: number,
  x2: number,
  y: number,
  isDouble: boolean = false,
  isDashed: boolean = true
): number {
  const topPadding = isDouble ? 5.0 : 4.0;
  const lineY = y + topPadding;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.65);

  if (isDashed && typeof (doc as any).setLineDashPattern === 'function') {
    (doc as any).setLineDashPattern([2.2, 1.6], 0);
    doc.line(x1, lineY, x2, lineY);
    if (isDouble) {
      doc.line(x1, lineY + 2.8, x2, lineY + 2.8);
    }
    (doc as any).setLineDashPattern([], 0);
  } else {
    doc.line(x1, lineY, x2, lineY);
    if (isDouble) {
      doc.line(x1, lineY + 2.8, x2, lineY + 2.8);
    }
  }

  const bottomPadding = isDouble ? 5.5 : 4.5;
  return lineY + (isDouble ? 2.8 : 0) + bottomPadding;
}

/**
 * Helper to render two columns of key/value text on thermal or desktop receipts without horizontal or vertical line collision
 */
function renderSafeTwoColRow(
  doc: jsPDF,
  leftLabel: string,
  leftVal: string,
  rightLabel: string,
  rightVal: string,
  startY: number,
  contentWidth: number,
  startX: number,
  lineHeight: number,
  fontSize: number,
  leftRatio: number = 0.55
): number {
  doc.setFontSize(fontSize);
  const gutter = 4;
  const availableWidth = contentWidth - gutter;
  const leftWidth = Math.max(availableWidth * leftRatio, 20);
  const rightWidth = Math.max(availableWidth * (1 - leftRatio), 20);

  const leftCombined = `${leftLabel ? leftLabel + ' ' : ''}${leftVal}`.replace(/₹/g, 'Rs. ').trim();
  const rightCombined = `${rightLabel ? rightLabel + ' ' : ''}${rightVal}`.replace(/₹/g, 'Rs. ').trim();

  const leftLines = leftCombined ? doc.splitTextToSize(leftCombined, leftWidth) : [];
  const rightLines = rightCombined ? doc.splitTextToSize(rightCombined, rightWidth) : [];

  const baselineOffset = lineHeight * 0.78;

  leftLines.forEach((line: string, idx: number) => {
    doc.text(line, startX, startY + baselineOffset + idx * lineHeight);
  });

  rightLines.forEach((line: string, idx: number) => {
    doc.text(line, startX + contentWidth, startY + baselineOffset + idx * lineHeight, { align: 'right' });
  });

  const maxLines = Math.max(leftLines.length, rightLines.length, 1);
  return startY + maxLines * lineHeight + 1.5;
}

/**
 * Generate invoice receipt in pristine, redesigned PDF format adapting to selected Paper Size (80mm, 58mm, A4, A5)
 * with pixel-perfect alignment, itemized tax breakdowns, UPI QR code, and formal Indian currency in words.
 *
 * Fully respects GST Exemption: If invoice tax is 0 or GST is exempted, all GST tax rows/columns are omitted.
 */
export function generateInvoicePDF(
  invoice: Invoice,
  profile: BusinessProfile,
  qrDataUrl?: string
): jsPDF {
  const paperSize = profile.pdfPaperSize || 'thermal-80mm';
  const templateVersion = profile.pdfTemplateVersion || 'modern';
  const dateFormat = profile.dateFormat || 'DD/MM/YYYY';
  const timeFormat = profile.timeFormat || '12-hour';

  // Determine whether GST is applied or exempted
  const isGstExempt = (invoice.isGstExempt === true) || (invoice.tax === 0) || (profile.pdfShowGst === false);

  let orientation: 'portrait' | 'landscape' = 'portrait';
  let isThermal = true;
  let format: [number, number] | string = [226.77, 400];

  const showLogo = profile.pdfShowLogo !== false && Boolean(profile.logoUrl && profile.logoUrl.startsWith('data:image'));
  const showQr = profile.pdfShowUpiQr !== false && (profile.pdfUpiId || qrDataUrl);

  // Dynamic canvas height calculation for continuous thermal receipts tailored to actual contents
  if (paperSize === 'thermal-58mm') {
    isThermal = true;
    let h = 16; // top margin
    if (showLogo) h += 36;
    h += 24; // Name
    if (profile.subtitle) h += 16;
    if (profile.pdfShowAddress !== false) h += 36;
    if (profile.pdfShowGst !== false && (profile.gstNumber || profile.fssaiNumber)) h += 20;
    h += 14; // divider
    h += 48; // Meta (Bill, Date, Table, Time, Type, Server)
    if (profile.pdfShowCustomer !== false && invoice.customerName && invoice.customerName !== 'Walk-in Customer') {
      h += 24;
    }
    h += 14; // divider
    h += 22; // Table header
    invoice.items.forEach((it) => {
      const nameLen = (it.productName || '').length;
      const lines = Math.max(1, Math.ceil(nameLen / 13));
      h += lines * 12 + 6;
    });
    h += 14; // divider
    h += 16; // Subtotal
    if (invoice.discount > 0) h += 16;
    if (!isGstExempt && invoice.tax > 0) h += 16;
    h += 18; // double divider
    h += 28; // Grand total text
    h += 18; // double divider
    h += 28; // Words (can be 2 lines)
    h += 14; // divider
    h += 32; // Payment mode & status & due
    if (showQr) h += 78;
    if (profile.pdfTermsNote) h += 26;
    h += 14; // divider
    h += 24; // Footer greeting
    h += 30; // bottom safety buffer
    format = [164.41, Math.max(340, Math.ceil(h))];
  } else if (paperSize === 'thermal-80mm') {
    isThermal = true;
    let h = 18; // top margin
    if (showLogo) h += 46;
    h += 26; // Name
    if (profile.subtitle) h += 18;
    if (profile.pdfShowAddress !== false) h += 38;
    if (profile.pdfShowGst !== false && (profile.gstNumber || profile.fssaiNumber)) h += 22;
    h += 14; // divider
    h += 52; // Meta (Bill, Date, Table, Time, Type, Server)
    if (profile.pdfShowCustomer !== false && invoice.customerName && invoice.customerName !== 'Walk-in Customer') {
      h += 26;
    }
    h += 14; // divider
    h += 24; // Table header
    invoice.items.forEach((it) => {
      const nameLen = (it.productName || '').length;
      const lines = Math.max(1, Math.ceil(nameLen / 18));
      h += lines * 14 + 6;
    });
    h += 14; // divider
    h += 18; // Subtotal
    if (invoice.discount > 0) h += 18;
    if (!isGstExempt && invoice.tax > 0) h += 18;
    h += 18; // double divider
    h += 32; // Grand total text
    h += 18; // double divider
    h += 28; // Words
    h += 14; // divider
    h += 36; // Payment mode & status & due
    if (showQr) h += 88;
    if (profile.pdfTermsNote) h += 28;
    h += 14; // divider
    h += 28; // Footer greeting
    h += 34; // bottom safety buffer
    format = [226.77, Math.max(400, Math.ceil(h))];
  } else if (paperSize === 'a4') {
    format = 'a4';
    isThermal = false;
  } else if (paperSize === 'a5') {
    format = 'a5';
    isThermal = false;
  }

  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const is58 = paperSize === 'thermal-58mm';
  const isA5 = paperSize === 'a5';
  const marginX = isThermal ? (is58 ? 6 : 10) : (isA5 ? 24 : 32);
  const contentWidth = pageWidth - marginX * 2;
  let currentY = isThermal ? 10 : (isA5 ? 20 : 24);

  // Theme styling constants
  const isClassic = templateVersion === 'classic-thermal' || isThermal;
  const isGstTax = templateVersion === 'gst-tax';
  const isMinimal = templateVersion === 'minimal';

  // Primary Accent Colors
  const primaryColor: [number, number, number] = isClassic
    ? [0, 0, 0]
    : isGstTax
    ? [15, 23, 42] // Slate 900
    : isMinimal
    ? [51, 65, 85] // Slate 700
    : [16, 185, 129]; // Emerald 500

  // Clean White Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer border for A4 / A5
  if (!isThermal) {
    doc.setDrawColor(isClassic ? 0 : 226, isClassic ? 0 : 232, isClassic ? 0 : 240);
    doc.setLineWidth(isClassic ? 1.2 : 0.8);
    const borderInset = isA5 ? 12 : 16;
    doc.roundedRect(borderInset, borderInset, pageWidth - borderInset * 2, pageHeight - borderInset * 2, isClassic ? 0 : 6, isClassic ? 0 : 6, 'D');
  }

  // Header Title & Branding & Logo Handling
  if (isThermal) {
    // Thermal Center-Aligned Branding with High Contrast
    if (showLogo) {
      try {
        const logoW = is58 ? 26 : 32;
        const logoH = is58 ? 26 : 32;
        const logoX = (pageWidth - logoW) / 2;
        doc.addImage(profile.logoUrl!, 'PNG', logoX, currentY, logoW, logoH, undefined, 'FAST');
        currentY += logoH + 3;
      } catch (e) {
        console.warn('PDF Logo render warning:', e);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(is58 ? 10.5 : 12.5);
    doc.setTextColor(0, 0, 0);
    currentY = renderSafeMultiLineText(
      doc,
      (profile.name || 'PATIL BIRYANI').toUpperCase(),
      pageWidth / 2,
      currentY + 2,
      contentWidth,
      is58 ? 12 : 14,
      { align: 'center' }
    );
    currentY += 1.5;

    if (profile.subtitle) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(is58 ? 6.5 : 7.5);
      doc.setTextColor(0, 0, 0);
      currentY = renderSafeMultiLineText(
        doc,
        profile.subtitle,
        pageWidth / 2,
        currentY,
        contentWidth,
        is58 ? 8 : 9,
        { align: 'center' }
      );
      currentY += 1.5;
    }

    if (profile.pdfShowAddress !== false) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(is58 ? 6.2 : 7.0);
      doc.setTextColor(0, 0, 0);
      const addr = formatFullAddress({
        addressLine1: profile.addressLine1 || 'Main Road',
        addressLine2: profile.addressLine2,
        landmark: profile.landmark || profile.area,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        pinCode: profile.pinCode,
      }) || `${profile.addressLine1 || 'Main Road'}${profile.city ? `, ${profile.city}` : ''}${profile.pinCode ? ` - ${profile.pinCode}` : ''}`;
      currentY = renderSafeMultiLineText(
        doc,
        addr,
        pageWidth / 2,
        currentY,
        contentWidth,
        is58 ? 7.5 : 8.5,
        { align: 'center' }
      );
      currentY += 1;

      const phone = `Mob: ${profile.mobile || 'N/A'}${profile.altMobile ? ` | ${profile.altMobile}` : ''}`;
      currentY = renderSafeMultiLineText(
        doc,
        phone,
        pageWidth / 2,
        currentY,
        contentWidth,
        is58 ? 7.5 : 8.5,
        { align: 'center' }
      );
      currentY += 1.5;
    }

    // Display GSTIN / FSSAI in Header if enabled and present
    if (profile.pdfShowGst !== false && (profile.gstNumber || profile.fssaiNumber)) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(is58 ? 6.0 : 6.8);
      doc.setTextColor(0, 0, 0);
      const taxLine = [
        profile.gstNumber ? `GSTIN: ${profile.gstNumber}` : '',
        profile.fssaiNumber ? `FSSAI Lic: ${profile.fssaiNumber}` : '',
      ].filter(Boolean).join(' | ');
      currentY = renderSafeMultiLineText(
        doc,
        taxLine,
        pageWidth / 2,
        currentY,
        contentWidth,
        is58 ? 7.2 : 8.0,
        { align: 'center' }
      );
      currentY += 2;
    }
  } else {
    // A4 / A5 Modern Header with balanced side-by-side logo and business details
    const headerStartY = currentY;
    const logoSize = isA5 ? 38 : 46;
    let headerLeftX = marginX;

    if (showLogo) {
      try {
        doc.addImage(profile.logoUrl!, 'PNG', marginX, headerStartY, logoSize, logoSize, undefined, 'FAST');
        headerLeftX = marginX + logoSize + (isA5 ? 10 : 14);
      } catch (e) {
        console.warn('PDF Logo render warning:', e);
      }
    }

    const badgeWidth = isA5 ? 116 : 140;
    const headerAvailableWidth = Math.max(pageWidth - marginX - badgeWidth - 14 - headerLeftX, isA5 ? 180 : 250);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isA5 ? 13 : 15);
    doc.setTextColor(15, 23, 42);
    let leftY = renderSafeMultiLineText(
      doc,
      profile.name || 'PATIL BIRYANI',
      headerLeftX,
      headerStartY + (isA5 ? 9 : 11),
      headerAvailableWidth,
      isA5 ? 14 : 16
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(isA5 ? 7.2 : 8.0);
    doc.setTextColor(100, 116, 139);
    const addr = formatFullAddress({
      addressLine1: profile.addressLine1 || 'Main Road',
      addressLine2: profile.addressLine2,
      landmark: profile.landmark || profile.area,
      city: profile.city || 'Kolhapur',
      state: profile.state || 'Maharashtra',
      country: profile.country,
      pinCode: profile.pinCode || '416001',
    }) || `${profile.addressLine1 || 'Main Road'}, ${profile.city || 'Kolhapur'}, ${profile.state || 'Maharashtra'} - ${profile.pinCode || '416001'}`;
    leftY = renderSafeMultiLineText(doc, addr, headerLeftX, leftY + 2, headerAvailableWidth, isA5 ? 9 : 10);

    const contactStr = `Phone: ${profile.mobile || 'N/A'}${profile.pdfShowGst !== false && profile.gstNumber ? ` | GSTIN: ${profile.gstNumber}` : ''}${profile.fssaiNumber ? ` | FSSAI: ${profile.fssaiNumber}` : ''}`;
    leftY = renderSafeMultiLineText(doc, contactStr, headerLeftX, leftY + 2, headerAvailableWidth, isA5 ? 9 : 10);

    // Right Side: Tax Invoice / Bill of Supply Badge
    const badgeTitle = isGstExempt
      ? 'BILL OF SUPPLY'
      : isGstTax
      ? 'GST TAX INVOICE'
      : 'TAX INVOICE';

    doc.setFillColor(...primaryColor);
    doc.roundedRect(pageWidth - marginX - badgeWidth, headerStartY, badgeWidth, 22, isClassic ? 0 : 4, isClassic ? 0 : 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isA5 ? 8.0 : 8.8);
    doc.setTextColor(255, 255, 255);
    doc.text(badgeTitle, pageWidth - marginX - badgeWidth / 2, headerStartY + 14, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isA5 ? 8.0 : 9.0);
    doc.setTextColor(15, 23, 42);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - marginX, headerStartY + 35, { align: 'right' });

    const logoBottom = showLogo ? headerStartY + logoSize : headerStartY;
    currentY = Math.max(leftY + 6, logoBottom + 6, headerStartY + 42);
  }

  // Divider Line
  if (isThermal) {
    currentY = renderThermalDivider(doc, marginX, pageWidth - marginX, currentY, false, true);
  } else {
    doc.setDrawColor(isClassic ? 0 : 203, isClassic ? 0 : 213, isClassic ? 0 : 225);
    doc.setLineWidth(isClassic ? 1.0 : 0.75);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 10;
  }

  // Metadata Grid (Date, Time, Bill No, Table, Order Type, Customer)
  const formattedDate = formatDateDisplay(invoice.date, dateFormat);
  const formattedTime = formatTimeWithPattern(invoice.time, timeFormat);

  if (isThermal) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    const metaFontSize = is58 ? 6.2 : 7.0;
    const metaLineHeight = is58 ? 7.5 : 8.8;

    // Row 1: Bill No (Left) & Date (Right)
    currentY = renderSafeTwoColRow(
      doc,
      'BILL NO:',
      invoice.invoiceNumber,
      'DATE:',
      formattedDate,
      currentY,
      contentWidth,
      marginX,
      metaLineHeight,
      metaFontSize,
      0.55
    );

    // Row 2: Table (Left) & Time (Right)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    currentY = renderSafeTwoColRow(
      doc,
      'TABLE:',
      invoice.tableNumber,
      'TIME:',
      formattedTime,
      currentY,
      contentWidth,
      marginX,
      metaLineHeight,
      metaFontSize,
      0.55
    );

    // Row 3: Order Type (Left) & Server (Right)
    if (invoice.orderType || invoice.staffWaiter) {
      currentY = renderSafeTwoColRow(
        doc,
        'TYPE:',
        invoice.orderType || 'Dine In',
        invoice.staffWaiter ? 'SERVER:' : '',
        invoice.staffWaiter || '',
        currentY,
        contentWidth,
        marginX,
        metaLineHeight,
        metaFontSize,
        0.55
      );
    }

    // Row 4: Customer Details
    if (
      profile.pdfShowCustomer !== false &&
      invoice.customerName &&
      invoice.customerName !== 'Walk-in Customer'
    ) {
      currentY = renderSafeTwoColRow(
        doc,
        'CUST:',
        invoice.customerName,
        invoice.customerMobile ? 'MOB:' : '',
        invoice.customerMobile || '',
        currentY,
        contentWidth,
        marginX,
        metaLineHeight,
        metaFontSize,
        0.60
      );
    }

    // Divider before table
    currentY = renderThermalDivider(doc, marginX, pageWidth - marginX, currentY + 1, false, true);
  } else {
    // A4 / A5 Two-Column Billed-To and Invoice Meta Details with dynamic text heights
    const metaColWidth = (contentWidth - 14) / 2;

    const custName = invoice.customerName || 'Walk-in Customer';
    const custContact = invoice.customerMobile ? `Contact: ${invoice.customerMobile}` : 'Direct Counter Sale';
    const dateLine = `Date: ${formattedDate}  |  Time: ${formattedTime}`;
    const orderLine = `Table: ${invoice.tableNumber}  |  Type: ${invoice.orderType || 'Dine In'}${invoice.staffWaiter ? `  |  Staff: ${invoice.staffWaiter}` : ''}`;

    doc.setFontSize(8);
    const splitCustName = doc.splitTextToSize(custName, metaColWidth - 16);
    const splitCustContact = doc.splitTextToSize(custContact, metaColWidth - 16);
    const splitDateLine = doc.splitTextToSize(dateLine, metaColWidth - 16);
    const splitOrderLine = doc.splitTextToSize(orderLine, metaColWidth - 16);

    const leftBoxHeight = Math.max(48, 20 + splitCustName.length * 10 + splitCustContact.length * 9);
    const rightBoxHeight = Math.max(48, 20 + splitDateLine.length * 10 + splitOrderLine.length * 9);
    const maxBoxHeight = Math.max(leftBoxHeight, rightBoxHeight);

    // Customer / Billed To Box
    doc.setFillColor(isClassic ? 255 : 248, isClassic ? 255 : 250, isClassic ? 255 : 252);
    doc.setDrawColor(isClassic ? 0 : 226, isClassic ? 0 : 232, isClassic ? 0 : 240);
    doc.setLineWidth(0.75);
    doc.roundedRect(marginX, currentY, metaColWidth, maxBoxHeight, isClassic ? 0 : 4, isClassic ? 0 : 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(isClassic ? 0 : 71, isClassic ? 0 : 85, isClassic ? 0 : 105);
    doc.text('BILLED TO (CUSTOMER):', marginX + 8, currentY + 12);

    doc.setFontSize(8.8);
    doc.setTextColor(15, 23, 42);
    let custY = renderSafeMultiLineText(doc, custName, marginX + 8, currentY + 24, metaColWidth - 16, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(100, 116, 139);
    renderSafeMultiLineText(doc, custContact, marginX + 8, custY + 2, metaColWidth - 16, 9.5);

    // Order & Table Details Box
    const rightBoxX = marginX + metaColWidth + 14;
    doc.setFillColor(isClassic ? 255 : 248, isClassic ? 255 : 250, isClassic ? 255 : 252);
    doc.setDrawColor(isClassic ? 0 : 226, isClassic ? 0 : 232, isClassic ? 0 : 240);
    doc.roundedRect(rightBoxX, currentY, metaColWidth, maxBoxHeight, isClassic ? 0 : 4, isClassic ? 0 : 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(isClassic ? 0 : 71, isClassic ? 0 : 85, isClassic ? 0 : 105);
    doc.text('ORDER & BILLING INFO:', rightBoxX + 8, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(30, 41, 59);
    let orderY = renderSafeMultiLineText(doc, dateLine, rightBoxX + 8, currentY + 24, metaColWidth - 16, 10);
    renderSafeMultiLineText(doc, orderLine, rightBoxX + 8, orderY + 2, metaColWidth - 16, 9.5);

    currentY += maxBoxHeight + 8;
  }

  // Items Table Configuration with non-garbled currency headers and exact proportions
  let tableHead: string[][];
  let tableBody: string[][];
  let activeColStyles: Record<number, any>;

  if (isThermal) {
    tableHead = is58
      ? [['Item Description', 'Qty', 'Rate', 'Amount']]
      : [['Item Description', 'Qty', 'Rate', 'Amount']];

    tableBody = invoice.items.map((it) => [
      it.productName,
      `${it.quantity}`,
      it.rate.toFixed(2),
      (it.quantity * it.rate).toFixed(2),
    ]);

    activeColStyles = is58
      ? {
          0: { cellWidth: contentWidth * 0.46, halign: 'left', overflow: 'linebreak' },
          1: { cellWidth: contentWidth * 0.14, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: contentWidth * 0.20, halign: 'right' },
          3: { cellWidth: contentWidth * 0.20, halign: 'right', fontStyle: 'bold' },
        }
      : {
          0: { cellWidth: contentWidth * 0.50, halign: 'left', overflow: 'linebreak' },
          1: { cellWidth: contentWidth * 0.14, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: contentWidth * 0.18, halign: 'right' },
          3: { cellWidth: contentWidth * 0.18, halign: 'right', fontStyle: 'bold' },
        };
  } else if (isGstTax) {
    // Official GST Tax Invoice Table with word-cut proof proportions
    if (isGstExempt) {
      tableHead = [['#', 'Item Description', 'HSN', 'Qty', 'Rate (Rs.)', 'Taxable (Rs.)', 'GST', 'Total (Rs.)']];
      tableBody = invoice.items.map((it, idx) => {
        const taxable = it.quantity * it.rate;
        return [
          `${idx + 1}`,
          it.productName,
          '996331',
          `${it.quantity}`,
          it.rate.toFixed(2),
          taxable.toFixed(2),
          '0%',
          taxable.toFixed(2),
        ];
      });
    } else {
      tableHead = [['#', 'Item Description', 'HSN', 'Qty', 'Rate (Rs.)', 'Taxable (Rs.)', 'GST', 'Total (Rs.)']];
      tableBody = invoice.items.map((it, idx) => {
        const taxable = it.quantity * it.rate;
        const itemTax = it.tax || (taxable * 0.05);
        const itemRate = taxable > 0 ? Math.round((itemTax / taxable) * 100) : 5;
        const total = taxable + itemTax;
        return [
          `${idx + 1}`,
          it.productName,
          '996331',
          `${it.quantity}`,
          it.rate.toFixed(2),
          taxable.toFixed(2),
          `${itemRate}%`,
          total.toFixed(2),
        ];
      });
    }

    activeColStyles = {
      0: { cellWidth: contentWidth * 0.05, halign: 'center' },
      1: { cellWidth: contentWidth * 0.36, halign: 'left', overflow: 'linebreak' },
      2: { cellWidth: contentWidth * 0.09, halign: 'center' },
      3: { cellWidth: contentWidth * 0.07, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: contentWidth * 0.10, halign: 'right' },
      5: { cellWidth: contentWidth * 0.11, halign: 'right' },
      6: { cellWidth: contentWidth * 0.09, halign: 'center' },
      7: { cellWidth: contentWidth * 0.13, halign: 'right', fontStyle: 'bold' },
    };
  } else {
    // Modern / Minimalist A4 & A5 Table
    if (isGstExempt) {
      // Clean table without GST column when GST is exempted
      tableHead = [['#', 'Item Description', 'Qty', 'Rate (Rs.)', 'Amount (Rs.)']];
      tableBody = invoice.items.map((it, idx) => [
        `${idx + 1}`,
        it.productName,
        `${it.quantity}`,
        it.rate.toFixed(2),
        (it.quantity * it.rate).toFixed(2),
      ]);

      activeColStyles = {
        0: { cellWidth: contentWidth * 0.06, halign: 'center' },
        1: { cellWidth: contentWidth * 0.52, halign: 'left', overflow: 'linebreak' },
        2: { cellWidth: contentWidth * 0.10, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: contentWidth * 0.15, halign: 'right' },
        4: { cellWidth: contentWidth * 0.17, halign: 'right', fontStyle: 'bold' },
      };
    } else {
      // Table with GST rate column
      tableHead = [['#', 'Item Description', 'Qty', 'Rate (Rs.)', 'GST', 'Amount (Rs.)']];
      tableBody = invoice.items.map((it, idx) => [
        `${idx + 1}`,
        it.productName,
        `${it.quantity}`,
        it.rate.toFixed(2),
        '5%',
        (it.quantity * it.rate).toFixed(2),
      ]);

      activeColStyles = {
        0: { cellWidth: contentWidth * 0.06, halign: 'center' },
        1: { cellWidth: contentWidth * 0.44, halign: 'left', overflow: 'linebreak' },
        2: { cellWidth: contentWidth * 0.10, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: contentWidth * 0.13, halign: 'right' },
        4: { cellWidth: contentWidth * 0.11, halign: 'center' },
        5: { cellWidth: contentWidth * 0.16, halign: 'right', fontStyle: 'bold' },
      };
    }
  }

  const tableFontSize = isThermal ? (is58 ? 6.2 : 7.2) : (isA5 ? 7.2 : 8.0);
  const tableHeadFontSize = isThermal ? (is58 ? 6.5 : 7.5) : (isA5 ? 7.5 : 8.2);
  const cellPadding = isThermal ? (is58 ? 1.6 : 2.2) : (isA5 ? 3.0 : 4.0);

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: isThermal ? 'plain' : isClassic ? 'plain' : 'striped',
    tableWidth: contentWidth,
    styles: {
      fontSize: tableFontSize,
      cellPadding: cellPadding,
      textColor: isThermal ? [0, 0, 0] : isClassic ? [0, 0, 0] : [30, 41, 59],
      overflow: 'linebreak',
      valign: 'middle',
      minCellHeight: isThermal ? (is58 ? 10 : 12) : (isA5 ? 13 : 15),
    },
    headStyles: {
      fillColor: isThermal ? [255, 255, 255] : isClassic ? [255, 255, 255] : primaryColor,
      textColor: isThermal ? [0, 0, 0] : isClassic ? [0, 0, 0] : [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: tableHeadFontSize,
      cellPadding: cellPadding,
      overflow: 'linebreak',
    },
    bodyStyles: {
      overflow: 'linebreak',
    },
    columnStyles: activeColStyles,
    margin: { left: marginX, right: marginX, top: isThermal ? 0 : 20, bottom: isThermal ? 2 : 24 },
    horizontalPageBreak: false,
    didParseCell: (data) => {
      if (data.section === 'head') {
        const styles = activeColStyles[data.column.index];
        if (styles?.halign) {
          data.cell.styles.halign = styles.halign;
        }
      }
    },
  });

  // @ts-ignore
  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 3 : currentY + 30;

  // Divider Line below Table
  if (isThermal) {
    currentY = renderThermalDivider(doc, marginX, pageWidth - marginX, currentY, false, true);
  } else {
    doc.setDrawColor(isClassic ? 0 : 203, isClassic ? 0 : 213, isClassic ? 0 : 225);
    doc.setLineWidth(isClassic ? 1.0 : 0.75);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 8;
  }

  // Totals & Financial Calculations with non-clipping width calculations
  const totalBoxWidth = isThermal ? contentWidth : (isA5 ? 200 : 230);
  const drawTotalLine = (
    label: string,
    value: string,
    isBold: boolean = false,
    textColor: [number, number, number] = isThermal ? [0, 0, 0] : isClassic ? [0, 0, 0] : [51, 65, 85]
  ) => {
    const lineHeight = isThermal ? (is58 ? 8.5 : 9.8) : 12;
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isThermal ? (is58 ? 6.5 : 7.5) : (isA5 ? 7.8 : 8.5));
    doc.setTextColor(...textColor);

    const labelX = isThermal ? marginX : pageWidth - marginX - totalBoxWidth;
    const baselineY = currentY + lineHeight * 0.76;
    doc.text(label, labelX, baselineY);
    doc.text(value, pageWidth - marginX, baselineY, { align: 'right' });
    currentY += lineHeight + (isThermal ? 1.0 : 2.0);
  };

  drawTotalLine('Item Subtotal:', `Rs. ${invoice.subtotal.toFixed(2)}`);

  if (invoice.discount > 0) {
    drawTotalLine('Special Discount:', `- Rs. ${invoice.discount.toFixed(2)}`, false, isThermal ? [0, 0, 0] : isClassic ? [0, 0, 0] : [225, 29, 72]);
  }

  // GST Breakdown - STRICTLY conditional on isGstExempt & tax > 0
  if (!isGstExempt && invoice.tax > 0) {
    const halfGst = (invoice.tax || 0) / 2;
    if (!isThermal) {
      drawTotalLine('CGST (2.5%):', `Rs. ${halfGst.toFixed(2)}`);
      drawTotalLine('SGST (2.5%):', `Rs. ${halfGst.toFixed(2)}`);
    } else {
      drawTotalLine('GST (5%):', `Rs. ${invoice.tax.toFixed(2)}`);
    }
  }

  // Grand Total Highlight Box
  if (isThermal) {
    // Thermal Universal Grand Total Double Line & High-Contrast Banner
    currentY = renderThermalDivider(doc, marginX, pageWidth - marginX, currentY, true, true);
    
    const grandLineHeight = is58 ? 12 : 14;
    const grandBaselineY = currentY + grandLineHeight * 0.76;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(is58 ? 8.2 : 9.8);
    doc.setTextColor(0, 0, 0);
    doc.text('GRAND TOTAL:', marginX, grandBaselineY);

    doc.setFontSize(is58 ? 10.0 : 12.0);
    doc.text(`Rs. ${invoice.grandTotal.toFixed(2)}`, pageWidth - marginX, grandBaselineY, {
      align: 'right',
    });

    currentY += grandLineHeight + 2;
    currentY = renderThermalDivider(doc, marginX, pageWidth - marginX, currentY, true, true);
  } else {
    // A4 / A5 Highlight Box
    const grandBoxHeight = isA5 ? 24 : 28;
    const grandBoxWidth = totalBoxWidth;
    const grandBoxX = pageWidth - marginX - grandBoxWidth;

    if (isClassic) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1.2);
      doc.roundedRect(grandBoxX, currentY, grandBoxWidth, grandBoxHeight, 0, 0, 'FD');
    } else if (isMinimal) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(1);
      doc.roundedRect(grandBoxX, currentY, grandBoxWidth, grandBoxHeight, 4, 4, 'FD');
    } else {
      doc.setFillColor(240, 253, 244); // Emerald 50
      doc.setDrawColor(16, 185, 129); // Emerald 500
      doc.setLineWidth(1);
      doc.roundedRect(grandBoxX, currentY, grandBoxWidth, grandBoxHeight, 4, 4, 'FD');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isA5 ? 9.5 : 10.5);
    doc.setTextColor(isClassic ? 0 : 6, isClassic ? 0 : 78, isClassic ? 0 : 59);
    doc.text('GRAND TOTAL:', grandBoxX + 6, currentY + (isA5 ? 15 : 18));

    doc.setFontSize(isA5 ? 11.5 : 13);
    doc.setTextColor(isClassic ? 0 : 5, isClassic ? 0 : 150, isClassic ? 0 : 105);
    doc.text(`Rs. ${invoice.grandTotal.toFixed(2)}`, grandBoxX + grandBoxWidth - 6, currentY + (isA5 ? 15 : 18), {
      align: 'right',
    });

    currentY += grandBoxHeight + 6;
  }

  // Amount in Words with exact split calculation
  const wordsText = `Words: ${numberToIndianWords(invoice.grandTotal)}`;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(isThermal ? (is58 ? 5.8 : 6.8) : (isA5 ? 7.2 : 7.8));
  doc.setTextColor(isThermal ? 0 : isClassic ? 0 : 100, isThermal ? 0 : isClassic ? 0 : 116, isThermal ? 0 : isClassic ? 0 : 139);
  currentY = renderSafeMultiLineText(
    doc,
    wordsText,
    marginX,
    currentY,
    contentWidth,
    isThermal ? (is58 ? 7.5 : 8.5) : 9.5
  );
  currentY += isThermal ? 2 : 4;

  // Payment Status and Balance Due with dedicated thermal multi-line support
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isThermal ? (is58 ? 6.2 : 7.0) : (isA5 ? 7.5 : 8.0));
  doc.setTextColor(isThermal ? 0 : isClassic ? 0 : 51, isThermal ? 0 : isClassic ? 0 : 65, isThermal ? 0 : isClassic ? 0 : 85);

  if (isThermal) {
    currentY = renderThermalDivider(doc, marginX, pageWidth - marginX, currentY, false, true);

    // Row 1: Mode & Status
    const statusText = invoice.balanceDue > 0 ? `STATUS: PARTIAL` : 'STATUS: PAID IN FULL';
    currentY = renderSafeTwoColRow(
      doc,
      'PAID VIA:',
      invoice.paymentMode.toUpperCase(),
      '',
      statusText,
      currentY,
      contentWidth,
      marginX,
      is58 ? 7.8 : 9.0,
      is58 ? 6.2 : 7.0,
      0.55
    );

    // Row 2: Recd & Due
    const recdText = `Rs. ${invoice.amountPaid.toFixed(2)}`;
    const dueText = invoice.balanceDue > 0 ? `DUE: Rs. ${invoice.balanceDue.toFixed(2)}` : 'DUE: Rs. 0.00';
    currentY = renderSafeTwoColRow(
      doc,
      'AMOUNT RECD:',
      recdText,
      '',
      dueText,
      currentY,
      contentWidth,
      marginX,
      is58 ? 7.8 : 9.0,
      is58 ? 6.2 : 7.0,
      0.55
    );
    currentY += 1.5;
  } else {
    const paymentLeft = `Paid via: ${invoice.paymentMode}  |  Recd: Rs. ${invoice.amountPaid.toFixed(2)}`;
    const paymentRight = invoice.balanceDue > 0
      ? `Due: Rs. ${invoice.balanceDue.toFixed(2)}`
      : 'Status: Paid';

    const payHalfWidth = (contentWidth - 10) / 2;
    const payLeftLines = doc.splitTextToSize(paymentLeft, payHalfWidth);
    const payRightLines = doc.splitTextToSize(paymentRight, payHalfWidth);

    payLeftLines.forEach((l: string, i: number) => {
      doc.text(l, marginX, currentY + i * 10);
    });

    if (invoice.balanceDue > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isClassic ? 0 : 225, isClassic ? 0 : 29, isClassic ? 0 : 72);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isClassic ? 0 : 5, isClassic ? 0 : 150, isClassic ? 0 : 105);
    }

    payRightLines.forEach((l: string, i: number) => {
      doc.text(l, pageWidth - marginX, currentY + i * 10, { align: 'right' });
    });

    currentY += Math.max(payLeftLines.length, payRightLines.length) * 10 + 6;
  }

  // Optional UPI QR Scannable Box
  if (showQr) {
    currentY = isThermal ? renderThermalDivider(doc, marginX, pageWidth - marginX, currentY, false, true) : currentY;

    const upiId = profile.pdfUpiId || 'patilbiryani@upi';
    const qrSize = isThermal ? (is58 ? 28 : 34) : (isA5 ? 36 : 40);
    const qrLeftOffset = qrDataUrl ? qrSize + 10 : 8;
    const qrTextWidth = contentWidth - qrLeftOffset - 8;

    doc.setFontSize(isThermal ? (is58 ? 5.8 : 6.5) : (isA5 ? 7.0 : 7.5));
    const upiLines = doc.splitTextToSize(`UPI ID: ${upiId}`, qrTextWidth);
    const qrBoxHeight = Math.max(qrSize + 8, 24 + upiLines.length * 8);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.6);
    doc.roundedRect(marginX, currentY, contentWidth, qrBoxHeight, isThermal ? 0 : 4, isThermal ? 0 : 4, 'FD');

    // Embed QR image if available
    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', marginX + 4, currentY + 4, qrSize, qrSize, undefined, 'FAST');
      } catch (e) {
        console.warn('QR Code embedding error:', e);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isThermal ? (is58 ? 6.2 : 7.0) : (isA5 ? 7.5 : 8.0));
    doc.setTextColor(0, 0, 0);
    doc.text('SCAN TO PAY VIA UPI', marginX + qrLeftOffset, currentY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(isThermal ? (is58 ? 5.5 : 6.2) : (isA5 ? 6.8 : 7.2));
    doc.setTextColor(0, 0, 0);
    doc.text('GPay • PhonePe • Paytm • BHIM', marginX + qrLeftOffset, currentY + 20);

    doc.setFontSize(isThermal ? (is58 ? 5.5 : 6.2) : (isA5 ? 6.8 : 7.2));
    upiLines.forEach((line: string, i: number) => {
      doc.text(line, marginX + qrLeftOffset, currentY + 28 + i * 8);
    });

    currentY += qrBoxHeight + 6;
  }

  // Terms & Conditions Note with safe line wrap
  if (profile.pdfTermsNote) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(isThermal ? (is58 ? 5.5 : 6.2) : (isA5 ? 6.5 : 7.0));
    doc.setTextColor(0, 0, 0);
    currentY = renderSafeMultiLineText(
      doc,
      profile.pdfTermsNote,
      pageWidth / 2,
      currentY,
      contentWidth,
      is58 ? 7 : 8,
      { align: 'center' }
    );
    currentY += 3;
  }

  // Footer Greeting
  if (isThermal) {
    currentY = renderThermalDivider(doc, marginX, pageWidth - marginX, currentY, false, true);
  }

  const footerGreeting = profile.pdfFooterText || profile.footerNote || '*** THANK YOU! VISIT AGAIN ***';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isThermal ? (is58 ? 6.5 : 7.5) : (isA5 ? 7.5 : 8.0));
  doc.setTextColor(0, 0, 0);
  currentY = renderSafeMultiLineText(
    doc,
    footerGreeting,
    pageWidth / 2,
    currentY,
    contentWidth,
    is58 ? 8 : 9,
    { align: 'center' }
  );

  return doc;
}

/**
 * Download Invoice PDF with automatic UPI QR generation and instant file save
 */
export async function downloadInvoicePDF(invoice: Invoice, profile: BusinessProfile) {
  let qrDataUrl: string | undefined = undefined;
  if (profile.pdfShowUpiQr !== false) {
    const upiId = profile.pdfUpiId || 'patilbiryani@upi';
    const payeeName = encodeURIComponent(profile.name || 'Patil Biryani');
    const qrString = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${invoice.grandTotal}&cu=INR&tn=${invoice.invoiceNumber}`;
    try {
      qrDataUrl = await QRCode.toDataURL(qrString, { width: 120, margin: 1 });
    } catch (e) {
      console.warn('Could not generate UPI QR code:', e);
    }
  }

  const doc = generateInvoicePDF(invoice, profile, qrDataUrl);
  doc.save(`Bill_${invoice.invoiceNumber}.pdf`);
}

/**
 * Print Invoice PDF directly via isolated PDF iframe with download fallback
 */
export async function printInvoicePDF(invoice: Invoice, profile: BusinessProfile) {
  let qrDataUrl: string | undefined = undefined;
  if (profile.pdfShowUpiQr !== false) {
    const upiId = profile.pdfUpiId || 'patilbiryani@upi';
    const payeeName = encodeURIComponent(profile.name || 'Patil Biryani');
    const qrString = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${invoice.grandTotal}&cu=INR&tn=${invoice.invoiceNumber}`;
    try {
      qrDataUrl = await QRCode.toDataURL(qrString, { width: 120, margin: 1 });
    } catch (e) {
      console.warn('Could not generate UPI QR code for print:', e);
    }
  }

  const doc = generateInvoicePDF(invoice, profile, qrDataUrl);
  const filename = `Bill_${invoice.invoiceNumber}.pdf`;
  printJsPdfDoc(doc, filename);
}

/**
 * Share Invoice PDF via Web Share API or download fallback
 */
export async function shareInvoicePDF(invoice: Invoice, profile: BusinessProfile) {
  let qrDataUrl: string | undefined = undefined;
  if (profile.pdfShowUpiQr !== false) {
    const upiId = profile.pdfUpiId || 'patilbiryani@upi';
    const payeeName = encodeURIComponent(profile.name || 'Patil Biryani');
    const qrString = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${invoice.grandTotal}&cu=INR&tn=${invoice.invoiceNumber}`;
    try {
      qrDataUrl = await QRCode.toDataURL(qrString, { width: 120, margin: 1 });
    } catch (e) {
      console.warn('Could not generate UPI QR code for share:', e);
    }
  }

  const doc = generateInvoicePDF(invoice, profile, qrDataUrl);
  const filename = `Bill_${invoice.invoiceNumber}.pdf`;

  if (navigator.share && navigator.canShare) {
    const blob = doc.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Invoice ${invoice.invoiceNumber} - ${profile.name || 'Patil Biryani'}`,
          text: `Invoice #${invoice.invoiceNumber} from Patil Biryani. Grand Total: Rs. ${invoice.grandTotal}`,
        });
        return true;
      } catch (e) {
        if ((e as Error).name !== 'AbortError') console.warn('Share error:', e);
      }
    }
  }

  // Fallback: download
  doc.save(filename);
  return 'downloaded';
}

