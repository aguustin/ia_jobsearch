import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Box, Typography, Button, Tabs, Tab, Divider,
  Chip, Stack, IconButton, Tooltip, Skeleton, TextField, CircularProgress,
} from "@mui/material";
import {
  ContentCopy, Download, PictureAsPdf, CheckCircle, Person,
  Work, School, Code, Translate, KeyboardArrowUp,
  KeyboardArrowDown, Add, DeleteOutline, Refresh, MenuBook,
  AddAPhoto, DragIndicator,
} from "@mui/icons-material";
import { DndContext, DragOverlay, useDraggable, useDroppable, pointerWithin } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { generateCVPDF } from "../../utils/generateCVPDF.js";
import { cvApi } from "../../api/client.js";
import { scoreColor } from "../../theme.js";
import { useProfilePhoto } from "../../hooks/useProfilePhoto.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normWord(w) {
  return w.toLowerCase().replace(/[.\-_]/g, "").replace(/\s+/g, " ").trim();
}

function formatCVText(cv) {
  const lines = [];
  const pi = cv.personalInfo || {};
  const sep = "─".repeat(55);
  if (pi.name) { lines.push(pi.name.toUpperCase(), ""); }
  const contact = [pi.email, pi.phone, pi.location, pi.linkedin, pi.github].filter(Boolean);
  if (contact.length) { lines.push(contact.join("  |  "), ""); }
  if (cv.summary) { lines.push("RESUMEN PROFESIONAL", sep, cv.summary, ""); }
  if ((cv.experience || []).length > 0) {
    lines.push("EXPERIENCIA PROFESIONAL", sep);
    cv.experience.forEach((exp) => {
      lines.push(`${exp.role || ""}  —  ${exp.company || ""}`);
      const p = [exp.startDate, exp.endDate || "Presente"].filter(Boolean).join(" – ");
      if (p) lines.push(p);
      (exp.achievements || []).forEach((a) => lines.push(`  • ${a}`));
      lines.push("");
    });
  }
  if ((cv.skills || []).length > 0) {
    lines.push("HABILIDADES TÉCNICAS", sep);
    cv.skills.forEach((sg) => {
      if (sg.category && sg.items?.length) lines.push(`${sg.category}: ${sg.items.join(", ")}`);
    });
    lines.push("");
  }
  if ((cv.education || []).length > 0) {
    lines.push("EDUCACIÓN", sep);
    cv.education.forEach((edu) => {
      lines.push(`${edu.degree || ""}  —  ${edu.institution || ""}`);
      const p = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
      if (p) lines.push(p);
      lines.push("");
    });
  }
  if ((cv.languages || []).length > 0) {
    lines.push("IDIOMAS", sep);
    cv.languages.forEach((l) => { if (l.name) lines.push(`${l.name}: ${l.level || ""}`); });
    lines.push("");
  }
  if ((cv.certifications || []).length > 0) {
    lines.push("FORMACIÓN", sep);
    cv.certifications.forEach((c) => {
      if (c.name) lines.push(`${c.name}${c.issuer ? ` | ${c.issuer}` : ""}${c.date ? ` | ${c.date}` : ""}`);
    });
  }
  return lines.join("\n");
}

// ─── Keyword highlight ────────────────────────────────────────────────────────

function HighlightedText({ text, exactSet, fuzzySet, variant = "body2", sx = {} }) {
  if (!text) return null;
  if (!exactSet.size && !fuzzySet.size) {
    return <Typography variant={variant} sx={sx}>{text}</Typography>;
  }
  const tokens = text.split(/(\b[\w.+-]+\b)/);
  return (
    <Typography variant={variant} sx={sx} component="span">
      {tokens.map((token, i) => {
        const n = normWord(token);
        if (exactSet.has(n)) {
          return <Box key={i} component="mark" sx={{ background: "rgba(108,99,255,0.22)", color: "#9B8FFF", px: "2px", borderRadius: "3px" }}>{token}</Box>;
        }
        if (fuzzySet.has(n)) {
          return <Box key={i} component="mark" sx={{ background: "rgba(255,183,77,0.18)", color: "#FFB74D", px: "2px", borderRadius: "3px" }}>{token}</Box>;
        }
        return token;
      })}
    </Typography>
  );
}

