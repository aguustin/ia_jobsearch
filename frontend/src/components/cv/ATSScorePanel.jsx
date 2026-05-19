import {
  Box, Typography, Chip, Stack, LinearProgress,
  CircularProgress as MuiCircular, Divider, List,
  ListItem, ListItemIcon, ListItemText, Skeleton, Tooltip,
} from "@mui/material";
import {
  CheckCircleOutline, HighlightOff, TipsAndUpdates,
  TrendingUp, TrendingFlat, Commit, SignalCellularAlt,
} from "@mui/icons-material";
import { scoreColor, scoreLabel } from "../../theme.js";

const CONFIDENCE_CONFIG = {
  high:   { label: "Alta confianza",   color: "success.main",  bg: "rgba(76,175,80,0.1)",  border: "rgba(76,175,80,0.3)"  },
  medium: { label: "Confianza media",  color: "warning.main",  bg: "rgba(255,183,77,0.1)", border: "rgba(255,183,77,0.3)" },
  low:    { label: "Confianza baja",   color: "error.light",   bg: "rgba(239,83,80,0.1)",  border: "rgba(239,83,80,0.3)"  },
  none:   { label: "Sin datos de JD",  color: "text.disabled", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
};

function ConfidenceBadge({ confidence }) {
  const cfg = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG.none;
  return (
    <Tooltip title="Indica qué tan representativo es el score según las keywords extraídas de la oferta">
      <Chip
        icon={<SignalCellularAlt sx={{ fontSize: "13px !important", color: `${cfg.color} !important` }} />}
        label={cfg.label}
        size="small"
        sx={{
          height: 22,
          fontSize: 11,
          bgcolor: cfg.bg,
          color: cfg.color,
          border: `1px solid ${cfg.border}`,
        }}
      />
    </Tooltip>
  );
}

// ─── Score Ring ──────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 90, label }) {
  const color = scoreColor(score);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <MuiCircular variant="determinate" value={100} size={size} thickness={5}
          sx={{ color: "rgba(255,255,255,0.06)", position: "absolute" }} />
        <MuiCircular variant="determinate" value={score} size={size} thickness={5}
          sx={{ color }} />
        <Box sx={{
          top: 0, left: 0, bottom: 0, right: 0, position: "absolute",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <Typography variant="h5" fontWeight={700} sx={{ color, lineHeight: 1 }}>
            {score}
          </Typography>
          <Typography variant="caption" color="text.disabled" fontSize={9}>/ 100</Typography>
        </Box>
      </Box>
      {label && (
        <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
      )}
    </Box>
  );
}

// ─── Before / After comparison ───────────────────────────────────────────────

function ScoreComparison({ initialScore, finalScore }) {
  const gain = finalScore.score - initialScore.score;
  const GainIcon = gain > 0 ? TrendingUp : TrendingFlat;
  const gainColor = gain > 0 ? "success.main" : "text.disabled";

  return (
    <Box sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      p: 2,
      borderRadius: 2,
      bgcolor: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
    }}>
      {/* Before */}
      <ScoreRing score={initialScore.score} size={80} label="Antes" />

      {/* Arrow + gain */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
        <GainIcon sx={{ fontSize: 28, color: gainColor }} />
        {gain !== 0 && (
          <Chip
            label={`${gain > 0 ? "+" : ""}${gain} pts`}
            size="small"
            sx={{
              height: 20,
              fontSize: 11,
              bgcolor: gain > 0 ? "rgba(76,175,80,0.12)" : "rgba(255,255,255,0.06)",
              color: gainColor,
              border: `1px solid ${gain > 0 ? "rgba(76,175,80,0.3)" : "rgba(255,255,255,0.1)"}`,
            }}
          />
        )}
      </Box>

      {/* After */}
      <ScoreRing score={finalScore.score} size={80} label="Después" />
    </Box>
  );
}

// ─── Breakdown bars ───────────────────────────────────────────────────────────

function BreakdownBar({ label, value, max, color }) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" color="text.primary" fontWeight={600}>
          {value}
          <Typography component="span" variant="caption" color="text.disabled">/{max}</Typography>
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, (value / max) * 100)}
        sx={{
          height: 5, borderRadius: 3,
          bgcolor: "rgba(255,255,255,0.06)",
          "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 },
        }}
      />
    </Box>
  );
}

// ─── Keyword chips ────────────────────────────────────────────────────────────

