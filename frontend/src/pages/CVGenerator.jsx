import { useState } from "react";
import {
  Box, Typography, Grid, Card, CardContent, CardHeader,
  Button, Divider, List, ListItemButton, ListItemText,
  ListItemIcon, ListItemSecondaryAction, IconButton,
  Chip, Tooltip, Alert, Skeleton, Tabs, Tab,
} from "@mui/material";
import {
  AutoAwesome as AtsIcon,
  InsertDriveFile as FileIcon,
  DeleteOutline as DeleteIcon,
  CheckCircle as SelectedIcon,
  RadioButtonUnchecked as UnselectedIcon,
  PictureAsPdf as PdfIcon,
  Article as DocxIcon,
  CompareArrows as CompareIcon,
} from "@mui/icons-material";
import { CVUploader } from "../components/cv/CVUploader.jsx";
import { JobDescriptionPanel } from "../components/cv/JobDescriptionPanel.jsx";
import { ATSScorePanel } from "../components/cv/ATSScorePanel.jsx";
import { CVPreview } from "../components/cv/CVPreview.jsx";
import { CVComparison } from "../components/cv/CVComparison.jsx";
import { useCVGenerator } from "../hooks/useCVGenerator.js";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CVListPanel({ cvList, selectedCVId, onSelect, onDelete, loadingCVs, isUploading }) {
  if (loadingCVs) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
        {[1, 2].map((i) => <Skeleton key={i} variant="rounded" height={56} />)}
      </Box>
    );
  }

  if (!cvList.length && !isUploading) {
    return (
      <Box sx={{ textAlign: "center", py: 3, color: "text.disabled" }}>
        <FileIcon sx={{ fontSize: 32, opacity: 0.3, mb: 0.5 }} />
        <Typography variant="caption" display="block">
          Aún no subiste ningún CV
        </Typography>
      </Box>
    );
  }

  return (
    <List dense disablePadding>
      {cvList.map((cv) => {
        const isSelected = cv._id === selectedCVId;
        const isPdf = cv.mimeType === "application/pdf";

        return (
          <ListItemButton
            key={cv._id}
            selected={isSelected}
            onClick={() => onSelect(cv._id)}
            sx={{
              borderRadius: 1.5,
              mb: 0.5,
              border: "1px solid",
              borderColor: isSelected ? "primary.main" : "transparent",
              bgcolor: isSelected ? "rgba(108,99,255,0.08)" : "transparent",
              "&.Mui-selected": { bgcolor: "rgba(108,99,255,0.08)" },
              "&:hover": { borderColor: "rgba(108,99,255,0.3)" },
              pr: 5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {isPdf
                ? <PdfIcon sx={{ fontSize: 18, color: "#EF5350" }} />
                : <DocxIcon sx={{ fontSize: 18, color: "#42A5F5" }} />}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" noWrap sx={{ maxWidth: 150 }} fontWeight={isSelected ? 600 : 400}>
                  {cv.originalName}
                </Typography>
              }
              secondary={
                <Typography variant="caption" color="text.disabled">
                  {cv.parsed?.personalInfo?.name || formatDate(cv.uploadedAt)}
                </Typography>
              }
            />
            <ListItemSecondaryAction>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {isSelected
                  ? <SelectedIcon sx={{ fontSize: 16, color: "primary.main" }} />
                  : <UnselectedIcon sx={{ fontSize: 16, color: "text.disabled" }} />}
                <Tooltip title="Eliminar CV">
                  <IconButton
                    size="small"
                    edge="end"
                    onClick={(e) => { e.stopPropagation(); onDelete(cv._id); }}
                    sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItemSecondaryAction>
          </ListItemButton>
        );
      })}
    </List>
  );
}

