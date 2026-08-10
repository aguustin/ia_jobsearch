module.exports = {
  apps: [
    // ia_jobsearch
    { name: "jobsearch-front", script: "cmd", args: "/c npm run dev", cwd: "C:/ia_jobsearch/frontend" },
    { name: "jobsearch-back",  script: "cmd", args: "/c npm run dev", cwd: "C:/ia_jobsearch/backend"  },

    // cobranza
    { name: "cobranza-front", script: "cmd", args: "/c npm run dev", cwd: "C:/cobranza/client" },
    { name: "cobranza-back",  script: "cmd", args: "/c npm run dev", cwd: "C:/cobranza/server" },

    // newGomarket
    { name: "gomarket-front", script: "cmd", args: "/c npm run dev", cwd: "C:/newGomarket/client" },
    { name: "gomarket-back",  script: "cmd", args: "/c npm run dev", cwd: "C:/newGomarket/server" },

    // obras_particulares
    { name: "obras-front", script: "cmd", args: "/c npm run dev", cwd: "C:/obras_particulares/frontend" },
    { name: "obras-back",  script: "cmd", args: "/c npm run dev", cwd: "C:/obras_particulares/backend"  },

    // pythonTasks
    { name: "tasks-front", script: "cmd", args: "/c npm run dev", cwd: "C:/pythonTasks/taskfront"    },
    { name: "tasks-back",  script: "cmd", args: "/c npm run dev", cwd: "C:/pythonTasks/tasksManager" },

    // saas
    { name: "saas-front", script: "cmd", args: "/c npm run dev", cwd: "C:/saas/frontend" },
    { name: "saas-back",  script: "cmd", args: "/c npm run dev", cwd: "C:/saas/backend"  },
  ],
};
