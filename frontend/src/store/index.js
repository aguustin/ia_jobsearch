import { create } from "zustand";

export const useAppStore = create((set) => ({
  sidebarOpen: true,
  notification: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  notify: (message, severity = "success") =>
    set({ notification: { message, severity, key: Date.now() } }),

  clearNotification: () => set({ notification: null }),
}));