// ─── Editable fields ──────────────────────────────────────────────────────────

function EditableText({ value, onChange, variant = "body2", sx = {}, fontWeight, placeholder = "Clic para editar..." }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  useEffect(() => setDraft(value || ""), [value]);

  if (editing) {
    return (
      <TextField
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onChange(draft); setEditing(false); }
          if (e.key === "Escape") { setDraft(value || ""); setEditing(false); }
        }}
        autoFocus size="small" variant="standard" fullWidth
        sx={{ "& .MuiInput-root": { color: "text.primary", fontSize: 13 } }}
      />
    );
  }
  return (
    <Tooltip title="Clic para editar" placement="top-start" enterDelay={600}>
      <Box onClick={() => setEditing(true)} sx={{
        cursor: "text", borderRadius: 0.5, px: 0.5, mx: -0.5, display: "inline-block",
        width: "100%", minHeight: "1.4em",
        "&:hover": { bgcolor: "rgba(108,99,255,0.07)", outline: "1px dashed rgba(108,99,255,0.3)" },
      }}>
        <Typography variant={variant} fontWeight={fontWeight} sx={sx}>
          {value || <Box component="span" sx={{ opacity: 0.25, fontStyle: "italic" }}>{placeholder}</Box>}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function EditableArea({ value, onChange, variant = "body2", sx = {}, placeholder = "Clic para editar..." }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  useEffect(() => setDraft(value || ""), [value]);

  if (editing) {
    return (
      <TextField
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value || ""); setEditing(false); } }}
        autoFocus multiline minRows={2} size="small" fullWidth
        sx={{ "& textarea": { fontSize: 13, lineHeight: 1.8 } }}
      />
    );
  }
  return (
    <Tooltip title="Clic para editar" placement="top-start" enterDelay={600}>
      <Box onClick={() => setEditing(true)} sx={{
        cursor: "text", borderRadius: 0.5, p: 0.5, m: -0.5, minHeight: "2.5em",
        "&:hover": { bgcolor: "rgba(108,99,255,0.07)", outline: "1px dashed rgba(108,99,255,0.3)" },
      }}>
        <Typography variant={variant} sx={{ lineHeight: 1.8, ...sx }}>
          {value || <Box component="span" sx={{ opacity: 0.25, fontStyle: "italic" }}>{placeholder}</Box>}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ─── Skill drag & drop ────────────────────────────────────────────────────────

function DraggableSkillChip({ id, skill, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <Chip
      ref={setNodeRef}
      label={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          <Box
            component="span"
            {...listeners}
            {...attributes}
            sx={{ cursor: isDragging ? "grabbing" : "grab", display: "flex", alignItems: "center", touchAction: "none" }}
          >
            <DragIndicator sx={{ fontSize: 12, opacity: 0.35, "&:hover": { opacity: 0.7 } }} />
          </Box>
          <EditableText value={skill} onChange={onEdit} variant="caption" sx={{ fontSize: 11 }} placeholder="skill" />
          <DeleteOutline
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            sx={{ fontSize: 12, cursor: "pointer", opacity: 0.4, "&:hover": { opacity: 1, color: "error.main" } }}
          />
        </Box>
      }
      size="small"
      sx={{
        height: 26,
        bgcolor: "rgba(108,99,255,0.1)",
        color: "primary.light",
        border: "1px solid rgba(108,99,255,0.2)",
        px: 0.5,
        opacity: isDragging ? 0.35 : 1,
        transition: "opacity 0.12s",
      }}
    />
  );
}

function DroppableCategory({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        borderRadius: 1,
        p: 0.75,
        m: -0.75,
        border: `1px dashed ${isOver ? "rgba(108,99,255,0.55)" : "transparent"}`,
        bgcolor: isOver ? "rgba(108,99,255,0.06)" : "transparent",
        transition: "border-color 0.12s, background-color 0.12s",
      }}
    >
      {children}
    </Box>
  );
}

