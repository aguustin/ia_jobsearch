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

// Fixes experience entries where all fields are concatenated in the role string:
// "Desarrollador PHP | DivisionGIS — Mendoza, Argentina  Mar 2020 – Feb 2022"
function normalizeExpEntry(exp) {
  if (exp.company || !exp.role || !exp.role.includes(" | ")) return exp;

  const pipeIdx   = exp.role.indexOf(" | ");
  const role      = exp.role.slice(0, pipeIdx).trim();
  const rest      = exp.role.slice(pipeIdx + 3);
  const dateRe    = /\s{2,}([A-Za-záéíóúÁÉÍÓÚ]{3}\.?\s*\d{4})\s*[–\-]\s*([A-Za-záéíóúÁÉÍÓÚ]{3}\.?\s*\d{4}|Presente|Actual)?\s*$/i;
  const dm        = rest.match(dateRe);
  const fixDate   = (d) => d?.replace(/([A-Za-z]{3})(\d{4})/, "$1 $2").trim() ?? "";

  let company   = dm ? rest.slice(0, dm.index).trim() : rest;
  company       = company.replace(/\s*—\s*.+$/, "").trim(); // strip "— City, Country"

  return {
    ...exp,
    role,
    company,
    startDate: exp.startDate || (dm ? fixDate(dm[1]) : ""),
    endDate:   exp.endDate   || (dm && dm[2] ? fixDate(dm[2]) : ""),
  };
}

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

