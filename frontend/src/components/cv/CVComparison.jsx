import {
  Box, Typography, MenuItem, Select, FormControl, InputLabel,
  Button, LinearProgress, Divider, Chip, Stack, Skeleton, Tooltip,
} from "@mui/material";
import {
  CompareArrows, CheckCircleOutline, HighlightOff,
  EmojiEvents, TrendingUp,
} from "@mui/icons-material";
import { scoreColor, scoreLabel } from "../../theme.js";
import { useCVComparison } from "../../hooks/useCVComparison.js";

function ScoreBar({ value, max, color }) {
  return (
    <LinearProgress
      variant="determinate"
      value={Math.min(100, (value / max) * 100)}
      sx={{
        height: 6, borderRadius: 3,
        bgcolor: "rgba(255,255,255,0.06)",
        "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 },
      }}
    />
  );
}

function CompareColumn({ name, score, winner }) {
  const color = scoreColor(score.score);
  return (
    <Box sx={{
      flex: 1, p: 2, borderRadius: 2,
      bgcolor: winner ? "rgba(108,99,255,0.08)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${winner ? "rgba(108,99,255,0.3)" : "rgba(255,255,255,0.07)"}`,
      display: "flex", flexDirection: "column", gap: 1.5,
    }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
        <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
          {name}
        </Typography>
        {winner && (
          <Chip
            icon={<EmojiEvents sx={{ fontSize: "13px !important" }} />}
            label="Mejor CV"
            size="small"
            sx={{
              height: 20, fontSize: 10,
              bgcolor: "rgba(108,99,255,0.15)", color: "primary.light",
              border: "1px solid rgba(108,99,255,0.3)",
            }}
          />
        )}
      </Box>

      {/* Score */}
      <Box sx={{ textAlign: "center", py: 1 }}>
        <Typography variant="h3" fontWeight={800} sx={{ color, lineHeight: 1 }}>
          {score.score}
        </Typography>
        <Typography variant="caption" color="text.disabled">/ 100</Typography>
        <Typography variant="body2" fontWeight={600} sx={{ color, mt: 0.5 }}>
          {scoreLabel(score.score)}
        </Typography>
      </Box>

      {/* Breakdown */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
            <Typography variant="caption" color="text.disabled">Keywords</Typography>
            <Typography variant="caption" fontWeight={600}>{score.breakdown.keywords}/50</Typography>
          </Box>
          <ScoreBar value={score.breakdown.keywords} max={50} color="#6C63FF" />
        </Box>
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
            <Typography variant="caption" color="text.disabled">Skills</Typography>
            <Typography variant="caption" fontWeight={600}>{score.breakdown.skills}/30</Typography>
          </Box>
          <ScoreBar value={score.breakdown.skills} max={30} color="#00D9C5" />
        </Box>
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
            <Typography variant="caption" color="text.disabled">Estructura</Typography>
            <Typography variant="caption" fontWeight={600}>{score.breakdown.structure}/20</Typography>
          </Box>
          <ScoreBar value={score.breakdown.structure} max={20} color="#FFB74D" />
        </Box>
      </Box>

      <Divider />

      {/* Keywords found */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
          <CheckCircleOutline sx={{ fontSize: 13, color: "success.main" }} />
          <Typography variant="caption" color="success.main" fontWeight={600}>
            Encontradas ({score.keywordsFound.length})
          </Typography>
        </Box>
        <Stack direction="row" flexWrap="wrap" gap={0.5}>
          {score.keywordsFound.slice(0, 10).map((kw) => (
            <Chip
              key={kw} label={kw} size="small"
              sx={{ height: 20, fontSize: 10, bgcolor: "rgba(76,175,80,0.1)", color: "success.light", border: "1px solid rgba(76,175,80,0.25)" }}
            />
          ))}
          {score.keywordsFound.length > 10 && (
            <Chip label={`+${score.keywordsFound.length - 10}`} size="small"
              sx={{ height: 20, fontSize: 10, bgcolor: "rgba(255,255,255,0.05)", color: "text.disabled" }} />
          )}
        </Stack>
      </Box>

      {/* Keywords missing */}
      {score.keywordsMissing.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <HighlightOff sx={{ fontSize: 13, color: "error.main" }} />
            <Typography variant="caption" color="error.main" fontWeight={600}>
              Faltantes ({score.keywordsMissing.length})
            </Typography>
          </Box>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {score.keywordsMissing.slice(0, 8).map((kw) => (
              <Chip
                key={kw} label={kw} size="small"
                sx={{ height: 20, fontSize: 10, bgcolor: "rgba(239,83,80,0.1)", color: "error.light", border: "1px solid rgba(239,83,80,0.25)" }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export function CVComparison({ cvList }) {
  const {
    cvId1, setCvId1, cvId2, setCvId2,
    jobDescription, setJobDescription,
    comparisonResult, compare, isComparing, canCompare,
  } = useCVComparison(cvList);

  const winner = comparisonResult
    ? (comparisonResult.cv1.score.score >= comparisonResult.cv2.score.score ? "cv1" : "cv2")
    : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* CV selectors */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ flex: 1, minWidth: 160 }}>
          <InputLabel>CV 1</InputLabel>
          <Select value={cvId1} label="CV 1" onChange={(e) => setCvId1(e.target.value)}>
            {(cvList || []).map((cv) => (
              <MenuItem key={cv._id} value={cv._id} disabled={cv._id === cvId2}>
                {cv.originalName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", alignItems: "center", color: "text.disabled" }}>
          <CompareArrows />
        </Box>

        <FormControl size="small" sx={{ flex: 1, minWidth: 160 }}>
          <InputLabel>CV 2</InputLabel>
          <Select value={cvId2} label="CV 2" onChange={(e) => setCvId2(e.target.value)}>
            {(cvList || []).map((cv) => (
              <MenuItem key={cv._id} value={cv._id} disabled={cv._id === cvId1}>
                {cv.originalName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Job description */}
      <Box
        component="textarea"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Pegá la descripción del puesto aquí (mínimo 50 caracteres)..."
        sx={{
          width: "100%", minHeight: 100, p: 1.5, resize: "vertical",
          fontFamily: "inherit", fontSize: 13, lineHeight: 1.6,
          bgcolor: "rgba(255,255,255,0.04)", color: "text.primary",
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 1,
          outline: "none", boxSizing: "border-box",
          "&:focus": { borderColor: "rgba(108,99,255,0.5)" },
        }}
      />

      <Button
        variant="contained"
        startIcon={<TrendingUp />}
        onClick={compare}
        disabled={!canCompare}
        sx={{ background: "linear-gradient(135deg, #6C63FF 0%, #00D9C5 100%)", alignSelf: "flex-start" }}
      >
        {isComparing ? "Comparando…" : "Comparar CVs"}
      </Button>

      {isComparing && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Skeleton variant="rounded" height={200} />
        </Box>
      )}

      {comparisonResult && !isComparing && (
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <CompareColumn
            name={comparisonResult.cv1.originalName}
            score={comparisonResult.cv1.score}
            winner={winner === "cv1"}
          />
          <CompareColumn
            name={comparisonResult.cv2.originalName}
            score={comparisonResult.cv2.score}
            winner={winner === "cv2"}
          />
        </Box>
      )}
    </Box>
  );
}
