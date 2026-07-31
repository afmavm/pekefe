import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Clean strings of Turkish characters for standard jsPDF fonts (Helvetica, Times)
 * to prevent character rendering and glyph error boxes.
 */
export const sanitizeForPDF = (txt: any): string => {
  if (txt === null || txt === undefined) return "";
  const str = String(txt);
  return str
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ü/g, "u").replace(/Ü/g, "U")
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ç/g, "c").replace(/Ç/g, "C");
};

interface ExportPDFOptions {
  title: string;
  subtitle: string;
  filename: string;
  headers: string[];
  rows: any[][];
  filters?: { label: string; value: string }[];
}

export function exportToPDF({
  title,
  subtitle,
  filename,
  headers,
  rows,
  filters = [],
}: ExportPDFOptions) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const cleanTitle = sanitizeForPDF(title);
    const cleanSubtitle = sanitizeForPDF(subtitle);

    // --- Header ---
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(33, 43, 54); // dark slate text
    doc.text("PEKEFE GERÇEK HASAT ERP", 14, 15);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(249, 115, 22); // orange-500 accent
    doc.text(cleanTitle, 14, 21);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(cleanSubtitle, 14, 27);
    
    const nowStr = `${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR")}`;
    doc.text(`Olusturulma Tarihi: ${nowStr}`, 14, 31);

    // --- Filters ---
    let startY = 36;
    const activeFilters = filters.filter((f) => f.value && f.value.trim() !== "");
    if (activeFilters.length > 0) {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(90, 90, 90);
      let filterText = "Uygulanan Filtreler: ";
      activeFilters.forEach((f) => {
        filterText += `${f.label}: ${f.value} | `;
      });
      if (filterText.endsWith(" | ")) {
        filterText = filterText.substring(0, filterText.length - 3);
      }
      doc.text(sanitizeForPDF(filterText), 14, startY);
      startY = startY + 5;
    }

    // --- Table Data Sanitization ---
    const cleanHeaders = headers.map(sanitizeForPDF);
    const cleanRows = rows.map((row) => row.map(sanitizeForPDF));

    // --- Generate AutoTable ---
    autoTable(doc, {
      head: [cleanHeaders],
      body: cleanRows,
      startY: startY,
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        font: "Helvetica",
        textColor: [50, 50, 50],
      },
      headStyles: {
        fillColor: [249, 115, 22], // orange-500
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50/100
      },
      margin: { top: 15, right: 14, bottom: 15, left: 14 },
      didDrawPage: (data: any) => {
        // Simple page numbering footer
        const pageCount = doc.getNumberOfPages();
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          sanitizeForPDF(`Sayfa ${data.pageNumber} / ${pageCount}`),
          data.settings.margin.left,
          doc.internal.pageSize.getHeight() - 10
        );
      },
    });

    // Save File
    doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw error;
  }
}