export function generateCVPDF(optimizedCV, filename = "CV_ATS_optimizado.pdf", photo = null) {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pi = optimizedCV.personalInfo || {};
  let y = MARGIN;

  // ─── PHOTO (top-right) ───────────────────────────────────────────────────────
  const PHOTO_SIZE = 32;
  // jsPDF text y = baseline; 20pt Helvetica Bold cap-height ≈ 5mm above baseline,
  // so shift photo up to visually align its top edge with the name text top.
  const PHOTO_Y = MARGIN - 5;
  const textW = photo ? CONTENT_W - PHOTO_SIZE - 5 : CONTENT_W;

  if (photo) {
    try {
      const fmt = photo.startsWith("data:image/png") ? "PNG" : "JPEG";
      const r  = PHOTO_SIZE / 2;
      const px = PAGE_W - MARGIN - PHOTO_SIZE;
      const cx = px + r;
      const cy = PHOTO_Y + r;

      // Circular clip using PDF path operators
      const pageH = doc.internal.pageSize.getHeight();
      const k     = doc.internal.scaleFactor;
      const cxPt  = cx * k;
      const cyPt  = (pageH - cy) * k;
      const rPt   = r * k;
      const cp    = 0.5523 * rPt; // bezier control point for circle

      doc.internal.write("q");
      doc.internal.write(
        `${cxPt - rPt} ${cyPt} m ` +
        `${cxPt - rPt} ${cyPt + cp} ${cxPt - cp} ${cyPt + rPt} ${cxPt} ${cyPt + rPt} c ` +
        `${cxPt + cp} ${cyPt + rPt} ${cxPt + rPt} ${cyPt + cp} ${cxPt + rPt} ${cyPt} c ` +
        `${cxPt + rPt} ${cyPt - cp} ${cxPt + cp} ${cyPt - rPt} ${cxPt} ${cyPt - rPt} c ` +
        `${cxPt - cp} ${cyPt - rPt} ${cxPt - rPt} ${cyPt - cp} ${cxPt - rPt} ${cyPt} c ` +
        "W n"
      );
      doc.addImage(photo, fmt, px, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE);
      doc.internal.write("Q");

      // Light gray circular border
      doc.setDrawColor(200, 200, 210);
      doc.setLineWidth(0.5);
      doc.ellipse(cx, cy, r, r, "S");
    } catch { /* ignore broken photo */ }
  }

  // ─── HEADER ─────────────────────────────────────────────────────────────────
  if (pi.name) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...C_PRIMARY);
    const nameLines = doc.splitTextToSize(pi.name.toUpperCase(), textW);
    nameLines.forEach((line) => { doc.text(line, MARGIN, y); y += 8; });
  }

  if (pi.title) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...C_SECONDARY);
    const titleLines = doc.splitTextToSize(pi.title, textW);
    titleLines.forEach((line) => { doc.text(line, MARGIN, y); y += 5.5; });
  }

  const contactParts = [pi.email, pi.phone, pi.location, pi.linkedin, pi.github].filter(Boolean);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  if (contactParts.length) {
    doc.setTextColor(...C_MUTED);
    const contactLine = contactParts.join("  ·  ");
    const lines = doc.splitTextToSize(contactLine, textW);
    lines.forEach((line) => { doc.text(line, MARGIN, y); y += 5; });
  }
  if (pi.portfolio) {
    const display    = pi.portfolio.replace(/^https?:\/\//, "");
    const url        = pi.portfolio.startsWith("http") ? pi.portfolio : `https://${pi.portfolio}`;
    doc.setTextColor(...C_PRIMARY);
    doc.textWithLink(display, MARGIN, y, { url });
    y += 5;
    doc.setTextColor(...C_MUTED);
  }

  // If photo is taller than the text, align y to bottom of photo
  if (photo) y = Math.max(y, PHOTO_Y + PHOTO_SIZE + 2);

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
  // Split at the "Proyectos Destacados" header entry: everything before = experience,
  // everything AFTER the header = individual project entries
  const allExp = optimizedCV.experience || [];
  const projHeaderIdx = allExp.findIndex((e) =>
    /proyecto[s]?\s+destacados?/i.test(e.role || "") ||
    /proyecto[s]?\s+destacados?/i.test(e.company || "")
  );

  const regularExp = projHeaderIdx === -1 ? allExp : allExp.slice(0, projHeaderIdx);
  let projectExp   = projHeaderIdx === -1 ? [] : allExp.slice(projHeaderIdx + 1);

  // Edge case: all projects stored as achievements of a single header entry
  if (projectExp.length === 0 && projHeaderIdx !== -1) {
    const header = allExp[projHeaderIdx];
    if (header.achievements?.length) {
      projectExp = header.achievements.map((a) => ({ role: a, achievements: [] }));
    }
  }

  if (regularExp.length > 0) {
    y = sectionHeader(doc, y, "Experiencia Profesional");

    regularExp.forEach((rawExp) => {
      const exp = normalizeExpEntry(rawExp);
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

  // ─── PROYECTOS DESTACADOS ────────────────────────────────────────────────────
  if (projectExp.length > 0) {
    y = sectionHeader(doc, y, "Proyectos Destacados");

    projectExp.forEach((exp) => {
      y = ensureSpace(doc, y, 10);

      // Project name (role field)
      const projectName = (exp.role || "").replace(/proyecto[s]?\s+destacados?:?\s*/i, "").trim();
      if (projectName) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(...C_TEXT);
        doc.text(projectName, MARGIN, y);
        y += LINE_GAP;
      }

      // Achievements / description
      (exp.achievements || []).forEach((a) => { y = bullet(doc, y, a, 3); });
      y += 2;
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
      if (l.certificateUrl) {
        const levelW = doc.getTextWidth((l.level || "") + "  ");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...C_PRIMARY);
        doc.textWithLink("Ver certificado", MARGIN + labelW + levelW, y, { url: l.certificateUrl });
        doc.setTextColor(...C_TEXT);
      }
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
        if (c.url) {
          const issuerW = doc.getTextWidth(c.issuer + "  ");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...C_PRIMARY);
          doc.textWithLink("Ver certificado", MARGIN + issuerW, y, { url: c.url });
          doc.setTextColor(...C_TEXT);
        }
        y += LINE_GAP;
      }
    });
  }

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
