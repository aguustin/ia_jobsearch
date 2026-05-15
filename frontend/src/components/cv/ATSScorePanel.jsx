import {
  Box, Typography, Chip, Stack, LinearProgress,
  CircularProgress as MuiCircular, Divider, List,
  ListItem, ListItemIcon, ListItemText, Skeleton,
} from "@mui/material";
import {
  CheckCircleOutline, HighlightOff, TipsAndUpdates,
  TrendingUp,
} from "@mui/icons-material";
import { scoreColor } from "../../theme.js";

function ScoreRing({ score, size = 110 }) {
  const color = scoreColor(score);
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <MuiCircular
        variant="determinate"
        value={100}
        size={size}
        thickness={5}
        sx={{ color: "rgba(255,255,255,0.06)", position: "absolute" }}
      />
      <MuiCircular
        variant="determinate"
        value={score}
        size={size}
        thickness={5}
        sx={{ color }}
      />
      <Box
        sx={{
          top: 0, left: 0, bottom: 0, right: 0,
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h4" fontWeight={700} sx={{ color, lineHeight: 1 }}>
          {score}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          / 100
        </Typography>
      </Box>
    </Box>
  );
}

function BreakdownBar({ label, value, max = 50, color }) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" color="text.primary" fontWeight={600}>
          {value}<Typography component="span" variant="caption" color="text.disabled">/{max}</Typography>
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(value / max) * 100}
        sx={{
          height: 5,
          borderRadius: 3,
          bgcolor: "rgba(255,255,255,0.06)",
          "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 },
        }}
      />
    </Box>
  );
}

function KeywordChips({ items, color, emptyLabel }) {
  if (!items?.length) {
    return <Typography variant="caption" color="text.disabled">{emptyLabel}</Typography>;
  }
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.5}>
      {items.map((kw) => (
        <Chip
          key={kw}
          label={kw}
          size="small"
          sx={{
            fontSize: 11,
            height: 22,
            bgcolor: `${color}18`,
            color,
            border: `1px solid ${color}40`,
          }}
        />
      ))}
    </Stack>
  );
}

export function ATSScorePanel({ result, isGenerating }) {
  if (isGenerating) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Skeleton variant="circular" width={110} height={110} sx={{ mx: "auto" }} />
        {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={40} />)}
      </Box>
    );
  }

  if (!result) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 6,
          gap: 1,
          color: "text.disabled",
        }}
      >
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
      {/* Score ring */}
      <Box sx={{ textAlign: "center" }}>
        <ScoreRing score={finalScore.score} />
        {gain > 0 && (
          <Chip
            label={`+${gain} pts vs original`}
            size="small"
            icon={<TrendingUp sx={{ fontSize: 13 }} />}
            sx={{
              mt: 1,
              fontSize: 11,
              height: 22,
              bgcolor: "rgba(76,175,80,0.12)",
              color: "success.main",
              border: "1px solid rgba(76,175,80,0.3)",
            }}
          />
        )}
      </Box>

      {/* Breakdown */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="caption" color="text.disabled" textTransform="uppercase" letterSpacing={0.5}>
          Desglose
        </Typography>
        <BreakdownBar label="Keywords ATS" value={finalScore.breakdown.keywords} max={50} color="#6C63FF" />
        <BreakdownBar label="Skills requeridas" value={finalScore.breakdown.skills} max={30} color="#00D9C5" />
        <BreakdownBar label="Estructura" value={finalScore.breakdown.structure} max={20} color="#FFB74D" />
      </Box>

      <Divider />

      {/* Keywords found */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
          <CheckCircleOutline sx={{ fontSize: 14, color: "success.main" }} />
          <Typography variant="caption" color="success.main" fontWeight={600}>
            Keywords encontradas ({finalScore.keywordsFound.length})
          </Typography>
        </Box>
        <KeywordChips items={finalScore.keywordsFound} color="#4CAF50" emptyLabel="Ninguna keyword detectada" />
      </Box>

      {/* Keywords missing */}
      {finalScore.keywordsMissing.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
            <HighlightOff sx={{ fontSize: 14, color: "warning.main" }} />
            <Typography variant="caption" color="warning.main" fontWeight={600}>
              Keywords faltantes ({finalScore.keywordsMissing.length})
            </Typography>
          </Box>
          <KeywordChips items={finalScore.keywordsMissing} color="#FFB74D" emptyLabel="" />
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
                  <Box
                    sx={{
                      width: 5, height: 5, borderRadius: "50%",
                      bgcolor: "primary.main", mt: 0.5,
                    }}
                  />
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
