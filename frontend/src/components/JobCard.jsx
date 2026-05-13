import {
  Card, CardContent, Box, Typography, Chip, Stack,
  IconButton, Tooltip, Divider,
} from "@mui/material";
import {
  OpenInNew, BookmarkAdd, ThumbDown, AutoAwesome,
  LocationOn, Business,
} from "@mui/icons-material";
import { ScoreGauge } from "./ScoreGauge.jsx";
import { StatusBadge } from "./StatusBadge.jsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "../api/client.js";
import { useNavigate } from "react-router-dom";

const SOURCE_COLORS = {
  remoteok: "#FF6B6B",
  weworkremotely: "#4ECDC4",
  getonbrd: "#45B7D1",
};

export function JobCard({ job, showSource = true }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ status }) => jobsApi.updateStatus(job._id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobStats"] });
    },
  });

  const handleShortlist = (e) => {
    e.stopPropagation();
    statusMutation.mutate({ status: "shortlisted" });
  };

  const handleReject = (e) => {
    e.stopPropagation();
    statusMutation.mutate({ status: "rejected" });
  };

  const sourceColor = SOURCE_COLORS[job.source] || "#9FA8DA";

  return (
    <Card
      onClick={() => navigate(`/jobs/${job._id}`)}
      sx={{
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          borderColor: "primary.main",
          transform: "translateY(-1px)",
          boxShadow: "0 4px 20px rgba(108,99,255,0.15)",
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          <ScoreGauge score={job.analysis?.score} size={72} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
              {showSource && (
                <Chip
                  label={job.source}
                  size="small"
                  sx={{ fontSize: 10, bgcolor: `${sourceColor}22`, color: sourceColor, borderRadius: 1 }}
                />
              )}
              <StatusBadge status={job.status} />
            </Box>

            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {job.title}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Business sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {job.company}
              </Typography>
              {job.location && (
                <>
                  <LocationOn sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {job.location}
                  </Typography>
                </>
              )}
            </Stack>

            {job.analysis?.summary && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
              >
                {job.analysis.summary}
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {[...new Set(job.tags || [])].slice(0, 5).map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined"
                  sx={{ fontSize: 11, borderColor: "divider", color: "text.secondary" }} />
              ))}
            </Box>
          </Box>

          <Stack spacing={0.5} alignItems="center">
            <Tooltip title="Seleccionar">
              <IconButton size="small" onClick={handleShortlist}
                sx={{ color: "secondary.main" }} disabled={statusMutation.isPending}>
                <BookmarkAdd fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Descartar">
              <IconButton size="small" onClick={handleReject}
                sx={{ color: "error.main" }} disabled={statusMutation.isPending}>
                <ThumbDown fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ver oferta">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); window.open(job.url, "_blank"); }}
                sx={{ color: "text.secondary" }}>
                <OpenInNew fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {job.analysis?.matchReasons?.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AutoAwesome sx={{ fontSize: 13, color: "primary.main" }} />
              <Typography variant="caption" color="primary.main" fontWeight={600}>
                {job.analysis.matchReasons[0]}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
