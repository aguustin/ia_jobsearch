import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Jobs } from "./pages/Jobs.jsx";
import { JobDetail } from "./pages/JobDetail.jsx";
import { Profile } from "./pages/Profile.jsx";
import { Applications } from "./pages/Applications.jsx";
import { Analytics } from "./pages/Analytics.jsx";
import { Snackbar, Alert } from "@mui/material";
import { useAppStore } from "./store/index.js";
import { useJobNotifications } from "./hooks/useJobNotifications.js";

function NotificationBridge() {
  useJobNotifications();
  return null;
}

export default function App() {
  const { notification, clearNotification } = useAppStore();

  return (
    <Layout>
      <NotificationBridge />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>

      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={clearNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        {notification && (
          <Alert onClose={clearNotification} severity={notification.severity} variant="filled">
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Layout>
  );
}
