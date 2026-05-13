import { Chip } from "@mui/material";

const STATUS_CONFIG = {
  new: { label: "Nueva", color: "default" },
  analyzing: { label: "Analizando...", color: "info" },
  analyzed: { label: "Analizada", color: "primary" },
  shortlisted: { label: "Seleccionada", color: "secondary" },
  applied: { label: "Aplicada", color: "success" },
  rejected: { label: "Descartada", color: "error" },
  archived: { label: "Archivada", color: "default" },
};

export function StatusBadge({ status, size = "small" }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "default" };
  return (
    <Chip
      label={cfg.label}
      color={cfg.color}
      size={size}
      sx={{ fontWeight: 600, fontSize: 11 }}
    />
  );
}
