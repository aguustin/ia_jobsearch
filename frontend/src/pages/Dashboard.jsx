import {
  Box, Grid, Card, CardContent, Typography, Button,
  CircularProgress, Stack, Chip, Alert, LinearProgress,
} from "@mui/material";
import {
  Refresh, WorkOutline, CheckCircleOutline, StarOutline,
  SendOutlined, SmartToy,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, systemApi } from "../api/client.js";
import { JobCard } from "../components/JobCard.jsx";
import { useAppStore } from "../store/index.js";
import { scoreColor } from "../theme.js";

function StatCard({ icon, label, value, color = "primary.main" }) {
  return (
    <Card>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ color, opacity: 0.9 }}>{icon}</Box>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color }}>
            {value ?? "—"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const notify = useAppStore((s) => s.notify);
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["jobStats"],
    queryFn: jobsApi.stats,
    refetchInterval: 20000,
  });

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: systemApi.health,
    refetchInterval: 60000,
  });

  const { data: topJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs", "top"],
    queryFn: () => jobsApi.list({ status: "analyzed,shortlisted", sort: "-analysis.score", limit: 5 }),
    refetchInterval: 30000,
  });

  const fetchMutation = useMutation({
    mutationFn: () => systemApi.triggerFetch("all"),
    onSuccess: () => {
      notify("Búsqueda de ofertas iniciada. Los resultados aparecerán en minutos.", "info");
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["jobs"] }), 5000);
    },
    onError: () => notify("Error al iniciar la búsqueda", "error"),
  });

  const byStatus = stats?.byStatus || {};
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4">Dashboard</Typography>
          <Typography color="text.secondary" variant="body2">
            Resumen de tu búsqueda laboral
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={fetchMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
          onClick={() => fetchMutation.mutate()}
          disabled={fetchMutation.isPending}
        >
          Buscar ahora
        </Button>
      </Box>

      {health && !health.ollama.available && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Ollama no está disponible. Las ofertas no serán analizadas automáticamente.
          Iniciá Ollama con: <code>ollama serve</code>
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard icon={<WorkOutline fontSize="large" />} label="Total ofertas" value={total} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<CheckCircleOutline fontSize="large" />}
            label="Analizadas"
            value={(byStatus.analyzed || 0) + (byStatus.shortlisted || 0)}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<StarOutline fontSize="large" />}
            label="Seleccionadas"
            value={byStatus.shortlisted || 0}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<SendOutlined fontSize="large" />}
            label="Aplicadas"
            value={byStatus.applied || 0}
            color="success.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Top ofertas por relevancia
          </Typography>
          {jobsLoading ? (
            <LinearProgress />
          ) : topJobs?.jobs?.length ? (
            <Stack spacing={2}>
              {topJobs.jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </Stack>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <SmartToy sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                <Typography color="text.secondary">
                  No hay ofertas analizadas todavía.
                </Typography>
                <Button sx={{ mt: 2 }} onClick={() => fetchMutation.mutate()} variant="outlined">
                  Iniciar búsqueda
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="h6" sx={{ mb: 2 }}>Estado del sistema</Typography>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary">Ollama</Typography>
                  <Chip
                    label={health?.ollama?.available ? "Activo" : "Inactivo"}
                    color={health?.ollama?.available ? "success" : "error"}
                    size="small"
                  />
                </Box>
                {health?.ollama?.models?.map((m) => (
                  <Chip key={m} label={m} size="small" variant="outlined"
                    sx={{ alignSelf: "flex-start", fontSize: 11 }} />
                ))}
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Score promedio</Typography>
                  <Typography fontWeight={700} sx={{ color: scoreColor(stats?.avgScore) }}>
                    {stats?.avgScore || 0}/100
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Typography variant="h6" sx={{ mb: 2 }}>Por fuente</Typography>
          <Card>
            <CardContent>
              {Object.entries(stats?.bySource || {}).map(([source, count]) => (
                <Box key={source} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2">{source}</Typography>
                    <Typography variant="body2" fontWeight={600}>{count}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={total ? (count / total) * 100 : 0}
                    sx={{ borderRadius: 1, height: 6 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