function SkillsSection({ skills, update, moveSection, sectionOrder }) {
  const [activeDragId, setActiveDragId] = useState(null);

  const activeDragLabel = activeDragId ? (() => {
    const [, ci, ii] = activeDragId.split("-").map(Number);
    return skills[ci]?.items[ii] || "";
  })() : null;

  const handleDragStart = ({ active }) => setActiveDragId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveDragId(null);
    if (!over) return;
    const [, fromCat, fromItem] = active.id.split("-").map(Number);
    const [, toCat] = over.id.split("-").map(Number);
    if (fromCat !== toCat) update.moveSkill(fromCat, fromItem, toCat);
  };

  return (
    <Box>
      <SectionHeader
        icon={<Code sx={{ fontSize: 16, color: "warning.main" }} />}
        title="Habilidades Técnicas"
        onUp={() => moveSection("skills", -1)}
        onDown={() => moveSection("skills", 1)}
        disableUp={sectionOrder[0] === "skills"}
        disableDown={sectionOrder[sectionOrder.length - 1] === "skills"}
      />
      <DndContext collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {skills.map((sg, i) => (
            <DroppableCategory key={i} id={`cat-${i}`}>
              <EditableText
                value={sg.category}
                onChange={(v) => update.skillCategory(i, v)}
                variant="caption"
                sx={{ color: "text.disabled" }}
                fontWeight={600}
                placeholder="Categoría..."
              />
              <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                {(sg.items || []).map((skill, j) => (
                  <DraggableSkillChip
                    key={j}
                    id={`skill-${i}-${j}`}
                    skill={skill}
                    onEdit={(v) => update.skillItem(i, j, v)}
                    onDelete={() => update.removeSkillItem(i, j)}
                  />
                ))}
                <Tooltip title="Agregar skill">
                  <Chip
                    icon={<Add sx={{ fontSize: 13 }} />}
                    label="Agregar"
                    size="small"
                    onClick={() => update.addSkillItem(i)}
                    sx={{ height: 26, fontSize: 11, cursor: "pointer", bgcolor: "rgba(255,255,255,0.04)", color: "text.disabled", border: "1px dashed rgba(255,255,255,0.15)", "&:hover": { borderColor: "primary.main", color: "primary.light" } }}
                  />
                </Tooltip>
              </Stack>
            </DroppableCategory>
          ))}
        </Box>
        <DragOverlay>
          {activeDragLabel && (
            <Chip
              label={activeDragLabel}
              size="small"
              sx={{
                height: 26,
                bgcolor: "rgba(108,99,255,0.9)",
                color: "white",
                border: "1px solid rgba(108,99,255,0.5)",
                cursor: "grabbing",
                boxShadow: "0 4px 14px rgba(108,99,255,0.45)",
              }}
            />
          )}
        </DragOverlay>
      </DndContext>
    </Box>
  );
}

// ─── Section header with reorder controls ────────────────────────────────────

