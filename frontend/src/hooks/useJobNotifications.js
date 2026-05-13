import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../store/index.js";
const STORAGE_KEY = "notif_min_score";

export function getNotifMinScore() {
  return parseInt(localStorage.getItem(STORAGE_KEY) || "75", 10);
}

export function setNotifMinScore(value) {
  localStorage.setItem(STORAGE_KEY, String(value));
}

export function useJobNotifications() {
  const notify = useAppStore((s) => s.notify);
  const queryClient = useQueryClient();
  const esRef = useRef(null);
  const retryRef = useRef(null);

  // Ask for permission once — only if not already decided
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    function connect() {
      if (esRef.current) esRef.current.close();

      const es = new EventSource("/api/system/events");
      esRef.current = es;

      es.onmessage = (e) => {
        let data;
        try { data = JSON.parse(e.data); } catch { return; }

        if (data.type !== "job-analyzed") return;

        const { job } = data;

        // Refresh the jobs list so the new score appears immediately
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
        queryClient.invalidateQueries({ queryKey: ["jobStats"] });

        // In-app toast
        notify(
          `Nueva oferta analizada: ${job.title} en ${job.company} — Score ${job.score}/100`,
          job.score >= 85 ? "success" : "info"
        );

        // OS desktop notification
        if ("Notification" in window && Notification.permission === "granted") {
          const n = new Notification(`Score ${job.score} · ${job.title}`, {
            body: `${job.company}  ·  ${job.source}`,
            icon: "/favicon.ico",
            tag: job._id,          // prevents duplicate toasts for same job
            requireInteraction: job.score >= 85,
          });

          // Clicking the OS notification focuses the tab
          n.onclick = () => {
            window.focus();
            window.location.href = `/jobs/${job._id}`;
          };
        }
      };

      es.onerror = () => {
        es.close();
        // Reconnect after 5 s — handles backend restart gracefully
        retryRef.current = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      clearTimeout(retryRef.current);
    };
  }, []);
}
