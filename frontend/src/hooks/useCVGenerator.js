import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cvApi } from "../api/client.js";
import { useAppStore } from "../store/index.js";

export function useCVGenerator() {
  const queryClient = useQueryClient();
  const { notify } = useAppStore();

  const [selectedCVId, setSelectedCVId] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [atsResult, setATSResult] = useState(null);

  const { data: cvList = [], isLoading: loadingCVs } = useQuery({
    queryKey: ["cvList"],
    queryFn: cvApi.list,
    staleTime: 30000,
  });

  const uploadMutation = useMutation({
    mutationFn: cvApi.upload,
    onSuccess: (newCV) => {
      queryClient.invalidateQueries({ queryKey: ["cvList"] });
      setSelectedCVId(newCV._id);
      notify(`"${newCV.originalName}" subido y procesado correctamente`, "success");
    },
    onError: (err) => {
      notify(err.response?.data?.error || "Error al subir el CV", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: cvApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["cvList"] });
      if (selectedCVId === deletedId) {
        setSelectedCVId(null);
        setATSResult(null);
      }
    },
    onError: () => {
      notify("Error al eliminar el CV", "error");
    },
  });

  const generateMutation = useMutation({
    mutationFn: ({ cvId, jobDescription: jd }) => cvApi.generateATS(cvId, jd),
    onSuccess: (result) => {
      setATSResult(result);
      notify("CV ATS generado correctamente", "success");
    },
    onError: (err) => {
      notify(err.response?.data?.error || "Error al generar el CV optimizado", "error");
    },
  });

  const handleUpload = useCallback(
    (file) => uploadMutation.mutate(file),
    [uploadMutation]
  );

  const handleDelete = useCallback(
    (id) => deleteMutation.mutate(id),
    [deleteMutation]
  );

  const handleGenerate = useCallback(() => {
    if (!selectedCVId || jobDescription.trim().length < 50) return;
    setATSResult(null);
    generateMutation.mutate({ cvId: selectedCVId, jobDescription });
  }, [selectedCVId, jobDescription, generateMutation]);

  const selectedCV = cvList.find((cv) => cv._id === selectedCVId) ?? null;

  const canGenerate =
    !!selectedCVId && jobDescription.trim().length >= 50 && !generateMutation.isPending;

  return {
    cvList,
    loadingCVs,
    selectedCVId,
    setSelectedCVId,
    selectedCV,
    jobDescription,
    setJobDescription,
    atsResult,
    setATSResult,
    handleUpload,
    handleDelete,
    handleGenerate,
    isUploading: uploadMutation.isPending,
    isGenerating: generateMutation.isPending,
    canGenerate,
  };
}
