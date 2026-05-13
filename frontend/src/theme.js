import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#6C63FF" },
    secondary: { main: "#00D9C5" },
    success: { main: "#4CAF50" },
    warning: { main: "#FFB74D" },
    error: { main: "#EF5350" },
    background: {
      default: "#0D0F14",
      paper: "#161920",
    },
    divider: "rgba(255,255,255,0.07)",
    text: {
      primary: "#E8EAF6",
      secondary: "#9FA8DA",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
  },
});

export const scoreColor = (score) => {
  if (score >= 80) return "#4CAF50";
  if (score >= 60) return "#FFB74D";
  if (score >= 40) return "#FF7043";
  return "#EF5350";
};

export const scoreLabel = (score) => {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Buena";
  if (score >= 40) return "Parcial";
  return "Baja";
};
