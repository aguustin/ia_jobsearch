import {
  Box, Typography, Card, CardContent, Chip, Stack, Button,
  Select, MenuItem, FormControl, InputLabel,
  LinearProgress, IconButton, Tooltip, ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import {
  OpenInNew, Delete, Edit, CheckCircle, Schedule,
  WorkspacePremium, Cancel, ViewList, ViewColumn,
} from "@mui/icons-material";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "../api/client.js";
import { ScoreGauge } from "../components/ScoreGauge.jsx";
import { KanbanBoard } from "../components/KanbanBoard.jsx";
import { useAppStore } from "../store/index.js";

export const STATUS_OPTIONS = [
  { value: "draft",     label: "Borrador",    color: "default",   icon: <Edit fontSize="small" /> },
  { value: "sent",      label: "Enviada",     color: "info",      icon: <CheckCircle fontSize="small" /> },
  { value: "viewed",    label: "En revisión", color: "primary",   icon: <Schedule fontSize="small" /> },
  { value: "interview", label: "Entrevista",  color: "warning",   icon: <WorkspacePremium fontSize="small" /> },
  { value: "offer",     label: "Oferta",      color: "success",   icon: <WorkspacePremium fontSize="small" /> },
  { value: "rejected",  label: "Rechazada",   color: "error",     icon: <Cancel fontSize="small" /> },
];

// ── List view card ──────────────────────────────────────────────────────────

function ApplicationCard({ app, onStatusChange, onDelete }) {
  const job = app.jobId;
  const statusCfg = STATUS_OPTIONS.find((s) => s.value === app.status) || STATUS_OPTIONS[0];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          <ScoreGauge score={job?.analysis?.score} size={60} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {job?.title || "Oferta eliminada"}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {job?.company}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={statusCfg.label} color={statusCfg.color} size="small" icon={statusCfg.icon} />
              {app.sentAt && (
                <Chip
                  label={`Enviada: ${new Date(app.sentAt).toLocaleDateString()}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {app.interviewAt && (
                <Chip
                  label={`Entrevista: ${new Date(app.interviewAt).toLocaleDateString()}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Stack>
            {app.notes && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                {app.notes}
              </Typography>
            )}
          </Box>
          <Stack spacing={0.5}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={app.status}
                onChange={(e) => onStatusChange(app._id, e.target.value)}
                variant="outlined"
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {job?.url && (
              <Tooltip title="Ver oferta">
                <IconButton size="small" href={job.url} target="_blank">
                  <OpenInNew fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Eliminar">
              <IconButton size="small" color="error" onClick={() => onDelete(app._id)}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export function Applications() {
  const notify = useAppStore((s) => s.notify);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("kanban");

  // Kanban always fetches all; list view respects status filter
  const { data, isLoading } = useQuery({
    queryKey: ["applications", viewMode === "kanban" ? "all" : statusFilter],
    queryFn: () =>
      applicationsApi.list({
        status: viewMode === "kanban" ? "" : statusFilter,
        limit: 100,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => applicationsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => applicationsApi.delete(id),
    onSuccess: () => {
      notify("Aplicación eliminada", "info");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const handleStatusChange = (id, status) => {
    const update = { status };
    if (status === "sent") update.sentAt = new Date().toISOString();
    updateMutation.mutate({ id, data: update });
  };

  const handleDelete = (id) => deleteMutation.mutate(id);

  const applications = data?.applications || [];

  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const empty = !isLoading && !applications.length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4">Mis Aplicaciones</Typography>
          <Typography color="text.secondary" variant="body2">
            {data?.total || 0} postulaciones registradas
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, v) => v && setViewMode(v)}
          size="small"
        >
          <ToggleButton value="list">
            <Tooltip title="Vista lista">
              <ViewList fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="kanban">
            <Tooltip title="Vista Kanban">
              <ViewColumn fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Status filter chips — only in list view */}
      {viewMode === "list" && (
        <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap" }}>
          <Chip
            label={`Todas (${data?.total || 0})`}
            onClick={() => setStatusFilter("")}
            color={!statusFilter ? "primary" : "default"}
            clickable
          />
          {STATUS_OPTIONS.map((s) => (
            <Chip
              key={s.value}
              label={`${s.label} (${statusCounts[s.value] || 0})`}
              onClick={() => setStatusFilter(s.value)}
              color={statusFilter === s.value ? s.color : "default"}
              clickable
              size="small"
            />
          ))}
        </Stack>
      )}

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Kanban view */}
      {viewMode === "kanban" && !isLoading && (
        empty ? (
          <EmptyState />
        ) : (
          <KanbanBoard
            applications={applications}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )
      )}

      {/* List view */}
      {viewMode === "list" && (
        <Stack spacing={2}>
          {applications.map((app) => (
            <ApplicationCard
              key={app._id}
              app={app}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
          {empty && <EmptyState />}
        </Stack>
      )}
    </Box>
  );
}

function EmptyState() {
  return (
    <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
      <Typography>No hay aplicaciones registradas.</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Abrí una oferta, generá el mensaje y hacé click en "Registrar como Enviada".
      </Typography>
    </Box>
  );
}
