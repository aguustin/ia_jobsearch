import {
  Box, Typography, Card, CardContent, Button, Chip, Stack,
  Divider, List, ListItem, ListItemIcon, ListItemText,
  TextField, CircularProgress, Alert, Tabs, Tab, Grid, Tooltip,
  Checkbox, LinearProgress, Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import {
  ArrowBack, OpenInNew, CheckCircle, Cancel, Warning,
  AutoAwesome, BookmarkAdd, Send, Refresh, ContentCopy,
  UploadFile, Person, AttachFile, Code, Psychology,
  QuestionAnswer, ExpandMore, EmojiEvents,
} from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, applicationsApi, profileApi } from "../api/client.js";
import { ScoreGauge } from "../components/ScoreGauge.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { useAppStore } from "../store/index.js";

export function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useAppStore((s) => s.notify);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [tab, setTab] = useState(0);
  const [editMessage, setEditMessage] = useState("");
  const [cvAttached, setCvAttached] = useState(null); // { name, source: "profile"|"file" }

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => jobsApi.get(id),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.get,
  });

  useEffect(() => {
    if (job?.applicationMessage && !editMessage) setEditMessage(job.applicationMessage);
  }, [job?.applicationMessage]);

  const generateMutation = useMutation({
    mutationFn: () => jobsApi.generateMessage(id, { tone: "professional", language: "spanish" }),
    onSuccess: (data) => {
      setEditMessage(data.message?.trim() || "");
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      notify("Mensaje generado con IA", "success");
    },
    onError: (err) => {
      console.error("Generate error:", err);
      notify("Error al generar el mensaje. Verificá que Ollama esté activo.", "error");
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: () => jobsApi.analyze(id),
    onSuccess: () => {
      notify("Análisis iniciado", "info");
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["job", id] }), 8000);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status) => jobsApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job", id] }),
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      applicationsApi.create({
        jobId: id,
        message: editMessage,
        status: "sent",
        sentAt: new Date().toISOString(),
        cvVersion: cvAttached?.name || null,
      }),
    onSuccess: () => {
      notify("Aplicación registrada como Enviada", "success");
      queryClient.invalidateQueries({ queryKey: ["job", id] });
    },
    onError: () => notify("Error al registrar la aplicación", "error"),
  });

  const copyMessage = () => {
    navigator.clipboard.writeText(editMessage);
    notify("Mensaje copiado al portapapeles", "success");
  };

  const handleUseProfileCV = () => {
    if (!profile?.cvText) {
      notify("No tenés CV en tu perfil. Agregalo en la sección Perfil.", "warning");
      return;
    }
    setCvAttached({ name: "CV del perfil", source: "profile" });
    notify("CV del perfil seleccionado", "success");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["application/pdf", "text/plain", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|txt|doc|docx)$/i)) {
      notify("Formato no soportado. Usá PDF, DOC o TXT.", "error");
      return;
    }
    setCvAttached({ name: file.name, source: "file" });
    notify(`CV "${file.name}" adjuntado`, "success");
    e.target.value = "";
  };

  if (isLoading) return <Box sx={{ p: 4 }}><CircularProgress /></Box>;
  if (!job) return <Alert severity="error">Oferta no encontrada</Alert>;

  const analysis = job.analysis;
  const alreadyApplied = job.status === "applied";

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate("/jobs")} sx={{ mb: 2 }}>
        Volver
      </Button>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
            <ScoreGauge score={analysis?.score} size={100} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
                <StatusBadge status={job.status} size="medium" />
                <Chip label={job.source} size="small" variant="outlined" />
                {job.remote && <Chip label="Remoto" size="small" color="info" />}
                {job.language && (
                  <Chip label={job.language === "es" ? "Español" : "Inglés"} size="small" variant="outlined" />
                )}
                {analysis?.seniority && analysis.seniority !== "unknown" && (
                  <Chip label={analysis.seniority} size="small" variant="outlined" />
                )}
              </Box>
              <Typography variant="h5">{job.title}</Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                {job.company} · {job.location}
              </Typography>
              {job.salary?.raw && (
                <Chip label={job.salary.raw} size="small" color="success" variant="outlined" />
              )}
            </Box>
            <Stack spacing={1} alignItems="flex-end">
              <Button variant="outlined" startIcon={<OpenInNew />} href={job.url} target="_blank" size="small">
                Ver oferta
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                size="small"
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending || job.status === "analyzing"}
              >
                Re-analizar
              </Button>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<BookmarkAdd />}
              size="small"
              onClick={() => statusMutation.mutate("shortlisted")}
              disabled={job.status === "shortlisted"}
            >
              Seleccionar
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              size="small"
              onClick={() => statusMutation.mutate("rejected")}
            >
              Descartar
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Análisis IA" />
        <Tab label="Descripción" />
        <Tab label="Aplicar" />
        <Tab label="Entrevista" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2}>
          {analysis ? (
            <>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Resumen del análisis
                    </Typography>
                    <Typography>{analysis.summary}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="success.main" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <CheckCircle fontSize="small" /> Por qué encaja
                    </Typography>
                    <List dense disablePadding>
                      {analysis.matchReasons?.map((r, i) => (
                        <ListItem key={i} disablePadding sx={{ py: 0.3 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "success.main" }} />
                          </ListItemIcon>
                          <ListItemText primary={r} primaryTypographyProps={{ variant: "body2" }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Warning fontSize="small" /> Skills faltantes
                    </Typography>
                    <List dense disablePadding>
                      {analysis.missingSkills?.map((s, i) => (
                        <ListItem key={i} disablePadding sx={{ py: 0.3 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "warning.main" }} />
                          </ListItemIcon>
                          <ListItemText primary={s} primaryTypographyProps={{ variant: "body2" }} />
                        </ListItem>
                      ))}
                      {!analysis.missingSkills?.length && (
                        <Typography variant="body2" color="success.main">¡Sin brechas detectadas!</Typography>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="primary.main" gutterBottom>
                      Aspectos destacados
                    </Typography>
                    {analysis.highlights?.map((h, i) => (
                      <Chip key={i} label={h} size="small" sx={{ mr: 0.5, mb: 0.5 }} color="primary" variant="outlined" />
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="error.main" gutterBottom>
                      Posibles preocupaciones
                    </Typography>
                    {analysis.concerns?.length ? analysis.concerns.map((c, i) => (
                      <Chip key={i} label={c} size="small" sx={{ mr: 0.5, mb: 0.5 }} color="error" variant="outlined" />
                    )) : <Typography variant="body2" color="text.secondary">Sin observaciones</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: "center", py: 6 }}>
                  <AutoAwesome sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                  <Typography color="text.secondary" gutterBottom>
                    Esta oferta aún no fue analizada por IA.
                  </Typography>
                  <Button variant="contained" onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
                    Analizar ahora
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              {job.tags?.map((t) => <Chip key={t} label={t} size="small" variant="outlined" />)}
            </Box>
            <Typography
              variant="body2"
              component="pre"
              sx={{ whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.7 }}
            >
              {job.description || "Sin descripción disponible."}
            </Typography>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Stack spacing={2}>
          {alreadyApplied && (
            <Alert severity="success" icon={<CheckCircle />}>
              Ya registraste una aplicación para esta oferta.
            </Alert>
          )}

          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Mensaje de aplicación
                </Typography>
                <Button
                  startIcon={generateMutation.isPending
                    ? <CircularProgress size={14} color="inherit" />
                    : <AutoAwesome />}
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  size="small"
                  variant="outlined"
                  color="secondary"
                >
                  {generateMutation.isPending ? "Generando..." : "Generar con IA"}
                </Button>
              </Box>

              <TextField
                multiline
                minRows={8}
                fullWidth
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                placeholder="Generá el mensaje con IA o escribilo manualmente."
                sx={{ mb: 2 }}
              />

              {/* CV section */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: cvAttached ? "secondary.main" : "divider",
                  mb: 2,
                  bgcolor: cvAttached ? "rgba(0,217,197,0.05)" : "transparent",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AttachFile sx={{ fontSize: 18, color: cvAttached ? "secondary.main" : "text.secondary" }} />
                    <Typography variant="body2" color={cvAttached ? "secondary.main" : "text.secondary"}>
                      {cvAttached ? cvAttached.name : "Sin CV adjunto"}
                    </Typography>
                    {cvAttached && (
                      <Chip
                        label={cvAttached.source === "profile" ? "Perfil" : "Archivo"}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        onDelete={() => setCvAttached(null)}
                        sx={{ fontSize: 11 }}
                      />
                    )}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Usar el CV guardado en tu perfil">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Person />}
                        onClick={handleUseProfileCV}
                        disabled={!profile?.cvText}
                      >
                        CV del perfil
                      </Button>
                    </Tooltip>
                    <Tooltip title="Subir PDF, DOC o TXT">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<UploadFile />}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Subir archivo
                      </Button>
                    </Tooltip>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                    />
                  </Stack>
                </Box>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button startIcon={<ContentCopy />} onClick={copyMessage} variant="outlined" size="small">
                  Copiar mensaje
                </Button>
                <Button
                  startIcon={applyMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <Send />}
                  variant="contained"
                  size="small"
                  onClick={() => applyMutation.mutate()}
                  disabled={!editMessage || applyMutation.isPending || alreadyApplied}
                >
                  {alreadyApplied ? "Ya aplicaste" : "Registrar como Enviada"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {job.cvAdaptations && (
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Sugerencias para adaptar el CV
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{ whiteSpace: "pre-wrap", fontFamily: "inherit", color: "text.secondary", lineHeight: 1.7 }}
                >
                  {job.cvAdaptations}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}

      {tab === 3 && (
        <InterviewPrepTab job={job} jobId={id} />
      )}
    </Box>
  );
}

// ── Interview Prep Tab ──────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  technical: {
    label: "Preguntas técnicas",
    icon: <Code fontSize="small" />,
    color: "#6C63FF",
    bg: "rgba(108,99,255,0.08)",
  },
  behavioral: {
    label: "Preguntas de comportamiento",
    icon: <Psychology fontSize="small" />,
    color: "#00D9C5",
    bg: "rgba(0,217,197,0.08)",
  },
  company: {
    label: "Preguntas para el entrevistador",
    icon: <QuestionAnswer fontSize="small" />,
    color: "#FFB74D",
    bg: "rgba(255,183,77,0.08)",
  },
};

function InterviewPrepTab({ job, jobId }) {
  const notify = useAppStore((s) => s.notify);
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState(job.interviewPrep?.questions || []);

  useEffect(() => {
    setQuestions(job.interviewPrep?.questions || []);
  }, [job.interviewPrep]);

  const generateMutation = useMutation({
    mutationFn: () => jobsApi.generateInterviewPrep(jobId),
    onSuccess: (data) => {
      setQuestions(data.questions || []);
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      notify("Preguntas generadas", "success");
    },
    onError: () => notify("Error al generar las preguntas. Verificá que Ollama esté activo.", "error"),
  });

  const saveMutation = useMutation({
    mutationFn: (updated) => jobsApi.updateInterviewPrep(jobId, updated),
  });

  const togglePracticed = (index) => {
    const updated = questions.map((q, i) =>
      i === index ? { ...q, practiced: !q.practiced } : q
    );
    setQuestions(updated);
    saveMutation.mutate(updated);
  };

  const practiced = questions.filter((q) => q.practiced).length;
  const total = questions.length;

  const grouped = Object.fromEntries(
    ["technical", "behavioral", "company"].map((cat) => [
      cat,
      questions
        .map((q, i) => ({ ...q, originalIndex: i }))
        .filter((q) => q.category === cat),
    ])
  );

  return (
    <Stack spacing={2}>
      {/* Header card */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Preparación para la entrevista
              </Typography>
              <Typography variant="body2" color="text.secondary">
                La IA genera preguntas específicas para este puesto y tu perfil.
              </Typography>
            </Box>
            <Button
              variant={questions.length ? "outlined" : "contained"}
              startIcon={
                generateMutation.isPending
                  ? <CircularProgress size={14} color="inherit" />
                  : <AutoAwesome />
              }
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              color="secondary"
            >
              {generateMutation.isPending
                ? "Generando..."
                : questions.length
                ? "Regenerar"
                : "Generar preguntas"}
            </Button>
          </Box>

          {total > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Progreso de práctica
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  {practiced}/{total}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(practiced / total) * 100}
                color={practiced === total ? "success" : "primary"}
                sx={{ borderRadius: 1, height: 6 }}
              />
              {practiced === total && total > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                  <EmojiEvents sx={{ fontSize: 16, color: "warning.main" }} />
                  <Typography variant="caption" color="warning.main" fontWeight={600}>
                    ¡Practicaste todas las preguntas!
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Questions grouped by category */}
      {total === 0 && !generateMutation.isPending && (
        <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
          <QuestionAnswer sx={{ fontSize: 48, mb: 2, opacity: 0.4 }} />
          <Typography>Generá las preguntas para empezar a practicar.</Typography>
        </Box>
      )}

      {["technical", "behavioral", "company"].map((cat) => {
        const cfg = CATEGORY_CONFIG[cat];
        const items = grouped[cat] || [];
        if (!items.length) return null;

        return (
          <Accordion
            key={cat}
            defaultExpanded
            sx={{
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              "&:before": { display: "none" },
              borderRadius: "12px !important",
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ color: cfg.color }}>{cfg.icon}</Box>
                <Typography fontWeight={600} sx={{ color: cfg.color }}>
                  {cfg.label}
                </Typography>
                <Chip
                  label={`${items.filter((q) => q.practiced).length}/${items.length}`}
                  size="small"
                  sx={{ ml: 1, bgcolor: cfg.bg, color: cfg.color, fontSize: 11 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Stack spacing={1.5}>
                {items.map((q) => (
                  <Box
                    key={q.originalIndex}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: q.practiced ? cfg.bg : "rgba(255,255,255,0.02)",
                      border: "1px solid",
                      borderColor: q.practiced ? cfg.color + "55" : "divider",
                      transition: "all 0.2s",
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                      <Tooltip title={q.practiced ? "Marcar como no practicada" : "Marcar como practicada"}>
                        <Checkbox
                          checked={q.practiced}
                          onChange={() => togglePracticed(q.originalIndex)}
                          size="small"
                          sx={{ p: 0.5, mt: 0.2, color: cfg.color, "&.Mui-checked": { color: cfg.color } }}
                        />
                      </Tooltip>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            textDecoration: q.practiced ? "line-through" : "none",
                            opacity: q.practiced ? 0.6 : 1,
                          }}
                        >
                          {q.question}
                        </Typography>
                        {q.hint && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: "block", fontStyle: "italic" }}
                          >
                            💡 {q.hint}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}
