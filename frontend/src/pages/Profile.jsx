import {
  Box, Typography, Card, CardContent, TextField, Button,
  Grid, Chip, Stack, Divider, CircularProgress, Alert,
  Autocomplete, Switch, FormControlLabel,
} from "@mui/material";
import { Save, Add, Delete } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../api/client.js";
import { useAppStore } from "../store/index.js";

const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

const DEFAULT_PROFILE = {
  name: "",
  title: "Full Stack Developer",
  email: "",
  location: "",
  summary: "",
  skills: [],
  experience: [],
  education: [],
  languages: [],
  preferences: {
    roles: ["Full Stack Developer", "Frontend Developer"],
    technologies: ["React", "Node.js"],
    remoteOnly: true,
    locations: [],
    salaryMin: null,
    currency: "USD",
  },
  cvText: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
};

export function Profile() {
  const notify = useAppStore((s) => s.notify);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(DEFAULT_PROFILE);
  const [newSkill, setNewSkill] = useState({ name: "", level: "intermediate", years: 1 });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.get,
  });

  useEffect(() => {
    if (profile) setForm({ ...DEFAULT_PROFILE, ...profile });
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (data) => profileApi.update(data),
    onSuccess: () => {
      notify("Perfil guardado correctamente", "success");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => notify("Error al guardar el perfil", "error"),
  });

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setPref = (field, value) =>
    setForm((f) => ({ ...f, preferences: { ...f.preferences, [field]: value } }));

  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    set("skills", [...form.skills, { ...newSkill }]);
    setNewSkill({ name: "", level: "intermediate", years: 1 });
  };

  const removeSkill = (idx) => set("skills", form.skills.filter((_, i) => i !== idx));

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4">Mi Perfil</Typography>
          <Typography color="text.secondary" variant="body2">
            La IA usa este perfil para evaluar las ofertas
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Save />}
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
        >
          Guardar
        </Button>
      </Box>

      {!profile && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Completá tu perfil para que la IA pueda analizar las ofertas y generar mensajes personalizados.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Información personal</Typography>
              <Stack spacing={2}>
                <TextField label="Nombre completo" value={form.name} onChange={(e) => set("name", e.target.value)} fullWidth required />
                <TextField label="Título profesional" value={form.title} onChange={(e) => set("title", e.target.value)} fullWidth />
                <TextField label="Email" value={form.email} onChange={(e) => set("email", e.target.value)} fullWidth />
                <TextField label="Ubicación" value={form.location} onChange={(e) => set("location", e.target.value)} fullWidth placeholder="Ej: Buenos Aires, Argentina" />
                <Box>
                  <TextField
                    label="Resumen profesional"
                    value={form.summary}
                    onChange={(e) => set("summary", e.target.value)}
                    fullWidth multiline rows={6}
                    placeholder="Escribí tu resumen profesional aquí. Se usará como base en todos los CVs generados..."
                    helperText="Este resumen se usa en el generador de CVs. Ollama puede reescribirlo según el puesto, pero este texto es el punto de partida."
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Links</Typography>
              <Stack spacing={2}>
                <TextField label="LinkedIn URL" value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} fullWidth />
                <TextField label="GitHub URL" value={form.githubUrl} onChange={(e) => set("githubUrl", e.target.value)} fullWidth />
                <TextField label="Portfolio URL" value={form.portfolioUrl} onChange={(e) => set("portfolioUrl", e.target.value)} fullWidth />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Skills</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                {form.skills.map((skill, idx) => (
                  <Chip
                    key={idx}
                    label={`${skill.name} · ${skill.level} · ${skill.years}yr`}
                    onDelete={() => removeSkill(idx)}
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  label="Skill"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill((s) => ({ ...s, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Nivel"
                  select
                  SelectProps={{ native: true }}
                  value={newSkill.level}
                  onChange={(e) => setNewSkill((s) => ({ ...s, level: e.target.value }))}
                  sx={{ width: 140 }}
                >
                  {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </TextField>
                <TextField
                  size="small"
                  label="Años"
                  type="number"
                  inputProps={{ min: 0, max: 30 }}
                  value={newSkill.years}
                  onChange={(e) => setNewSkill((s) => ({ ...s, years: parseInt(e.target.value) || 1 }))}
                  sx={{ width: 80 }}
                />
                <Button variant="outlined" onClick={addSkill} startIcon={<Add />}>Agregar</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Preferencias de búsqueda</Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.preferences.remoteOnly}
                      onChange={(e) => setPref("remoteOnly", e.target.checked)}
                    />
                  }
                  label="Solo posiciones remotas"
                />
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={form.preferences.roles}
                  onChange={(_, v) => setPref("roles", v)}
                  renderTags={(val, getTagProps) =>
                    val.map((opt, idx) => <Chip label={opt} size="small" {...getTagProps({ index: idx })} />)
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Roles buscados" placeholder="Agregar rol..." size="small" />
                  )}
                />
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={form.preferences.technologies}
                  onChange={(_, v) => setPref("technologies", v)}
                  renderTags={(val, getTagProps) =>
                    val.map((opt, idx) => <Chip label={opt} size="small" {...getTagProps({ index: idx })} />)
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Tecnologías preferidas" placeholder="Agregar tecnología..." size="small" />
                  )}
                />
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Salario mínimo"
                    type="number"
                    value={form.preferences.salaryMin || ""}
                    onChange={(e) => setPref("salaryMin", parseInt(e.target.value) || null)}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Moneda"
                    value={form.preferences.currency}
                    onChange={(e) => setPref("currency", e.target.value)}
                    size="small"
                    sx={{ width: 80 }}
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Texto del CV</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Pegá el texto completo de tu CV. La IA lo usará como contexto para evaluar ofertas y generar mensajes.
              </Typography>
              <TextField
                multiline
                minRows={10}
                fullWidth
                value={form.cvText}
                onChange={(e) => set("cvText", e.target.value)}
                placeholder="Pegá tu CV aquí..."
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