export function CVGenerator() {
  const [mainTab, setMainTab] = useState(0);
  const {
    cvList, loadingCVs,
    selectedCVId, setSelectedCVId, selectedCV,
    jobDescription, setJobDescription,
    atsResult,
    handleUpload, handleDelete, handleGenerate,
    isUploading, isGenerating, canGenerate,
  } = useCVGenerator();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AtsIcon sx={{ color: "primary.main", fontSize: 28 }} />
            <Typography variant="h5">Generador Inteligente de CV ATS</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Optimizá tu CV con IA para pasar los filtros ATS de cualquier oferta laboral
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          {selectedCV && mainTab === 0 && (
            <Chip
              label={`CV: ${selectedCV.originalName}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          <Tabs
            value={mainTab}
            onChange={(_, v) => setMainTab(v)}
            sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, py: 0, fontSize: 13 } }}
          >
            <Tab label="Optimizar CV" icon={<AtsIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
            <Tab label="Comparar CVs" icon={<CompareIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
          </Tabs>
        </Box>
      </Box>

      {/* Tab: Optimizar CV */}
      {mainTab === 0 && (
        <>
          <Grid container spacing={2.5}>
            {/* Left: Upload + CV list */}
            <Grid item xs={12} md={3}>
              <Card sx={{ height: "100%" }}>
                <CardHeader
                  title="Mis CVs"
                  titleTypographyProps={{ variant: "subtitle2", fontWeight: 600 }}
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ pt: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <CVUploader onUpload={handleUpload} isUploading={isUploading} />
                  <Divider />
                  <CVListPanel
                    cvList={cvList}
                    selectedCVId={selectedCVId}
                    onSelect={setSelectedCVId}
                    onDelete={handleDelete}
                    loadingCVs={loadingCVs}
                    isUploading={isUploading}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Center: Job description + Generate */}
            <Grid item xs={12} md={5}>
              <Card sx={{ height: "100%" }}>
                <CardHeader
                  title="Descripción laboral"
                  titleTypographyProps={{ variant: "subtitle2", fontWeight: 600 }}
                  subheader="Pegá la oferta para la que querés optimizar el CV"
                  subheaderTypographyProps={{ variant: "caption" }}
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ pt: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <JobDescriptionPanel
                    value={jobDescription}
                    onChange={setJobDescription}
                    disabled={isGenerating}
                  />

                  {!selectedCVId && jobDescription.length > 0 && (
                    <Alert severity="info" sx={{ fontSize: 12 }}>
                      Seleccioná un CV del panel izquierdo para continuar
                    </Alert>
                  )}

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AtsIcon />}
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    loading={isGenerating}
                    fullWidth
                    sx={{
                      py: 1.5,
                      fontSize: 14,
                      background: canGenerate
                        ? "linear-gradient(135deg, #6C63FF 0%, #00D9C5 100%)"
                        : undefined,
                      "&:hover": { opacity: 0.9 },
                    }}
                  >
                    {isGenerating ? "Generando CV optimizado..." : "Generar CV Optimizado ATS"}
                  </Button>

                  {isGenerating && (
                    <Alert severity="info" sx={{ fontSize: 12 }}>
                      La IA está analizando la oferta y optimizando tu CV. Esto puede tardar entre 1 y 3 minutos dependiendo del hardware.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Right: ATS Score */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardHeader
                  title="Score ATS"
                  titleTypographyProps={{ variant: "subtitle2", fontWeight: 600 }}
                  subheader="Análisis de compatibilidad con la oferta"
                  subheaderTypographyProps={{ variant: "caption" }}
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ pt: 0 }}>
                  <ATSScorePanel result={atsResult} isGenerating={isGenerating} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Bottom: CV Preview */}
          {(atsResult || isGenerating) && (
            <Card>
              <CardHeader
                title="CV Optimizado"
                titleTypographyProps={{ variant: "subtitle2", fontWeight: 600 }}
                subheader={
                  atsResult
                    ? `Score final: ${atsResult.finalScore.score}/100 — ${atsResult.finalScore.keywordsFound.length} keywords ATS incorporadas`
                    : "Generando..."
                }
                subheaderTypographyProps={{ variant: "caption" }}
                sx={{ pb: 1 }}
              />
              <Divider />
              <CardContent>
                <CVPreview result={atsResult} isGenerating={isGenerating} />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Tab: Comparar CVs */}
      {mainTab === 1 && (
        <Card>
          <CardHeader
            title="Comparar CVs"
            titleTypographyProps={{ variant: "subtitle2", fontWeight: 600 }}
            subheader="Comparé dos CVs contra la misma oferta para ver cuál tiene mejor fit ATS"
            subheaderTypographyProps={{ variant: "caption" }}
            sx={{ pb: 1 }}
          />
          <CardContent>
            {cvList.length < 2 ? (
              <Alert severity="info" sx={{ fontSize: 12 }}>
                Necesitás al menos 2 CVs cargados para usar la comparación. Subí más CVs desde la pestaña "Optimizar CV".
              </Alert>
            ) : (
              <CVComparison cvList={cvList} />
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
