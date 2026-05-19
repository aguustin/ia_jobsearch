import { jsPDF } from "jspdf";

const MARGIN = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE_GAP = 5;
const SECTION_GAP = 7;

// Colors (RGB)
const C_PRIMARY = [108, 99, 255];
const C_SECONDARY = [0, 217, 197];
const C_TEXT = [30, 30, 40];
const C_MUTED = [110, 110, 130];
const C_DIVIDER = [230, 230, 240];

function ensureSpace(doc, y, needed = 10) {
  if (y + needed > PAGE_H - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function sectionHeader(doc, y, title) {
  y = ensureSpace(doc, y, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C_PRIMARY);
  doc.text(title.toUpperCase(), MARGIN, y);
  y += 3;
  doc.setDrawColor(...C_DIVIDER);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;
  return y;
}

function bullet(doc, y, text, indent = 4) {
  y = ensureSpace(doc, y, 5);
  const x = MARGIN + indent;
  const availW = CONTENT_W - indent - 3;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C_TEXT);
  doc.text("•", x, y);
  const lines = doc.splitTextToSize(text, availW);
  lines.forEach((line, i) => {
    y = ensureSpace(doc, y, 5);
    doc.text(line, x + 4, y);
    if (i < lines.length - 1) y += LINE_GAP - 0.5;
  });
  return y + LINE_GAP - 0.5;
}

function wrappedText(doc, y, text, maxW = CONTENT_W, fontSize = 9, style = "normal") {
  doc.setFont("helvetica", style);
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxW);
  lines.forEach((line) => {
    y = ensureSpace(doc, y, LINE_GAP);
    doc.text(line, MARGIN, y);
    y += LINE_GAP;
  });
  return y;
}

export function generateCVPDF(optimizedCV, filename = "CV_ATS_optimizado.pdf") {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pi = optimizedCV.personalInfo || {};
  let y = MARGIN;

  // ─── HEADER ─────────────────────────────────────────────────────────────────
  if (pi.name) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...C_PRIMARY);
    doc.text(pi.name.toUpperCase(), MARGIN, y);
    y += 8;
  }

  const contactParts = [pi.email, pi.phone, pi.location, pi.linkedin, pi.github].filter(Boolean);
  if (contactParts.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C_MUTED);
    const contactLine = contactParts.join("  ·  ");
    const lines = doc.splitTextToSize(contactLine, CONTENT_W);
    lines.forEach((line) => {
      doc.text(line, MARGIN, y);
      y += 5;
    });
  }

  // Header divider
  y += 2;
  doc.setDrawColor(...C_PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += SECTION_GAP;

  // ─── SUMMARY ────────────────────────────────────────────────────────────────
  if (optimizedCV.summary) {
    y = sectionHeader(doc, y, "Resumen Profesional");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...C_TEXT);
    const lines = doc.splitTextToSize(optimizedCV.summary, CONTENT_W);
    lines.forEach((line) => {
      y = ensureSpace(doc, y, LINE_GAP);
      doc.text(line, MARGIN, y);
      y += LINE_GAP;
    });
    y += SECTION_GAP - 2;
  }

  // ─── EXPERIENCE ─────────────────────────────────────────────────────────────
  if ((optimizedCV.experience || []).length > 0) {
    y = sectionHeader(doc, y, "Experiencia Profesional");

    optimizedCV.experience.forEach((exp) => {
      y = ensureSpace(doc, y, 12);

      // Role + Company
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...C_TEXT);
      doc.text(exp.role || "", MARGIN, y);

      // Date range (right-aligned)
      const period = [exp.startDate, exp.endDate || "Presente"].filter(Boolean).join(" – ");
      if (period) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...C_MUTED);
        const periodW = doc.getTextWidth(period);
        doc.text(period, PAGE_W - MARGIN - periodW, y);
      }
      y += 5;

      // Company name
      if (exp.company) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...C_SECONDARY);
        doc.text(exp.company, MARGIN, y);
        y += LINE_GAP;
      }

      // Achievements
      (exp.achievements || []).forEach((a) => {
        y = bullet(doc, y, a, 3);
      });

      y += 3;
    });

    y += SECTION_GAP - 5;
  }

  // ─── SKILLS ─────────────────────────────────────────────────────────────────
  if ((optimizedCV.skills || []).length > 0) {
    y = sectionHeader(doc, y, "Habilidades Técnicas");

    optimizedCV.skills.forEach((sg) => {
      if (!sg.category || !(sg.items || []).length) return;
      y = ensureSpace(doc, y, 7);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...C_MUTED);
      doc.text(`${sg.category}:`, MARGIN, y);

      const labelW = doc.getTextWidth(`${sg.category}: `);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...C_TEXT);
      const skillText = sg.items.join(", ");
      const skillLines = doc.splitTextToSize(skillText, CONTENT_W - labelW);
      skillLines.forEach((line, i) => {
        y = ensureSpace(doc, y, LINE_GAP);
        doc.text(line, MARGIN + (i === 0 ? labelW : 0), y);
        if (i < skillLines.length - 1) y += LINE_GAP;
      });
      y += LINE_GAP;
    });

    y += SECTION_GAP - 4;
  }

  // ─── EDUCATION ──────────────────────────────────────────────────────────────
  if ((optimizedCV.education || []).length > 0) {
    y = sectionHeader(doc, y, "Educación");

    optimizedCV.education.forEach((edu) => {
      y = ensureSpace(doc, y, 10);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...C_TEXT);
      doc.text(edu.degree || "", MARGIN, y);

      const period = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
      if (period) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...C_MUTED);
        const periodW = doc.getTextWidth(period);
        doc.text(period, PAGE_W - MARGIN - periodW, y);
      }
      y += 5;

      if (edu.institution) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...C_MUTED);
        doc.text(edu.institution, MARGIN, y);
        y += LINE_GAP;
      }

      y += 2;
    });

    y += SECTION_GAP - 4;
  }

  // ─── LANGUAGES ──────────────────────────────────────────────────────────────
  if ((optimizedCV.languages || []).length > 0) {
    y = sectionHeader(doc, y, "Idiomas");

    const langs = optimizedCV.languages.filter((l) => l.name);
    langs.forEach((l) => {
      y = ensureSpace(doc, y, LINE_GAP);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...C_TEXT);
      doc.text(`${l.name}:`, MARGIN, y);
      const labelW = doc.getTextWidth(`${l.name}: `);
      doc.setFont("helvetica", "normal");
      doc.text(l.level || "", MARGIN + labelW, y);
      y += LINE_GAP;
    });
    y += SECTION_GAP - 3;
  }

  // ─── CERTIFICATIONS / FORMACIÓN ─────────────────────────────────────────────
  if ((optimizedCV.certifications || []).length > 0) {
    y = sectionHeader(doc, y, "Formación");

    optimizedCV.certifications.filter((c) => c.name).forEach((c) => {
      y = ensureSpace(doc, y, LINE_GAP + 2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...C_TEXT);
      doc.text(c.name, MARGIN, y);

      if (c.date) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...C_MUTED);
        const dateW = doc.getTextWidth(c.date);
        doc.text(c.date, PAGE_W - MARGIN - dateW, y);
      }
      y += LINE_GAP - 1;

      if (c.issuer) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...C_SECONDARY);
        doc.text(c.issuer, MARGIN, y);
        y += LINE_GAP;
      }
    });
  }

  doc.save(filename);
}
