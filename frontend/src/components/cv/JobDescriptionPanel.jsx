import { useMemo } from "react";
import {
  Box, Typography, TextField, Chip, Stack, LinearProgress,
} from "@mui/material";
import { LabelOutlined as KeywordIcon } from "@mui/icons-material";

const MIN_LENGTH = 50;
const MAX_LENGTH = 5000;

function extractClientKeywords(text) {
  if (!text) return [];
  const patterns = [
    /\b[A-Z]{2,8}\b/g,
    /\b\w+\.\w+(?:\.\w+)?\b/g,
    /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g,
  ];
  const found = new Set();
  patterns.forEach((p) => {
    const matches = text.match(p) || [];
    matches.forEach((m) => {
      if (m.length > 2 && m.length < 30) found.add(m);
    });
  });
  const stopWords = new Set(["The", "This", "That", "With", "From", "Have", "Will", "Your", "Our", "Are", "You"]);
  return [...found].filter((w) => !stopWords.has(w)).slice(0, 18);
}

export function JobDescriptionPanel({ value, onChange, disabled }) {
  const length = value.length;
  const keywords = useMemo(() => extractClientKeywords(value), [value]);
  const progress = Math.min(100, (length / MIN_LENGTH) * 100);
  const isValid = length >= MIN_LENGTH;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Typography variant="subtitle2" color="text.secondary">
          Descripción laboral
        </Typography>
        <Typography
          variant="caption"
          color={length > MAX_LENGTH ? "error.main" : "text.disabled"}
        >
          {length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
        </Typography>
      </Box>

      <TextField
        multiline
        minRows={10}
        maxRows={18}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
        disabled={disabled}
        placeholder={`Pegá aquí la descripción completa del puesto...

Ejemplo:
Buscamos un desarrollador full-stack con experiencia en React, Node.js y PostgreSQL. Se valorará conocimiento de Docker, AWS y metodologías ágiles...`}
        sx={{
          "& .MuiOutlinedInput-root": {
            fontSize: 13,
            lineHeight: 1.7,
            fontFamily: "inherit",
          },
        }}
      />

      {!isValid && length > 0 && (
        <Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 3,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.06)",
              "& .MuiLinearProgress-bar": { bgcolor: "warning.main" },
            }}
          />
          <Typography variant="caption" color="text.disabled" mt={0.5} display="block">
            Mínimo {MIN_LENGTH} caracteres ({MIN_LENGTH - length} restantes)
          </Typography>
        </Box>
      )}

      {keywords.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
            <KeywordIcon sx={{ fontSize: 13, color: "text.disabled" }} />
            <Typography variant="caption" color="text.disabled">
              Keywords detectadas
            </Typography>
          </Box>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {keywords.map((kw) => (
              <Chip
                key={kw}
                label={kw}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: 11,
                  height: 22,
                  borderColor: "rgba(108,99,255,0.4)",
                  color: "primary.light",
                }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