function KeywordChips({ items, fuzzyItems = [], color, emptyLabel }) {
  const fuzzySet = new Set(fuzzyItems);
  if (!items?.length) {
    return <Typography variant="caption" color="text.disabled">{emptyLabel}</Typography>;
  }
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.5}>
      {items.map((kw) => {
        const isFuzzy = fuzzySet.has(kw);
        return (
          <Tooltip
            key={kw}
            title={isFuzzy ? "Match por similitud (primeras letras)" : "Match exacto"}
            placement="top"
          >
            <Chip
              label={isFuzzy ? `~${kw}` : kw}
              size="small"
              icon={isFuzzy ? <Commit sx={{ fontSize: "10px !important" }} /> : undefined}
              sx={{
                fontSize: 11,
                height: 22,
                bgcolor: isFuzzy ? "rgba(255,183,77,0.1)" : `${color}18`,
                color: isFuzzy ? "warning.light" : color,
                border: `1px solid ${isFuzzy ? "rgba(255,183,77,0.35)" : `${color}40`}`,
              }}
            />
          </Tooltip>
        );
      })}
    </Stack>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ATSScorePanel({ result, isGenerating }) {
  if (isGenerating) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Skeleton variant="rounded" height={120} />
        {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={36} />)}
      </Box>
    );
  }

  if (!result) {
    return (
      <Box sx={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        py: 6, gap: 1, color: "text.disabled",
      }}>
        <TrendingUp sx={{ fontSize: 44, opacity: 0.3 }} />
        <Typography variant="body2" textAlign="center">
          Generá el CV optimizado para ver el score ATS
        </Typography>
      </Box>
    );
  }

  const { initialScore, finalScore } = result;
  const gain = finalScore.score - initialScore.score;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Before / After score comparison */}
      <ScoreComparison initialScore={initialScore} finalScore={finalScore} />

      {/* Score label + confidence */}
      <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
        <Typography variant="body2" fontWeight={600} sx={{ color: scoreColor(finalScore.score) }}>
          {scoreLabel(finalScore.score)} compatibilidad
        </Typography>
        {gain > 0 && (
          <Typography variant="caption" color="text.disabled">
            Mejoraste {gain} puntos con la optimización
          </Typography>
        )}
        <ConfidenceBadge confidence={finalScore.confidence} />
      </Box>

      {/* Breakdown */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="caption" color="text.disabled" textTransform="uppercase" letterSpacing={0.5}>
          Desglose del score final
        </Typography>
        <BreakdownBar label="Keywords ATS" value={finalScore.breakdown.keywords} max={50} color="#6C63FF" />
        <BreakdownBar label="Skills requeridas" value={finalScore.breakdown.skills} max={30} color="#00D9C5" />
        <BreakdownBar label="Estructura del CV" value={finalScore.breakdown.structure} max={20} color="#FFB74D" />
      </Box>

      <Divider />

      {/* Keywords found (exact + fuzzy) */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
          <CheckCircleOutline sx={{ fontSize: 14, color: "success.main" }} />
          <Typography variant="caption" color="success.main" fontWeight={600}>
            Keywords encontradas ({finalScore.keywordsFound.length})
          </Typography>
          {(finalScore.keywordsFuzzy?.length > 0) && (
            <Typography variant="caption" color="text.disabled">
              · {finalScore.keywordsFuzzy.length} por similitud (~)
            </Typography>
          )}
        </Box>
        <KeywordChips
          items={finalScore.keywordsFound}
          fuzzyItems={finalScore.keywordsFuzzy}
          color="#4CAF50"
          emptyLabel="Ninguna keyword detectada"
        />
      </Box>

      {/* Keywords missing */}
      {finalScore.keywordsMissing.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
            <HighlightOff sx={{ fontSize: 14, color: "error.main" }} />
            <Typography variant="caption" color="error.main" fontWeight={600}>
              Keywords faltantes ({finalScore.keywordsMissing.length})
            </Typography>
          </Box>
          <KeywordChips items={finalScore.keywordsMissing} color="#EF5350" emptyLabel="" />
        </Box>
      )}

      <Divider />

      {/* Recommendations */}
      {finalScore.recommendations.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <TipsAndUpdates sx={{ fontSize: 14, color: "primary.light" }} />
            <Typography variant="caption" color="primary.light" fontWeight={600}>
              Recomendaciones
            </Typography>
          </Box>
          <List dense disablePadding>
            {finalScore.recommendations.map((rec, i) => (
              <ListItem key={i} disablePadding sx={{ alignItems: "flex-start", mb: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 20, mt: 0.3 }}>
                  <Box sx={{
                    width: 5, height: 5, borderRadius: "50%",
                    bgcolor: "primary.main", mt: 0.5,
                  }} />
                </ListItemIcon>
                <ListItemText
                  primary={rec}
                  primaryTypographyProps={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5 }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}
