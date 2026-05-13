import {
  Box, Typography, Card, CardContent, Chip, Stack,
  IconButton, Tooltip,
} from "@mui/material";
import { OpenInNew, Delete, DragIndicator } from "@mui/icons-material";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { scoreColor } from "../theme.js";

export const KANBAN_COLUMNS = [
  { id: "sent",      label: "Enviadas",     accent: "#6C63FF", bg: "rgba(108,99,255,0.08)"  },
  { id: "viewed",    label: "En revisión",  accent: "#00D9C5", bg: "rgba(0,217,197,0.08)"   },
  { id: "interview", label: "Entrevista",   accent: "#FFB74D", bg: "rgba(255,183,77,0.08)"  },
  { id: "offer",     label: "Oferta",       accent: "#4CAF50", bg: "rgba(76,175,80,0.08)"   },
  { id: "rejected",  label: "Rechazadas",   accent: "#EF5350", bg: "rgba(239,83,80,0.06)"   },
];

// ── Card (draggable) ────────────────────────────────────────────────────────

function KanbanCardInner({ app, onDelete, dimmed = false }) {
  const navigate = useNavigate();
  const job = app.jobId;
  const score = job?.analysis?.score;

  return (
    <Card
      onClick={() => job?._id && navigate(`/jobs/${job._id}`)}
      sx={{
        cursor: job?._id ? "pointer" : "default",
        opacity: dimmed ? 0.4 : 1,
        transition: "box-shadow 0.15s, opacity 0.15s",
        "&:hover": job?._id ? { boxShadow: "0 2px 16px rgba(108,99,255,0.25)" } : {},
        userSelect: "none",
        mb: 1.5,
      }}
    >
      <CardContent sx={{ p: "12px !important" }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
          {/* Score badge */}
          <Box
            sx={{
              minWidth: 34,
              height: 34,
              borderRadius: "50%",
              border: "2px solid",
              borderColor: score != null ? scoreColor(score) : "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: score != null ? scoreColor(score) : "text.secondary" }}>
              {score ?? "—"}
            </Typography>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {job?.title || "Oferta eliminada"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {job?.company || "—"}
            </Typography>
            {app.sentAt && (
              <Typography variant="caption" color="text.disabled" display="block">
                {new Date(app.sentAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={0} onClick={(e) => e.stopPropagation()}>
            {job?.url && (
              <Tooltip title="Ver oferta">
                <IconButton size="small" href={job.url} target="_blank" sx={{ p: 0.4 }}>
                  <OpenInNew sx={{ fontSize: 14, color: "text.disabled" }} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Eliminar">
              <IconButton size="small" onClick={() => onDelete(app._id)} sx={{ p: 0.4 }}>
                <Delete sx={{ fontSize: 14, color: "text.disabled" }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

function DraggableCard({ app, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app._id,
    data: { currentStatus: app.status },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 999 : "auto",
  };

  return (
    <Box ref={setNodeRef} style={style}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0.5,
          opacity: isDragging ? 0 : 1,
        }}
      >
        <Box
          {...listeners}
          {...attributes}
          sx={{
            cursor: "grab",
            mt: 1.5,
            color: "text.disabled",
            "&:active": { cursor: "grabbing" },
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <DragIndicator sx={{ fontSize: 16 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <KanbanCardInner app={app} onDelete={onDelete} />
        </Box>
      </Box>
    </Box>
  );
}

// ── Column (droppable) ──────────────────────────────────────────────────────

function KanbanColumn({ column, apps, onDelete }) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <Box
      sx={{
        minWidth: 240,
        maxWidth: 260,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Column header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1.5,
          px: 1,
        }}
      >
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: column.accent, flexShrink: 0 }} />
        <Typography variant="body2" fontWeight={700} sx={{ color: column.accent }}>
          {column.label}
        </Typography>
        <Chip
          label={apps.length}
          size="small"
          sx={{ ml: "auto", height: 18, fontSize: 11, bgcolor: column.accent + "22", color: column.accent }}
        />
      </Box>

      {/* Droppable area */}
      <Box
        ref={setNodeRef}
        sx={{
          flex: 1,
          minHeight: 120,
          borderRadius: 2,
          p: 1,
          bgcolor: isOver ? column.bg : "rgba(255,255,255,0.02)",
          border: "1px dashed",
          borderColor: isOver ? column.accent : "rgba(255,255,255,0.06)",
          transition: "background-color 0.15s, border-color 0.15s",
        }}
      >
        {apps.map((app) => (
          <DraggableCard key={app._id} app={app} onDelete={onDelete} />
        ))}
        {!apps.length && (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: "block", textAlign: "center", mt: 3 }}
          >
            Sin aplicaciones
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ── Board ───────────────────────────────────────────────────────────────────

export function KanbanBoard({ applications, onStatusChange, onDelete }) {
  const [activeApp, setActiveApp] = useState(null);

  // Group apps by column; "draft" lives in "sent" column
  const grouped = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col.id] = applications.filter((a) =>
      col.id === "sent" ? a.status === "sent" || a.status === "draft" : a.status === col.id
    );
    return acc;
  }, {});

  const handleDragStart = ({ active }) => {
    const app = applications.find((a) => a._id === active.id);
    setActiveApp(app || null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveApp(null);
    if (!over || active.id === over.id) return;

    const targetColumnId = over.id;
    const validColumn = KANBAN_COLUMNS.find((c) => c.id === targetColumnId);
    if (!validColumn) return;

    const app = applications.find((a) => a._id === active.id);
    if (!app || app.status === targetColumnId) return;

    // treat "sent" column drop as status "sent"
    onStatusChange(active.id, targetColumnId === "sent" ? "sent" : targetColumnId);
  };

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 2, alignItems: "flex-start" }}>
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            apps={grouped[col.id] || []}
            onDelete={onDelete}
          />
        ))}
      </Box>

      <DragOverlay dropAnimation={null}>
        {activeApp && (
          <Box sx={{ width: 240, opacity: 0.9, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            <KanbanCardInner app={activeApp} onDelete={() => {}} />
          </Box>
        )}
      </DragOverlay>
    </DndContext>
  );
}
