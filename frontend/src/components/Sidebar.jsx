import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Chip, Tooltip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  SendOutlined as SendIcon,
  SmartToy as AiIcon,
  BarChart as AnalyticsIcon,
  AutoAwesome as CvIcon,
  NotificationsActive, NotificationsOff,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { jobsApi } from "../api/client.js";

const NAV_ITEMS = [
  { label: "Dashboard",     icon: <DashboardIcon />,  path: "/" },
  { label: "Ofertas",       icon: <WorkIcon />,        path: "/jobs" },
  { label: "Aplicaciones",  icon: <SendIcon />,        path: "/applications" },
  { label: "Analytics",     icon: <AnalyticsIcon />,   path: "/analytics" },
  { label: "CV ATS",        icon: <CvIcon />,          path: "/cv-generator" },
  { label: "Mi Perfil",     icon: <PersonIcon />,      path: "/profile" },
];

function useNotifPermission() {
  const [permission, setPermission] = useState(
    "Notification" in window ? Notification.permission : "denied"
  );

  const request = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return { permission, request };
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { permission, request } = useNotifPermission();

  const { data: stats } = useQuery({
    queryKey: ["jobStats"],
    queryFn: jobsApi.stats,
    refetchInterval: 30000,
  });

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", py: 2 }}>
      <Box sx={{ px: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <AiIcon sx={{ color: "primary.main", fontSize: 28 }} />
          <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700 }}>
            IA JobSearch
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Agente inteligente de búsqueda
        </Typography>
      </Box>

      <Divider sx={{ mb: 1 }} />

      <List dense sx={{ px: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              selected={active}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: active ? "white" : "text.secondary" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  color: active ? "white" : "text.primary",
                }}
              />
              {item.path === "/jobs" && stats?.byStatus?.new > 0 && (
                <Chip
                  label={stats.byStatus.new}
                  size="small"
                  color="secondary"
                  sx={{ height: 20, fontSize: 11 }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ mt: "auto", px: 2, pb: 1 }}>
        <Divider sx={{ mb: 1.5 }} />
        <Typography variant="caption" color="text.secondary" display="block">
          Ofertas analizadas
        </Typography>
        <Typography variant="h5" sx={{ color: "secondary.main", fontWeight: 700 }}>
          {(stats?.byStatus?.analyzed || 0) + (stats?.byStatus?.shortlisted || 0)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Score promedio: <b style={{ color: "#FFB74D" }}>{stats?.avgScore || 0}</b>/100
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        <Tooltip
          title={
            permission === "granted"
              ? "Notificaciones activas — recibirás alertas de ofertas con score ≥ 75"
              : "Click para activar notificaciones de escritorio"
          }
        >
          <Box
            onClick={permission !== "granted" ? request : undefined}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: permission !== "granted" ? "pointer" : "default",
              opacity: permission === "denied" ? 0.5 : 1,
            }}
          >
            {permission === "granted" ? (
              <NotificationsActive sx={{ fontSize: 15, color: "secondary.main" }} />
            ) : (
              <NotificationsOff sx={{ fontSize: 15, color: "text.disabled" }} />
            )}
            <Typography variant="caption" color={permission === "granted" ? "secondary.main" : "text.disabled"}>
              {permission === "granted" ? "Notificaciones activas" : "Activar notificaciones"}
            </Typography>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
}
