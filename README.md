# IA JobSearch — Agente Inteligente de Búsqueda Laboral

Sistema personal que automatiza la búsqueda y análisis de ofertas laborales usando inteligencia artificial local. Recopila ofertas de múltiples plataformas, las analiza contra tu perfil profesional y te ayuda a preparar postulaciones personalizadas — sin costos de API ni envío de datos a terceros.

---

## ¿Qué hace el sistema?

### Recopilación automática de ofertas
Busca ofertas cada hora en cuatro fuentes simultáneamente:
- **Computrabajo** — ofertas locales Argentina
- **GetOnBrd** — plataforma tech latinoamericana
- **RemoteOK** — empleos remotos internacionales
- **WeWorkRemotely** — empleos remotos internacionales

Incluye deduplicación inteligente: si la misma oferta aparece en dos plataformas, se guarda una sola vez.

### Análisis IA por oferta
Cada oferta nueva es analizada automáticamente contra tu perfil y devuelve:
- **Score 0–100** — qué tan bien encaja con tu experiencia y preferencias
- **Por qué encaja** — razones concretas de compatibilidad
- **Skills faltantes** — qué te piden que aún no tenés
- **Aspectos destacados** — los mejores puntos de la oferta
- **Posibles preocupaciones** — red flags o puntos a evaluar
- **Nivel de seniority** detectado (junior / mid / senior / lead)
- **Resumen general** en 2–3 oraciones

### Generador de mensajes de postulación
Genera un mensaje personalizado para cada oferta, adaptado a tu perfil y al tono de la empresa. Podés adjuntar el CV guardado en tu perfil o subir uno específico para esa postulación.

### Preparación para entrevistas
Genera 9 preguntas específicas para cada oferta:
- 4 preguntas técnicas basadas en el stack y tus gaps
- 3 preguntas de comportamiento (formato STAR)
- 2 preguntas para hacerle al entrevistador

Podés marcar cada pregunta como practicada y ver tu progreso con una barra de avance.

### Kanban de postulaciones
Tablero visual para trackear cada aplicación:

**Enviadas → En revisión → Entrevista → Oferta → Rechazadas**

Drag & drop para mover postulaciones entre columnas.

### Analytics del mercado
Dashboard con tendencias basadas en las ofertas analizadas:
- Tecnologías más demandadas y gap de skills
- Distribución de scores
- Actividad semanal
- Mejores empresas por score promedio
- Desglose por fuente

### Notificaciones en tiempo real
Cuando una oferta nueva supera el score mínimo configurado (por defecto 75/100), recibís una notificación de escritorio y un toast en la app.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Backend | Node.js 20 + Express (ESM) |
| Base de datos | MongoDB 7 |
| Cola de tareas | BullMQ + Redis 7 |
| IA | Ollama — llama3.2 (local, sin costo) |
| Frontend | React 18 + Vite + Material UI v5 |
| Estado | Zustand + TanStack Query v5 |

---

## Requisitos

- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Ollama](https://ollama.com)

---

## Instalación

### 1. Instalar dependencias

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Variables de entorno

Crear `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/ia_job_search
REDIS_URL=redis://localhost:6379
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
PORT=3001

# Fetch automático cada hora (en ms)
FETCH_INTERVAL_MS=3600000

# Score mínimo para notificaciones de escritorio
NOTIFY_MIN_SCORE=75

# Keywords para Computrabajo (opcional, separadas por coma)
# COMPUTRABAJO_KEYWORDS=programador,desarrollador,developer
```

### 3. Levantar infraestructura

```bash
# En la carpeta raíz del proyecto
docker compose up -d
```

### 4. Descargar el modelo de IA

```bash
ollama pull llama3.2
```

### 5. Iniciar el sistema

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Acceder

- **App:** http://localhost:5173
- **API health:** http://localhost:3001/api/system/health

---

## Primer uso

1. **Configurar tu perfil** — ir a *Mi Perfil* y completar nombre, skills, experiencia y preferencias. La calidad del análisis IA depende directamente de qué tan completo esté el perfil.

2. **Disparar el primer fetch** — desde el Dashboard hacer clic en *Buscar ofertas ahora*. El primer fetch puede demorar unos minutos.

3. **Esperar el análisis** — las ofertas nuevas entran a una cola y la IA las procesa de a una. Con CPU el análisis tarda entre 30 y 90 segundos por oferta.

4. **Explorar y filtrar** — en *Ofertas* podés filtrar por idioma, fuente, score mínimo, estado y buscar por título o tecnología.

---

## Tiempos de respuesta de la IA

Los tiempos dependen del hardware disponible:

| Tarea | CPU (estimado) |
|---|---|
| Análisis de oferta | 30–90 seg |
| Generación de mensaje | 60–180 seg |
| Preguntas de entrevista | 45–120 seg |

Con GPU NVIDIA los tiempos son 5–10x menores — Ollama la detecta automáticamente.

Para reducir tiempos en CPU cambiar el modelo a `llama3.2:1b` en el `.env`.

---

## Arquitectura

```
┌─────────────────┐     ┌──────────────────────────────┐
│   React + Vite  │────▶│        Express API           │
│  localhost:5173 │     │       localhost:3001          │
└─────────────────┘     └──────┬───────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    BullMQ Queues     │
                    │  ┌───────────────┐  │
                    │  │  fetch-jobs   │  │──▶ Computrabajo
                    │  │  (cada 1h)    │  │──▶ GetOnBrd
                    │  └───────┬───────┘  │──▶ RemoteOK
                    │          │          │──▶ WeWorkRemotely
                    │  ┌───────▼───────┐  │
                    │  │ analyze-jobs  │  │──▶ Ollama (llama3.2)
                    │  └───────────────┘  │
                    └──────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   MongoDB + Redis   │
                    │     (Docker)        │
                    └─────────────────────┘
```

---

## Estructura del proyecto

```
ia_lets_work/
├── backend/
│   ├── src/
│   │   ├── api/routes/        # Endpoints REST
│   │   ├── models/            # Schemas MongoDB (Job, Profile, Application)
│   │   ├── providers/         # Connectors por fuente
│   │   │   ├── BaseProvider.js
│   │   │   ├── ComputrabajoProvider.js
│   │   │   ├── GetOnBrdProvider.js
│   │   │   ├── RemoteOKProvider.js
│   │   │   ├── WeWorkRemotelyProvider.js
│   │   │   └── registry.js
│   │   ├── queues/            # BullMQ workers y processors
│   │   ├── services/          # JobAnalyzer, MessageGenerator, InterviewPrepGenerator
│   │   └── utils/             # detectLanguage, deduplication
│   └── .env
├── frontend/
│   └── src/
│       ├── pages/             # Dashboard, Jobs, JobDetail, Applications, Analytics, Profile
│       ├── components/        # Layout, Sidebar, JobCard, KanbanBoard, ScoreGauge
│       ├── hooks/             # useJobNotifications (SSE tiempo real)
│       └── store/             # Zustand global state
└── docker-compose.yml
```

---

## Agregar una nueva fuente de trabajo

1. Crear `backend/src/providers/MiFuenteProvider.js` extendiendo `BaseProvider`
2. Implementar `fetchJobs()` y `normalizeJob()` con el schema estándar
3. Registrar en `backend/src/providers/registry.js`

## API Reference

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/jobs` | Listar ofertas (filtros: status, source, language, minScore, search) |
| GET | `/api/jobs/stats` | Estadísticas generales |
| GET | `/api/jobs/:id` | Detalle de una oferta |
| PATCH | `/api/jobs/:id/status` | Cambiar estado |
| POST | `/api/jobs/:id/analyze` | Re-analizar con IA |
| POST | `/api/jobs/:id/generate-message` | Generar mensaje de postulación |
| POST | `/api/jobs/:id/interview-prep` | Generar preguntas de entrevista |
| GET | `/api/profile` | Obtener perfil |
| PUT | `/api/profile` | Actualizar perfil completo |
| GET | `/api/applications` | Listar postulaciones |
| POST | `/api/applications` | Registrar postulación |
| GET | `/api/analytics` | Datos para dashboard de analytics |
| GET | `/api/system/health` | Estado del sistema y Ollama |
| POST | `/api/system/fetch` | Disparar búsqueda manual |
| GET | `/api/system/events` | SSE stream para notificaciones en tiempo real |

## Estados de una oferta

```
new → analyzing → analyzed → shortlisted → applied
                           ↘ rejected
```
