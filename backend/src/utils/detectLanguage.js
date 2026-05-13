const SPANISH_MARKERS = /\b(de|la|el|que|los|las|del|por|con|una|para|como|trabajo|empresa|experiencia|años|conocimiento|habilidades|equipo|proyecto|desarrollo|requisitos|ofrecemos|buscamos|modalidad|salario|sueldo|requerimientos|responsabilidades|excluyente|deseable|contrato|postulante|candidato|remoto|beneficios|horario)\b/gi;

export function detectLanguage(text = "") {
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 15) return "en";
  const matches = (text.match(SPANISH_MARKERS) || []).length;
  return matches / words >= 0.04 ? "es" : "en";
}
