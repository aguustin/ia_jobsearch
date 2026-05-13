import {
  Box, Typography, Stack, TextField, Select, MenuItem,
  FormControl, InputLabel, Pagination, InputAdornment,
  ToggleButton, ToggleButtonGroup, LinearProgress, Chip,
} from "@mui/material";
import { Search, FilterList } from "@mui/icons-material";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { jobsApi } from "../api/client.js";
import { JobCard } from "../components/JobCard.jsx";

const STATUSES = [
  { value: "", label: "Todas" },
  { value: "new", label: "Nuevas" },
  { value: "analyzed", label: "Analizadas" },
  { value: "shortlisted", label: "Seleccionadas" },
  { value: "applied", label: "Aplicadas" },
  { value: "rejected", label: "Descartadas" },
];

const SOURCES = [
  { value: "", label: "Todas las fuentes" },
  { value: "remoteok", label: "RemoteOK" },
  { value: "weworkremotely", label: "WeWorkRemotely" },
  { value: "getonbrd", label: "GetOnBrd" },
  { value: "computrabajo", label: "Computrabajo" },
];

const SORTS = [
  { value: "-analysis.score", label: "Mayor score" },
  { value: "-fetchedAt", label: "Más recientes" },
  { value: "company", label: "Empresa A-Z" },
];

export function Jobs() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("-analysis.score");
  const [minScore, setMinScore] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", { status, source, language, sort, minScore, page, search: debouncedSearch }],
    queryFn: () => jobsApi.list({ status, source, language, sort, minScore, page, limit: 15, search: debouncedSearch }),
    placeholderData: (prev) => prev,
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Ofertas Laborales</Typography>
        <Typography color="text.secondary" variant="body2">
          {data?.total || 0} ofertas encontradas
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Buscar por título, empresa o tecnología..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ flex: 1 }}
        />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={status} label="Estado" onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Fuente</InputLabel>
          <Select value={source} label="Fuente" onChange={(e) => { setSource(e.target.value); setPage(1); }}>
            {SOURCES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Idioma</InputLabel>
          <Select value={language} label="Idioma" onChange={(e) => { setLanguage(e.target.value); setPage(1); }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="en">Inglés</MenuItem>
            <MenuItem value="es">Español</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Ordenar</InputLabel>
          <Select value={sort} label="Ordenar" onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Score mín."
          type="number"
          inputProps={{ min: 0, max: 100 }}
          value={minScore}
          onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
          sx={{ width: 110 }}
        />
      </Stack>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Stack spacing={2}>
        {data?.jobs?.map((job) => (
          <JobCard key={job._id} job={job} />
        ))}
        {!isLoading && !data?.jobs?.length && (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography>No hay ofertas con estos filtros.</Typography>
          </Box>
        )}
      </Stack>

      {data?.pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={data.pages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}
