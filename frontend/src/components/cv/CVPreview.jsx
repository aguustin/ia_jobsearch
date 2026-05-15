import { useState } from "react";
import {
  Box, Typography, Button, Tabs, Tab, Divider,
  Chip, Stack, IconButton, Tooltip, Skeleton,
} from "@mui/material";
import {
  ContentCopy, Download, CheckCircle, Person,
  Work, School, Code, Translate,
} from "@mui/icons-material";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
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

function DownloadButton({ text, filename }) {
  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={<Download />}
      onClick={handleDownload}
      sx={{ fontSize: 12 }}
    >
      Exportar .txt
    </Button>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
      {icon}
      <Typography variant="subtitle2" color="primary.light" fontWeight={600}>
        {title}
      </Typography>
    </Box>
  );
}

function StructuredView({ cv }) {
  const pi = cv.personalInfo || {};

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box>
        {pi.name && (
          <Typography variant="h5" fontWeight={700} mb={0.5}>
            {pi.name}
          </Typography>
        )}
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {[pi.email, pi.phone, pi.location, pi.linkedin, pi.github]
            .filter(Boolean)
            .map((val, i) => (
              <Typography key={i} variant="caption" color="text.secondary">
                {val}
              </Typography>
            ))}
        </Stack>
      </Box>

      {cv.summary && (
        <>
          <Divider />
          <Box>
            <SectionHeader icon={<Person sx={{ fontSize: 16, color: "primary.main" }} />} title="Resumen Profesional" />
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {cv.summary}
            </Typography>
          </Box>
        </>
      )}

      {(cv.experience || []).length > 0 && (
        <>
          <Divider />
          <Box>
            <SectionHeader icon={<Work sx={{ fontSize: 16, color: "secondary.main" }} />} title="Experiencia Profesional" />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {cv.experience.map((exp, i) => (
                <Box key={i}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{exp.role}</Typography>
                    <Typography variant="caption" color="text.disabled">
                      {[exp.startDate, exp.endDate || "Presente"].filter(Boolean).join(" – ")}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="primary.light" mb={0.75} display="block">
                    {exp.company}
                  </Typography>
                  {(exp.achievements || []).map((a, j) => (
                    <Box key={j} sx={{ display: "flex", gap: 1, mb: 0.4 }}>
                      <Typography variant="caption" color="primary.main" mt={0.1}>•</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {a}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </>
      )}

      {(cv.skills || []).length > 0 && (
        <>
          <Divider />
          <Box>
            <SectionHeader icon={<Code sx={{ fontSize: 16, color: "warning.main" }} />} title="Habilidades Técnicas" />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {cv.skills.map((sg, i) => (
                <Box key={i}>
                  {sg.category && (
                    <Typography variant="caption" color="text.disabled" fontWeight={600} display="block" mb={0.5}>
                      {sg.category}
                    </Typography>
                  )}
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {(sg.items || []).map((skill, j) => (
                      <Chip
                        key={j}
                        label={skill}
                        size="small"
                        sx={{
                          fontSize: 11,
                          height: 22,
                          bgcolor: "rgba(108,99,255,0.1)",
                          color: "primary.light",
                          border: "1px solid rgba(108,99,255,0.2)",
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Box>
          </Box>
        </>
      )}

      {(cv.education || []).length > 0 && (
        <>
          <Divider />
          <Box>
            <SectionHeader icon={<School sx={{ fontSize: 16, color: "success.main" }} />} title="Educación" />
            {cv.education.map((edu, i) => (
              <Box key={i} sx={{ mb: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                  <Typography variant="body2" fontWeight={600}>{edu.degree}</Typography>
                  <Typography variant="caption" color="text.disabled">
                    {[edu.startDate, edu.endDate].filter(Boolean).join(" – ")}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">{edu.institution}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      {(cv.languages || []).length > 0 && (
        <>
          <Divider />
          <Box>
            <SectionHeader icon={<Translate sx={{ fontSize: 16, color: "info.main" }} />} title="Idiomas" />
            <Stack direction="row" gap={2}>
              {cv.languages.map((l, i) => (
                <Box key={i}>
                  <Typography variant="body2" fontWeight={600}>{l.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{l.level}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </>
      )}
    </Box>
  );
}

export function CVPreview({ result, isGenerating }) {
  const [tab, setTab] = useState(0);

  if (isGenerating) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {[80, 40, 60, 40, 55, 40].map((w, i) => (
          <Skeleton key={i} variant="rounded" height={14} width={`${w}%`} />
        ))}
      </Box>
    );
  }

  if (!result) return null;

  const { optimizedCV, optimizedText } = result;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, py: 0, fontSize: 13 } }}
        >
          <Tab label="Vista estructurada" />
          <Tab label="Texto plano" />
        </Tabs>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <CopyButton text={optimizedText} />
          <DownloadButton
            text={optimizedText}
            filename={`CV_ATS_optimizado_${new Date().toISOString().slice(0, 10)}.txt`}
          />
        </Box>
      </Box>

      {tab === 0 && <StructuredView cv={optimizedCV} />}

      {tab === 1 && (
        <Box
          component="pre"
          sx={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 12,
            lineHeight: 1.8,
            color: "text.secondary",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            m: 0,
            p: 0,
          }}
        >
          {optimizedText}
        </Box>
      )}
    </Box>
  );
}
