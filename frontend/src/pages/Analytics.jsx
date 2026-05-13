import {
  Box, Typography, Card, CardContent, Grid, Chip,
  LinearProgress, Stack,
} from "@mui/material";
import {
  TrendingUp, Code, SchoolOutlined, WorkOutline, StarOutline,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/client.js";
import { scoreColor } from "../theme.js";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell, AreaChart, Area, Legend,
} from "recharts";

// ── Shared chart style ──────────────────────────────────────────────────────

const CHART_STYLE = {
  fontSize: 12,
  fill: "#9FA8DA",
};

const AXIS_STYLE = {
  stroke: "rgba(255,255,255,0.1)",
};

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#161920",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    fontSize: 13,
  },
  labelStyle: { color: "#E8EAF6", fontWeight: 600 },
  itemStyle: { color: "#9FA8DA" },
};

// ── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color = "primary.main", sub }) {
  return (
    <Card>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ color, opacity: 0.85 }}>{icon}</Box>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color, lineHeight: 1 }}>
            {value ?? "—"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.disabled">
              {sub}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Custom bar label ─────────────────────────────────────────────────────────

function SkillLabel({ x, y, width, height, value }) {
  return (
    <text
      x={x + width + 6}
      y={y + height / 2 + 4}
      fill="#9FA8DA"
      fontSize={11}
    >
      {value}
    </text>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: analyticsApi.get,
    staleTime: 60000,
  });

  if (isLoading) return <LinearProgress sx={{ mt: 4 }} />;

  const s = data?.summary ?? {};
  const topSkills = data?.topSkills ?? [];
  const skillsGap = data?.skillsGap ?? [];
  const scoreDistribution = data?.scoreDistribution ?? [];
  const weeklyTrend = data?.weeklyTrend ?? [];
  const bySource = data?.bySource ?? [];
  const topCompanies = data?.topCompanies ?? [];

  const scoreDistColors = ["#EF5350", "#FF7043", "#FFB74D", "#66BB6A", "#4CAF50"];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Analytics</Typography>
        <Typography variant="body2" color="text.secondary">
          Tendencias del mercado basadas en tus ofertas analizadas
        </Typography>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<WorkOutline fontSize="large" />}
            label="Total ofertas"
            value={s.total}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<StarOutline fontSize="large" />}
            label="Score promedio"
            value={s.avgScore}
            color={scoreColor(s.avgScore)}
            sub="sobre ofertas analizadas"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<TrendingUp fontSize="large" />}
            label="Seleccionadas"
            value={s.shortlisted}
            color="#00D9C5"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<SchoolOutlined fontSize="large" />}
            label="Skills a aprender"
            value={s.gapCount}
            color="#FFB74D"
            sub="demandados, no en tu perfil"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top skills + gap */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Code sx={{ color: "primary.main", fontSize: 20 }} />
                <Typography variant="h6">Tecnologías más demandadas</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Chip
                  size="small"
                  sx={{ bgcolor: "rgba(76,175,80,0.15)", color: "#4CAF50", fontSize: 11 }}
                  label="En tu perfil"
                />
                <Chip
                  size="small"
                  sx={{ bgcolor: "rgba(255,183,77,0.15)", color: "#FFB74D", fontSize: 11 }}
                  label="No en tu perfil (gap)"
                />
              </Box>
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topSkills}
                    layout="vertical"
                    margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid horizontal={false} stroke={AXIS_STYLE.stroke} />
                    <XAxis type="number" tick={CHART_STYLE} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={CHART_STYLE}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <RTooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value, _, { payload }) => [
                        `${value} ofertas`,
                        payload.inProfile ? "✓ En tu perfil" : "⚠ Gap de skill",
                      ]}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} label={<SkillLabel />}>
                      {topSkills.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.inProfile ? "#4CAF50" : "#FFB74D"}
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          {/* Weekly trend */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Actividad semanal
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="analyzedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D9C5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00D9C5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={AXIS_STYLE.stroke} />
                    <XAxis dataKey="week" tick={CHART_STYLE} axisLine={false} tickLine={false} />
                    <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} />
                    <RTooltip {...TOOLTIP_STYLE} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: "#9FA8DA" }}
                      formatter={(v) => v === "total" ? "Recibidas" : "Analizadas"}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#6C63FF"
                      strokeWidth={2}
                      fill="url(#totalGrad)"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="analyzed"
                      stroke="#00D9C5"
                      strokeWidth={2}
                      fill="url(#analyzedGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} lg={5}>
          {/* Score distribution */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Distribución de scores</Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistribution} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={AXIS_STYLE.stroke} />
                    <XAxis dataKey="range" tick={CHART_STYLE} axisLine={false} tickLine={false} />
                    <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} />
                    <RTooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v} ofertas`, "Cantidad"]} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {scoreDistribution.map((_, i) => (
                        <Cell key={i} fill={scoreDistColors[i]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          {/* Skills gap */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 0.5 }}>Gap de skills</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Muy demandadas pero no están en tu perfil
              </Typography>
              <Stack spacing={1.5}>
                {skillsGap.slice(0, 8).map((skill) => (
                  <Box key={skill.name}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ textTransform: "capitalize" }}>
                        {skill.name}
                      </Typography>
                      <Typography variant="caption" color="warning.main" fontWeight={600}>
                        {skill.count} ofertas
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (skill.count / (skillsGap[0]?.count || 1)) * 100)}
                      sx={{
                        height: 5,
                        borderRadius: 1,
                        bgcolor: "rgba(255,183,77,0.12)",
                        "& .MuiLinearProgress-bar": { bgcolor: "#FFB74D" },
                      }}
                    />
                  </Box>
                ))}
                {!skillsGap.length && (
                  <Typography variant="body2" color="success.main">
                    ✓ Tu perfil cubre todos los skills más demandados.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Top companies */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Mejores empresas por score</Typography>
              <Stack spacing={1.5}>
                {topCompanies.map((c, i) => (
                  <Box
                    key={c.company}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        width: 20,
                        fontWeight: 700,
                        color: i < 3 ? "warning.main" : "text.disabled",
                        textAlign: "center",
                      }}
                    >
                      {i + 1}
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {c.company}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.count} {c.count === 1 ? "oferta" : "ofertas"}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${c.avgScore}`}
                      size="small"
                      sx={{
                        bgcolor: `${scoreColor(c.avgScore)}22`,
                        color: scoreColor(c.avgScore),
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    />
                  </Box>
                ))}
                {!topCompanies.length && (
                  <Typography variant="body2" color="text.secondary">
                    Datos disponibles después del primer análisis.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Source breakdown */}
      {bySource.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Ofertas por fuente</Typography>
            <Grid container spacing={2}>
              {bySource.map((s) => {
                const total = bySource.reduce((acc, x) => acc + x.count, 0);
                return (
                  <Grid item xs={12} sm={4} key={s.source}>
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={500}>{s.source}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {s.count} ({Math.round((s.count / total) * 100)}%)
                          {s.avgScore > 0 && (
                            <span style={{ color: scoreColor(s.avgScore), marginLeft: 6, fontWeight: 600 }}>
                              ⌀{s.avgScore}
                            </span>
                          )}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(s.count / total) * 100}
                        sx={{ height: 6, borderRadius: 1 }}
                      />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
