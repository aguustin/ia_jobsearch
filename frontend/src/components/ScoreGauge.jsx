import { Box, Typography } from "@mui/material";
import { scoreColor, scoreLabel } from "../theme.js";

export function ScoreGauge({ score, size = 80 }) {
  if (score == null) return null;

  const color = scoreColor(score);
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: size * 0.22, color, lineHeight: 1 }}>
          {score}
        </Typography>
        <Typography sx={{ fontSize: size * 0.12, color: "text.secondary", lineHeight: 1 }}>
          {scoreLabel(score)}
        </Typography>
      </Box>
    </Box>
  );
}