function SectionHeader({ icon, title, onUp, onDown, disableUp, disableDown }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
      {icon}
      <Typography variant="subtitle2" color="primary.light" fontWeight={600} sx={{ flex: 1 }}>
        {title}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.25 }}>
        <Tooltip title="Subir sección">
          <span>
            <IconButton size="small" onClick={onUp} disabled={disableUp}
              sx={{ width: 22, height: 22, bgcolor: "rgba(255,255,255,0.05)", "&:hover": { bgcolor: "rgba(108,99,255,0.15)" } }}>
              <KeyboardArrowUp sx={{ fontSize: 15 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Bajar sección">
          <span>
            <IconButton size="small" onClick={onDown} disabled={disableDown}
              sx={{ width: 22, height: 22, bgcolor: "rgba(255,255,255,0.05)", "&:hover": { bgcolor: "rgba(108,99,255,0.15)" } }}>
              <KeyboardArrowDown sx={{ fontSize: 15 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ─── Action bar buttons ───────────────────────────────────────────────────────

function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(getText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Tooltip title={copied ? "¡Copiado!" : "Copiar al portapapeles"}>
      <IconButton size="small" onClick={handleCopy} sx={{ color: copied ? "success.main" : "text.secondary" }}>
        {copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}

function DownloadTxtButton({ getText, filename }) {
  const handleDownload = () => {
    const blob = new Blob([getText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button size="small" variant="outlined" startIcon={<Download />} onClick={handleDownload} sx={{ fontSize: 12 }}>
      .txt
    </Button>
  );
}

function DownloadPdfButton({ getCV, filename, getPhoto }) {
  return (
    <Button size="small" variant="contained" startIcon={<PictureAsPdf />}
      onClick={() => generateCVPDF(getCV(), filename, getPhoto?.())}
      sx={{ fontSize: 12, background: "linear-gradient(135deg, #6C63FF 0%, #00D9C5 100%)" }}>
      Descargar PDF
    </Button>
  );
}

// ─── Profile photo upload ─────────────────────────────────────────────────────

function PhotoUpload({ photo, onUpload, onRemove }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    if (e.target.files[0]) onUpload(e.target.files[0]);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      <Tooltip title={photo ? "Reemplazar foto" : "Agregar foto de perfil"}>
        <Box
          onClick={() => inputRef.current.click()}
          sx={{
            width: 72, height: 72, borderRadius: "50%", cursor: "pointer",
            border: photo ? "2px solid rgba(108,99,255,0.5)" : "2px dashed rgba(108,99,255,0.3)",
            overflow: "hidden", position: "relative", flexShrink: 0,
            bgcolor: "rgba(108,99,255,0.05)",
            display: "flex", alignItems: "center", justifyContent: "center",
            "&:hover .photo-overlay": { opacity: 1 },
          }}
        >
          {photo
            ? <Box component="img" src={photo} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25, color: "text.disabled" }}>
                <AddAPhoto sx={{ fontSize: 20 }} />
                <Typography variant="caption" fontSize={9}>Foto</Typography>
              </Box>
          }
          <Box className="photo-overlay" sx={{
            position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0, transition: "opacity 0.15s",
          }}>
            <AddAPhoto sx={{ fontSize: 20, color: "white" }} />
          </Box>
        </Box>
      </Tooltip>
      {photo && (
        <Typography
          variant="caption" fontSize={10} color="text.disabled" sx={{ cursor: "pointer", "&:hover": { color: "error.light" } }}
          onClick={onRemove}
        >
          Quitar foto
        </Typography>
      )}
    </Box>
  );
}

// ─── Structured editor ────────────────────────────────────────────────────────

const SECTION_KEYS = ["summary", "skills", "experience", "education", "certifications", "languages"];

function StructuredEditor({ cv, update, sectionOrder, moveSection, exactSet, fuzzySet, photo, onPhotoUpload, onPhotoRemove }) {
  const pi = cv.personalInfo || {};

  const sectionComponents = {
    summary: cv.summary !== undefined ? (
      <Box>
        <SectionHeader
          icon={<Person sx={{ fontSize: 16, color: "primary.main" }} />}
          title="Resumen Profesional"
          onUp={() => moveSection("summary", -1)}
          onDown={() => moveSection("summary", 1)}
          disableUp={sectionOrder[0] === "summary"}
          disableDown={sectionOrder[sectionOrder.length - 1] === "summary"}
        />
        <EditableArea
          value={cv.summary}
          onChange={(v) => update.summary(v)}
          sx={{ color: "text.secondary" }}
          placeholder="Agregá un resumen profesional con keywords de la oferta..."
        />
      </Box>
    ) : null,

    experience: (() => {
      const allExp = cv.experience || [];
      if (allExp.length === 0) return null;

      const projIdx = allExp.findIndex((e) => /proyecto[s]?\s+destacados?/i.test(e.role || ""));
      const regularEntries = projIdx === -1 ? allExp : allExp.slice(0, projIdx);
      const projectEntries = projIdx === -1 ? [] : allExp.slice(projIdx);

      const renderEntry = (exp, i) => {
        const isHeader = /proyecto[s]?\s+destacados?/i.test(exp.role || "");
        return (
          <Box key={i}>
            <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", mb: 0.5, gap: 1 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <EditableText value={exp.role} onChange={(v) => update.expField(i, "role", v)}
                  variant="body2" fontWeight={600} placeholder="Cargo / Proyecto..." />
              </Box>
              {!isHeader && (
                <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0, alignItems: "center" }}>
                  <EditableText value={exp.startDate} onChange={(v) => update.expField(i, "startDate", v)}
                    variant="caption" sx={{ color: "text.disabled" }} placeholder="Inicio" />
                  <Typography variant="caption" color="text.disabled">–</Typography>
                  <EditableText value={exp.endDate} onChange={(v) => update.expField(i, "endDate", v)}
                    variant="caption" sx={{ color: "text.disabled" }} placeholder="Fin / Presente" />
                  <Tooltip title="Eliminar entrada">
                    <IconButton size="small" onClick={() => update.removeExp(i)}
                      sx={{ color: "text.disabled", "&:hover": { color: "error.main" }, width: 20, height: 20, ml: 0.25 }}>
                      <DeleteOutline sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
            {!isHeader && (
              <>
                <EditableText value={exp.company} onChange={(v) => update.expField(i, "company", v)}
                  variant="caption" sx={{ color: "primary.light" }} placeholder="Empresa / Stack..." />
                <Box sx={{ mt: 0.75 }}>
                  {(exp.achievements || []).map((a, j) => (
                    <Box key={j} sx={{ display: "flex", gap: 0.5, mb: 0.4, alignItems: "flex-start" }}>
                      <Typography variant="caption" color="primary.main" mt={0.1}>•</Typography>
                      <Box sx={{ flex: 1 }}>
                        <EditableArea value={a} onChange={(v) => update.achievement(i, j, v)}
                          variant="caption" sx={{ color: "text.secondary", lineHeight: 1.6 }} />
                      </Box>
                      <Tooltip title="Eliminar bullet">
                        <IconButton size="small" onClick={() => update.removeAchievement(i, j)}
                          sx={{ color: "text.disabled", "&:hover": { color: "error.main" }, width: 20, height: 20, mt: 0.2 }}>
                          <DeleteOutline sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                  <Button size="small" startIcon={<Add sx={{ fontSize: 13 }} />}
                    onClick={() => update.addAchievement(i)}
                    sx={{ fontSize: 11, color: "text.disabled", mt: 0.25, "&:hover": { color: "primary.light" } }}>
                    Agregar logro
                  </Button>
                </Box>
              </>
            )}
          </Box>
        );
      };

      return (
        <Box>
          <SectionHeader
            icon={<Work sx={{ fontSize: 16, color: "secondary.main" }} />}
            title="Experiencia Profesional"
            onUp={() => moveSection("experience", -1)}
            onDown={() => moveSection("experience", 1)}
            disableUp={sectionOrder[0] === "experience"}
            disableDown={sectionOrder[sectionOrder.length - 1] === "experience"}
          />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {regularEntries.map((exp, i) => renderEntry(exp, i))}
            <Button size="small" startIcon={<Add sx={{ fontSize: 13 }} />}
              onClick={() => update.addExp()}
              sx={{ fontSize: 11, color: "text.disabled", alignSelf: "flex-start", "&:hover": { color: "secondary.light" } }}>
              Agregar experiencia profesional
            </Button>
            {projectEntries.map((exp, i) => renderEntry(exp, projIdx + i))}
          </Box>
        </Box>
      );
    })(),

    skills: (cv.skills || []).length > 0 ? (
      <SkillsSection
        skills={cv.skills}
        update={update}
        moveSection={moveSection}
        sectionOrder={sectionOrder}
      />
    ) : null,

    education: (cv.education || []).length > 0 ? (
      <Box>
        <SectionHeader
          icon={<School sx={{ fontSize: 16, color: "success.main" }} />}
          title="Educación"
          onUp={() => moveSection("education", -1)}
          onDown={() => moveSection("education", 1)}
          disableUp={sectionOrder[0] === "education"}
          disableDown={sectionOrder[sectionOrder.length - 1] === "education"}
        />
        {cv.education.map((edu, i) => (
          <Box key={i} sx={{ mb: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
              <EditableText value={edu.degree} onChange={(v) => update.eduField(i, "degree", v)}
                variant="body2" fontWeight={600} placeholder="Título..." />
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <EditableText value={edu.startDate} onChange={(v) => update.eduField(i, "startDate", v)}
                  variant="caption" sx={{ color: "text.disabled" }} placeholder="Inicio" />
                <Typography variant="caption" color="text.disabled">–</Typography>
                <EditableText value={edu.endDate} onChange={(v) => update.eduField(i, "endDate", v)}
                  variant="caption" sx={{ color: "text.disabled" }} placeholder="Fin" />
              </Box>
            </Box>
            <EditableText value={edu.institution} onChange={(v) => update.eduField(i, "institution", v)}
              variant="caption" sx={{ color: "text.secondary" }} placeholder="Institución..." />
          </Box>
        ))}
      </Box>
    ) : null,

    languages: (cv.languages || []).length > 0 ? (
      <Box>
        <SectionHeader
          icon={<Translate sx={{ fontSize: 16, color: "info.main" }} />}
          title="Idiomas"
          onUp={() => moveSection("languages", -1)}
          onDown={() => moveSection("languages", 1)}
          disableUp={sectionOrder[0] === "languages"}
          disableDown={sectionOrder[sectionOrder.length - 1] === "languages"}
        />
        <Stack direction="row" gap={3} flexWrap="wrap">
          {cv.languages.map((l, i) => (
            <Box key={i}>
              <EditableText value={l.name} onChange={(v) => update.langField(i, "name", v)}
                variant="body2" fontWeight={600} placeholder="Idioma..." />
              <EditableText value={l.level} onChange={(v) => update.langField(i, "level", v)}
                variant="caption" sx={{ color: "text.secondary" }} placeholder="Nivel..." />
            </Box>
          ))}
        </Stack>
      </Box>
    ) : null,

    certifications: (cv.certifications || []).length > 0 ? (
      <Box>
        <SectionHeader
          icon={<MenuBook sx={{ fontSize: 16, color: "secondary.main" }} />}
          title="Formación"
          onUp={() => moveSection("certifications", -1)}
          onDown={() => moveSection("certifications", 1)}
          disableUp={sectionOrder[0] === "certifications"}
          disableDown={sectionOrder[sectionOrder.length - 1] === "certifications"}
        />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {(cv.certifications || []).map((c, i) => (
            <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <Box sx={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                <EditableText value={c.name} onChange={(v) => update.certField(i, "name", v)}
                  variant="body2" fontWeight={500} placeholder="Nombre del certificado..." />
                <Typography variant="caption" color="text.disabled">|</Typography>
                <EditableText value={c.issuer} onChange={(v) => update.certField(i, "issuer", v)}
                  variant="caption" sx={{ color: "primary.light" }} placeholder="Institución..." />
                <Typography variant="caption" color="text.disabled">|</Typography>
                <EditableText value={c.date} onChange={(v) => update.certField(i, "date", v)}
                  variant="caption" sx={{ color: "text.disabled" }} placeholder="Período..." />
              </Box>
              <Tooltip title="Eliminar">
                <IconButton size="small" onClick={() => update.removeCert(i)}
                  sx={{ color: "text.disabled", "&:hover": { color: "error.main" }, width: 20, height: 20 }}>
                  <DeleteOutline sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
          <Button size="small" startIcon={<Add sx={{ fontSize: 13 }} />}
            onClick={() => update.addCert()}
            sx={{ fontSize: 11, color: "text.disabled", alignSelf: "flex-start", "&:hover": { color: "primary.light" } }}>
            Agregar certificación
          </Button>
        </Box>
      </Box>
    ) : null,
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Personal info — always at top, not reorderable */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <EditableText value={pi.name} onChange={(v) => update.personalInfo("name", v)}
            variant="h5" fontWeight={700} placeholder="Tu nombre..." />
          <Stack direction="row" flexWrap="wrap" gap={1} mt={0.5}>
            {["email", "phone", "location", "linkedin", "github", "portfolio"].map((field) => (
              <EditableText key={field} value={pi[field]} onChange={(v) => update.personalInfo(field, v)}
                variant="caption" sx={{ color: "text.secondary" }} placeholder={field + "..."} />
            ))}
          </Stack>
        </Box>
        <PhotoUpload photo={photo} onUpload={onPhotoUpload} onRemove={onPhotoRemove} />
      </Box>

      {/* Reorderable sections */}
      {sectionOrder.map((key) => {
        const section = sectionComponents[key];
        if (!section) return null;
        return (
          <Box key={key}>
            <Divider sx={{ mb: 2 }} />
            {section}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CVPreview({ result, isGenerating }) {
  const { photo, uploadPhoto, removePhoto } = useProfilePhoto();
  const [tab, setTab] = useState(0);
  const [editedCV, setEditedCV] = useState(null);
  const [sectionOrder, setSectionOrder] = useState(SECTION_KEYS);
  const [liveScore, setLiveScore] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const debounceRef = useRef(null);

  // Reset state when a new result arrives
  useEffect(() => {
    if (result?.optimizedCV) {
      setEditedCV(JSON.parse(JSON.stringify(result.optimizedCV)));
      setSectionOrder(SECTION_KEYS);
      setLiveScore(result.finalScore);
    }
  }, [result?.optimizedCV]);

  // Recalculate score 800ms after the user stops editing
  useEffect(() => {
    if (!editedCV || !result?.jdAnalysis) return;
    clearTimeout(debounceRef.current);
    setScoreLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const rawText = formatCVText(editedCV);
        const score = await cvApi.scoreLive(editedCV, result.jdAnalysis, rawText);
        setLiveScore(score);
      } catch {
        // silently ignore score errors
      } finally {
        setScoreLoading(false);
      }
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [editedCV, result?.jdAnalysis]);

  const { exactSet, fuzzySet } = useMemo(() => {
    if (!result?.finalScore) return { exactSet: new Set(), fuzzySet: new Set() };
    const fuzzy = new Set((result.finalScore.keywordsFuzzy || []).map(normWord));
    const exact = new Set(
      (result.finalScore.keywordsFound || []).map(normWord).filter((k) => !fuzzy.has(k))
    );
    return { exactSet: exact, fuzzySet: fuzzy };
  }, [result]);

  // ─── Update helpers ────────────────────────────────────────────────────────
  const update = {
    summary: useCallback((v) => setEditedCV((p) => ({ ...p, summary: v })), []),
    personalInfo: useCallback((field, v) =>
      setEditedCV((p) => ({ ...p, personalInfo: { ...p.personalInfo, [field]: v } })), []),
    expField: useCallback((i, field, v) =>
      setEditedCV((p) => {
        const exp = [...p.experience];
        exp[i] = { ...exp[i], [field]: v };
        return { ...p, experience: exp };
      }), []),
    achievement: useCallback((i, j, v) =>
      setEditedCV((p) => {
        const exp = [...p.experience];
        const ach = [...(exp[i].achievements || [])];
        ach[j] = v;
        exp[i] = { ...exp[i], achievements: ach };
        return { ...p, experience: exp };
      }), []),
    addAchievement: useCallback((i) =>
      setEditedCV((p) => {
        const exp = [...p.experience];
        exp[i] = { ...exp[i], achievements: [...(exp[i].achievements || []), ""] };
        return { ...p, experience: exp };
      }), []),
    removeAchievement: useCallback((i, j) =>
      setEditedCV((p) => {
        const exp = [...p.experience];
        exp[i] = { ...exp[i], achievements: exp[i].achievements.filter((_, k) => k !== j) };
        return { ...p, experience: exp };
      }), []),
    skillCategory: useCallback((i, v) =>
      setEditedCV((p) => {
        const skills = [...p.skills];
        skills[i] = { ...skills[i], category: v };
        return { ...p, skills };
      }), []),
    skillItem: useCallback((i, j, v) =>
      setEditedCV((p) => {
        const skills = [...p.skills];
        const items = [...skills[i].items];
        items[j] = v;
        skills[i] = { ...skills[i], items };
        return { ...p, skills };
      }), []),
    addSkillItem: useCallback((i) =>
      setEditedCV((p) => {
        const skills = [...p.skills];
        skills[i] = { ...skills[i], items: [...skills[i].items, ""] };
        return { ...p, skills };
      }), []),
    removeSkillItem: useCallback((i, j) =>
      setEditedCV((p) => {
        const skills = [...p.skills];
        skills[i] = { ...skills[i], items: skills[i].items.filter((_, k) => k !== j) };
        return { ...p, skills };
      }), []),
    moveSkill: useCallback((fromCatIdx, fromItemIdx, toCatIdx) =>
      setEditedCV((p) => {
        const skills = p.skills.map((sg) => ({ ...sg, items: [...sg.items] }));
        const [skill] = skills[fromCatIdx].items.splice(fromItemIdx, 1);
        skills[toCatIdx].items.push(skill);
        return { ...p, skills };
      }), []),
    eduField: useCallback((i, field, v) =>
      setEditedCV((p) => {
        const education = [...p.education];
        education[i] = { ...education[i], [field]: v };
        return { ...p, education };
      }), []),
    langField: useCallback((i, field, v) =>
      setEditedCV((p) => {
        const languages = [...p.languages];
        languages[i] = { ...languages[i], [field]: v };
        return { ...p, languages };
      }), []),
    addExp: useCallback(() =>
      setEditedCV((p) => {
        const exp = [...p.experience];
        const projIdx = exp.findIndex((e) => /proyecto[s]?\s+destacados?/i.test(e.role || ""));
        const idx = projIdx === -1 ? exp.length : projIdx;
        exp.splice(idx, 0, { role: "", company: "", startDate: "", endDate: "", achievements: [] });
        return { ...p, experience: exp };
      }), []),
    removeExp: useCallback((i) =>
      setEditedCV((p) => ({
        ...p,
        experience: p.experience.filter((_, k) => k !== i),
      })), []),
    certField: useCallback((i, field, v) =>
      setEditedCV((p) => {
        const certifications = [...(p.certifications || [])];
        certifications[i] = { ...certifications[i], [field]: v };
        return { ...p, certifications };
      }), []),
    addCert: useCallback(() =>
      setEditedCV((p) => ({
        ...p,
        certifications: [...(p.certifications || []), { name: "", issuer: "", date: "" }],
      })), []),
    removeCert: useCallback((i) =>
      setEditedCV((p) => ({
        ...p,
        certifications: (p.certifications || []).filter((_, k) => k !== i),
      })), []),
  };

  const moveSection = useCallback((key, dir) => {
    setSectionOrder((prev) => {
      const idx = prev.indexOf(key);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);

  const resetEdits = useCallback(() => {
    if (result?.optimizedCV) {
      setEditedCV(JSON.parse(JSON.stringify(result.optimizedCV)));
      setSectionOrder(SECTION_KEYS);
    }
  }, [result]);

  if (isGenerating) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {[80, 40, 60, 40, 55, 40].map((w, i) => (
          <Skeleton key={i} variant="rounded" height={14} width={`${w}%`} />
        ))}
      </Box>
    );
  }

  if (!result || !editedCV) return null;

  const filename = `CV_ATS_${new Date().toISOString().slice(0, 10)}`;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, py: 0, fontSize: 13 } }}
        >
          <Tab label="Vista estructurada" />
          <Tab label="Texto plano" />
        </Tabs>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {/* Live ATS score badge */}
          {liveScore && (
            <Tooltip title={`Score ATS en tiempo real · ${liveScore.keywordsFound?.length ?? 0} keywords encontradas`}>
              <Box sx={{
                display: "flex", alignItems: "center", gap: 0.75,
                px: 1.25, py: 0.4, borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.04)",
                border: `1px solid ${scoreColor(liveScore.score)}40`,
              }}>
                {scoreLoading
                  ? <CircularProgress size={12} sx={{ color: "text.disabled" }} />
                  : <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: scoreColor(liveScore.score) }} />
                }
                <Typography variant="caption" fontWeight={700} sx={{ color: scoreColor(liveScore.score) }}>
                  ATS {liveScore.score}
                </Typography>
                <Typography variant="caption" color="text.disabled">/100</Typography>
              </Box>
            </Tooltip>
          )}

          {tab === 0 && (
            <Tooltip title="Deshacer todos los cambios">
              <IconButton size="small" onClick={resetEdits} sx={{ color: "text.disabled" }}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <CopyButton getText={() => formatCVText(editedCV)} />
          <DownloadTxtButton getText={() => formatCVText(editedCV)} filename={`${filename}.txt`} />
          <DownloadPdfButton getCV={() => editedCV} filename={`${filename}.pdf`} getPhoto={() => photo} />
        </Box>
      </Box>

      {tab === 0 && (
        <StructuredEditor
          cv={editedCV}
          update={update}
          sectionOrder={sectionOrder}
          moveSection={moveSection}
          exactSet={exactSet}
          fuzzySet={fuzzySet}
          photo={photo}
          onPhotoUpload={uploadPhoto}
          onPhotoRemove={removePhoto}
        />
      )}

      {tab === 1 && (
        <Box component="pre" sx={{
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: 12, lineHeight: 1.8, color: "text.secondary",
          whiteSpace: "pre-wrap", wordBreak: "break-word", m: 0, p: 0,
        }}>
          {formatCVText(editedCV)}
        </Box>
      )}
    </Box>
  );
}
