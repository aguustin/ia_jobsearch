import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { cvApi } from "../api/client.js";
import { useAppStore } from "../store/index.js";

export function useCVComparison(cvList) {
  const notify = useAppStore((s) => s.notify);
  const [cvId1, setCvId1] = useState("");
  const [cvId2, setCvId2] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [comparisonResult, setComparisonResult] = useState(null);

  const { mutate: compare, isPending: isComparing } = useMutation({
    mutationFn: () => cvApi.compareATS(cvId1, cvId2, jobDescription),
    onSuccess: (data) => {
      setComparisonResult(data);
      notify("Comparación completada", "success");
    },
    onError: (err) => {
      notify(err.response?.data?.error || "Error al comparar CVs", "error");
    },
  });

  const canCompare =
    cvId1 && cvId2 && cvId1 !== cvId2 && jobDescription.trim().length >= 50 && !isComparing;

  return {
    cvId1, setCvId1,
    cvId2, setCvId2,
    jobDescription, setJobDescription,
    comparisonResult,
    compare,
    isComparing,
    canCompare,
  };
}
