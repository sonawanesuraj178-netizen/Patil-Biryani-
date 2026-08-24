import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BusinessProfile, PDFExportOptions, ExcelExportOptions } from '../types';
import { formatINR } from './formatters';

export interface ExportRowData {
  [key: string]: any;
}

/**
 * Safely sanitizes text for standard jsPDF 14-core fonts (helvetica)
 * Replaces Unicode Rupee symbol ₹ (U+20B9) with 'Rs. ' to prevent character corruption and width mismatch.
 */
export function sanitizeTextForPDF(val: any): string {
  if (val === undefined || val === null) return '-';
  const str = String(val);
  return str
    .replace(/₹\s*/g, 'Rs. ')
    .replace(/\u20B9\s*/g, 'Rs. ')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/[^\x00-\x7F]/g, (char) => {
      if (char === '•') return '•';
      return '';
    })
    .trim();
}

export function generateCustomExcel(
  options: ExcelExportOptions,
  rows: ExportRowData[],
  businessProfile: BusinessProfile
) {
  // If selectedColumns is empty, use all keys from the first row
  let activeCols = options.selectedColumns;
  if (!activeCols || activeCols.length === 0) {
    if (rows.length > 0) {
      activeCols = Object.keys(rows[0]);
    } else {
      activeCols = ['Item', 'Amount'];
    }
  }

  // Filter rows based on selected columns
  const filteredRows = rows.map((row) => {
    const newRow: Record<string, any> = {};
    activeCols.forEach((colKey) => {
      if (row[colKey] !== undefined) {
        newRow[colKey] = row[colKey];
      } else {
        newRow[colKey] = '-';
      }
    });
    return newRow;
  });

  const wb = XLSX.utils.book_new();

  // Create Header metadata rows
  const headerData = [
    [businessProfile.name || 'PATIL BIRYANI'],
    [`${businessProfile.addressLine1 || ''}, ${businessProfile.city || ''}, ${businessProfile.state || ''} - ${businessProfile.pinCode || ''}`.trim()],
    [`Contact: ${businessProfile.mobile || 'N/A'}${businessProfile.gstNumber ? ` | GSTIN: ${businessProfile.gstNumber}` : ''}${businessProfile.fssaiNumber ? ` | FSSAI: ${businessProfile.fssaiNumber}` : ''}`],
    [`Report: ${options.sheetName || 'Custom Report'} (${options.dateRangeText || 'All Time'})`],
    [`Generated On: ${new Date().toLocaleString('en-IN')}`],
    [], // Empty line
  ];

  const ws = XLSX.utils.json_to_sheet([]);
  XLSX.utils.sheet_add_aoa(ws, headerData, { origin: 'A1' });
  XLSX.utils.sheet_add_json(ws, filteredRows, { origin: `A${headerData.length + 1}` });

  // Auto-width adjustment based on content
  const colWidths = activeCols.map((colKey) => {
    let maxLen = String(colKey).length;
    filteredRows.forEach((r) => {
      const val = r[colKey];
      if (val !== undefined && val !== null) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });

  ws['!cols'] = colWidths;

  const safeFileName = (options.fileName || 'PatilBiryani_Report').replace(/[/\\?%*:|"<>]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, (options.sheetName || 'Report').substring(0, 31));
  XLSX.writeFile(wb, `${safeFileName}_${Date.now()}.xlsx`);
}

export function generateCustomPDF(
  options: PDFExportOptions,
  columns: { header: string; dataKey: string }[],
  rows: ExportRowData[],
  businessProfile: BusinessProfile,
  summaryTotals?: Record<string, number | string>
) {
  // If columns is empty, discover columns from rows
  let activeCols = columns;
  if (!activeCols || activeCols.length === 0) {
    if (rows.length > 0) {
      activeCols = Object.keys(rows[0]).map((k) => ({
        header: k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim(),
        dataKey: k,
      }));
    } else {
      activeCols = [{ header: 'Details', dataKey: 'details' }];
    }
  }

  // Sanitize all column headers
  const sanitizedCols = activeCols.map((c) => ({
    header: sanitizeTextForPDF(c.header),
    dataKey: c.dataKey,
  }));

  // Auto-detect orientation: Landscape if >= 5 columns or if wide descriptive columns exist
  const colCount = sanitizedCols.length;
  const hasLongColumns = sanitizedCols.some(
    (c) =>
      c.header.length > 18 ||
      c.dataKey.toLowerCase().includes('particular') ||
      c.dataKey.toLowerCase().includes('description') ||
      c.dataKey.toLowerCase().includes('customer') ||
      c.dataKey.toLowerCase().includes('vendor') ||
      c.dataKey.toLowerCase().includes('supplier') ||
      c.dataKey.toLowerCase().includes('item')
  );
  const isLandscape = colCount >= 5 || (colCount >= 4 && hasLongColumns);

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 24;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 20;

  // Clean White Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Business Logo & Header with measured height alignment
  let headerLeftX = marginX;
  const showLogo = Boolean(businessProfile.logoUrl && businessProfile.logoUrl.startsWith('data:image'));
  const logoSize = 36;

  if (showLogo) {
    try {
      doc.addImage(businessProfile.logoUrl!, 'PNG', marginX, currentY, logoSize, logoSize, undefined, 'FAST');
      headerLeftX = marginX + logoSize + 10;
    } catch (e) {
      console.warn('Logo error in report PDF:', e);
    }
  }

  const maxHeaderWidth = pageWidth - marginX - headerLeftX;

  // Header / Branding
  if (options.includeBusinessDetails !== false) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    const busName = sanitizeTextForPDF(businessProfile.name || 'PATIL BIRYANI');
    doc.text(busName, headerLeftX, currentY + 10, { maxWidth: maxHeaderWidth });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const addrStr = sanitizeTextForPDF(
      `${businessProfile.addressLine1 || 'Main Road'}, ${businessProfile.city || 'Kolhapur'}, ${businessProfile.state || 'Maharashtra'} - ${businessProfile.pinCode || '416001'}`
    );
    const addrLines = doc.splitTextToSize(addrStr, maxHeaderWidth);
    doc.text(addrLines, headerLeftX, currentY + 22);

    const contactStr = sanitizeTextForPDF(
      `Phone: ${businessProfile.mobile || 'N/A'}${businessProfile.gstNumber ? ` | GSTIN: ${businessProfile.gstNumber}` : ''}${businessProfile.fssaiNumber ? ` | FSSAI: ${businessProfile.fssaiNumber}` : ''}`
    );
    const contactLines = doc.splitTextToSize(contactStr, maxHeaderWidth);
    const contactStartY = currentY + 22 + addrLines.length * 9;
    doc.text(contactLines, headerLeftX, contactStartY);

    const totalHeaderBlockHeight = Math.max(
      showLogo ? logoSize + 6 : 0,
      22 + addrLines.length * 9 + contactLines.length * 9 + 4
    );

    currentY += totalHeaderBlockHeight + 6;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.75);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 10;
  }

  // Report Title & Date Box (Two Columns with bounded multi-line text measurement)
  const metaRightWidth = Math.min(220, contentWidth * 0.35);
  const titleLeftWidth = contentWidth - metaRightWidth - 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const titleText = sanitizeTextForPDF(options.title || 'Report');
  const titleLines = doc.splitTextToSize(titleText, titleLeftWidth);
  doc.text(titleLines, marginX, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const periodStr = sanitizeTextForPDF(`Period: ${options.dateRangeText || 'All Time'}`);
  const periodLines = doc.splitTextToSize(periodStr, metaRightWidth);
  doc.text(periodLines, pageWidth - marginX, currentY + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.0);
  doc.setTextColor(148, 163, 184);
  const genStr = `Generated: ${new Date().toLocaleString('en-IN')}`;
  doc.text(genStr, pageWidth - marginX, currentY + 7 + periodLines.length * 9 + 2, { align: 'right' });

  const leftHeight = titleLines.length * 13;
  const rightHeight = periodLines.length * 9 + 14;
  currentY += Math.max(leftHeight, rightHeight) + 6;

  if (options.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const subText = sanitizeTextForPDF(options.subtitle);
    const subLines = doc.splitTextToSize(subText, contentWidth);
    doc.text(subLines, marginX, currentY);
    currentY += subLines.length * 9 + 6;
  } else {
    currentY += 4;
  }

  // Summary Totals Cards with dynamic height and collision-free text positioning
  if (options.includeSummaryCards !== false && summaryTotals && Object.keys(summaryTotals).length > 0) {
    const rawEntries = Object.entries(summaryTotals);
    const entries = rawEntries.map(([k, v]) => [sanitizeTextForPDF(k), sanitizeTextForPDF(v)] as [string, string]);

    const maxColsPerRow = isLandscape ? Math.min(entries.length, 6) : (entries.length === 4 ? 4 : Math.min(entries.length, 3));
    const cardGap = 8;

    // Chunk into rows of cards
    const rowsOfCards: [string, string][][] = [];
    for (let i = 0; i < entries.length; i += maxColsPerRow) {
      rowsOfCards.push(entries.slice(i, i + maxColsPerRow));
    }

    rowsOfCards.forEach((rowEntries) => {
      const numCardsInRow = rowEntries.length;
      const cardWidth = (contentWidth - (numCardsInRow - 1) * cardGap) / numCardsInRow;

      // Pass 1: Measure required height for all cards in this row
      let maxCardHeight = 36;
      const measuredCards = rowEntries.map(([key, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(cardWidth < 90 ? 5.5 : 6.2);
        const labelLines = doc.splitTextToSize(key.toUpperCase(), cardWidth - 14);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(cardWidth < 90 ? 7.5 : 8.5);
        const valLines = doc.splitTextToSize(val, cardWidth - 14);

        const cardH = 8 + labelLines.length * 7.5 + 4 + valLines.length * 9.5 + 6;
        if (cardH > maxCardHeight) maxCardHeight = cardH;

        return { key, val, labelLines, valLines };
      });

      // Pass 2: Render cards with uniform maxCardHeight
      measuredCards.forEach((card, idx) => {
        const cardX = marginX + idx * (cardWidth + cardGap);

        // Card Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.75);
        doc.roundedRect(cardX, currentY, cardWidth, maxCardHeight, 4, 4, 'FD');

        // Metric Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(cardWidth < 90 ? 5.5 : 6.2);
        doc.setTextColor(100, 116, 139);
        doc.text(card.labelLines, cardX + 7, currentY + 8);

        // Metric Value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(cardWidth < 90 ? 7.5 : 8.5);
        doc.setTextColor(16, 185, 129); // emerald-500
        const valStartY = currentY + 8 + card.labelLines.length * 7.5 + 3;
        doc.text(card.valLines, cardX + 7, valStartY);
      });

      currentY += maxCardHeight + cardGap;
    });

    currentY += 4;
  }

  // Safe table data mapped by dataKey with full sanitization
  const safeRows = rows.length > 0
    ? rows.map((r) => {
        const rowObj: Record<string, string> = {};
        sanitizedCols.forEach((col, idx) => {
          const originalCol = activeCols[idx];
          const rawVal =
            r[originalCol.dataKey] !== undefined
              ? r[originalCol.dataKey]
              : r[originalCol.header] !== undefined
              ? r[originalCol.header]
              : r[col.header] !== undefined
              ? r[col.header]
              : '-';
          rowObj[col.dataKey] = sanitizeTextForPDF(rawVal);
        });
        return rowObj;
      })
    : [{ [sanitizedCols[0]?.dataKey || 'col']: 'No records found matching criteria' }];

  // Dynamic typography and cell padding based on column count and page orientation
  const tableFontSize = colCount > 11 ? 5.8 : colCount > 8 ? 6.5 : colCount > 5 ? 7.2 : 8.0;
  const headerFontSize = colCount > 11 ? 6.2 : colCount > 8 ? 7.0 : colCount > 5 ? 7.8 : 8.2;
  const cellPadding = colCount > 10 ? 2.2 : colCount > 7 ? 2.8 : 3.6;

  // Semantic weighting for column width allocation
  const colWeights = sanitizedCols.map((col) => {
    const k = (col.dataKey || '').toLowerCase();
    const h = (col.header || '').toLowerCase();

    // Long textual columns
    if (
      k.includes('particular') ||
      k.includes('line') ||
      k.includes('desc') ||
      k.includes('item') ||
      k.includes('product') ||
      k.includes('dish') ||
      k.includes('name') ||
      k.includes('customer') ||
      k.includes('vendor') ||
      k.includes('supplier') ||
      k.includes('note') ||
      h.includes('particular') ||
      h.includes('customer') ||
      h.includes('supplier') ||
      h.includes('item') ||
      h.includes('product') ||
      h.includes('description')
    ) {
      return 2.4;
    }
    if (
      k.includes('invoice') ||
      k.includes('bill') ||
      k.includes('slip') ||
      k.includes('receipt') ||
      h.includes('invoice') ||
      h.includes('bill')
    ) {
      return 1.3;
    }
    if (
      k.includes('total') ||
      k.includes('amount') ||
      k.includes('sales') ||
      k.includes('profit') ||
      k.includes('salary') ||
      k.includes('balance') ||
      k.includes('due') ||
      k.includes('paid') ||
      k.includes('expense') ||
      k.includes('revenue') ||
      k.includes('inflow') ||
      k.includes('outflow') ||
      h.includes('total') ||
      h.includes('amount') ||
      /\brs\.?\b/i.test(h) ||
      h.includes('revenue')
    ) {
      return 1.25;
    }
    if (
      k.includes('date') ||
      k.includes('time') ||
      k.includes('table') ||
      k.includes('type') ||
      k.includes('category') ||
      k.includes('mobile') ||
      k.includes('phone') ||
      k.includes('contact') ||
      k.includes('mode') ||
      k.includes('status') ||
      k.includes('department') ||
      k.includes('designation')
    ) {
      return 1.0;
    }
    if (
      k.includes('qty') ||
      k.includes('quantity') ||
      k.includes('rate') ||
      k.includes('price') ||
      k.includes('margin') ||
      k.includes('percent')
    ) {
      return 0.85;
    }
    if (k.includes('#') || k.includes('sno') || k.includes('sr') || k.includes('code') || k.includes('id')) {
      return 0.7;
    }
    return 1.0;
  });

  const totalWeight = colWeights.reduce((sum, w) => sum + w, 0);
  const dynamicColumnStyles: Record<number, any> = {};

  sanitizedCols.forEach((col, idx) => {
    const key = (col.dataKey || '').toLowerCase();
    const header = (col.header || '').toLowerCase();
    const proportionalWidth = (colWeights[idx] / totalWeight) * contentWidth;

    // Explicit Text Columns MUST be left aligned (e.g. Accounting Particulars, Description, Item Name, Customer, etc.)
    const isExplicitText =
      key.includes('particular') ||
      key.includes('desc') ||
      key.includes('item') ||
      key.includes('product') ||
      key.includes('dish') ||
      key.includes('name') ||
      key.includes('customer') ||
      key.includes('vendor') ||
      key.includes('supplier') ||
      key.includes('title') ||
      key.includes('note') ||
      key.includes('remark') ||
      key.includes('reason') ||
      header.includes('particular') ||
      header.includes('desc') ||
      header.includes('item') ||
      header.includes('product') ||
      header.includes('dish') ||
      header.includes('name') ||
      header.includes('customer') ||
      header.includes('vendor') ||
      header.includes('supplier') ||
      header.includes('title') ||
      header.includes('note') ||
      header.includes('remark') ||
      header.includes('reason');

    // Check for Numeric/Financial columns -> Right aligned (unless it's an explicit text column)
    const isNumeric =
      !isExplicitText &&
      (key.includes('amount') ||
        key.includes('total') ||
        key.includes('rate') ||
        key.includes('price') ||
        key.includes('cost') ||
        key.includes('qty') ||
        key.includes('quantity') ||
        key.includes('plates') ||
        key.includes('profit') ||
        key.includes('receivable') ||
        key.includes('payable') ||
        key.includes('expense') ||
        key.includes('wage') ||
        key.includes('salary') ||
        key.includes('balance') ||
        key.includes('due') ||
        key.includes('paid') ||
        key.includes('margin') ||
        key.includes('percent') ||
        key.includes('tax') ||
        key.includes('discount') ||
        key.includes('revenue') ||
        /\brs\.?\b/i.test(header) ||
        header.includes('(rs') ||
        header.includes('rate') ||
        header.includes('amount') ||
        header.includes('qty') ||
        header.includes('sold') ||
        header.includes('total') ||
        header.includes('profit') ||
        header.includes('sales') ||
        header.includes('expense') ||
        header.includes('due') ||
        header.includes('paid') ||
        header.includes('revenue') ||
        header.includes('price'));

    // Check for ID/Date/Status/PaymentMode -> Center aligned
    const isCenter =
      !isExplicitText &&
      !isNumeric &&
      (key.includes('date') ||
        key.includes('time') ||
        key.includes('id') ||
        key.includes('code') ||
        key.includes('mode') ||
        key.includes('status') ||
        key.includes('table') ||
        key.includes('mobile') ||
        key.includes('phone') ||
        key.includes('contact') ||
        header.includes('date') ||
        header.includes('time') ||
        header.includes('mode') ||
        header.includes('status') ||
        header.includes('code') ||
        header.includes('emp'));

    const halign = isNumeric ? 'right' : isCenter ? 'center' : 'left';

    dynamicColumnStyles[idx] = {
      cellWidth: proportionalWidth,
      halign,
      fontStyle: isNumeric ? 'bold' : 'normal',
      cellPadding: isNumeric
        ? { top: cellPadding, bottom: cellPadding, right: 6, left: 4 }
        : { top: cellPadding, bottom: cellPadding, left: 4, right: 4 },
      overflow: 'linebreak',
    };
  });

  // AutoTable with aligned headers, borders, and margins
  autoTable(doc, {
    startY: currentY,
    columns: sanitizedCols.map((col) => ({ header: col.header, dataKey: col.dataKey })),
    body: safeRows,
    theme: 'grid',
    tableWidth: contentWidth,
    styles: {
      overflow: 'linebreak',
      valign: 'middle',
      minCellHeight: colCount > 9 ? 12 : 14,
      cellPadding,
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: headerFontSize,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding,
      overflow: 'linebreak',
    },
    bodyStyles: {
      fontSize: tableFontSize,
      textColor: [30, 41, 59],
      cellPadding,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: dynamicColumnStyles,
    margin: { left: marginX, right: marginX, bottom: 28 },
    horizontalPageBreak: false,
    didParseCell: (hookData) => {
      if (hookData.section === 'head') {
        const colStyle = dynamicColumnStyles[hookData.column.index];
        if (colStyle && colStyle.halign) {
          hookData.cell.styles.halign = colStyle.halign;
          if (colStyle.halign === 'right') {
            hookData.cell.styles.cellPadding = { top: cellPadding, bottom: cellPadding, right: 6, left: 4 };
          }
        }
      }
    },
  });

  // Draw Page Numbering and Footer across all generated pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);

    // Left system watermark
    doc.text('Patil Biryani Management & Financial POS System', marginX, pageHeight - 10);

    // Right page numbering
    doc.text(
      `Page ${p} of ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  const safeFileName = (options.title || 'Report').replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`${safeFileName}_${Date.now()}.pdf`);
}

export async function shareContent(title: string, text: string, url?: string) {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: url || window.location.href,
      });
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('Share error:', err);
      }
      return false;
    }
  } else {
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(`${title}\n${text}`);
      return 'copied';
    } catch {
      return false;
    }
  }
}


