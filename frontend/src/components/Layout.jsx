import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { Sidebar } from "./Sidebar.jsx";
import { useAppStore } from "../store/index.js";

const SIDEBAR_WIDTH = 240;

export function Layout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {isMobile ? (
        <Drawer
          open={sidebarOpen}
          variant="temporary"
          sx={{ "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, bgcolor: "background.paper" } }}
        >
          <Sidebar />
        </Drawer>
      ) : (
        <Box
          component="nav"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            bgcolor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
          }}
        >
          <Sidebar />
        </Box>
      )}

      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, overflow: "auto", minHeight: "100vh" }}
      >
        {children}
      </Box>
    </Box>
  );
}
