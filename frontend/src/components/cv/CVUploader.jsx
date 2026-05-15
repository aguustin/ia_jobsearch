import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box, Typography, CircularProgress, Paper,
} from "@mui/material";
import { CloudUpload as UploadIcon } from "@mui/icons-material";

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

export function CVUploader({ onUpload, isUploading }) {
  const onDrop = useCallback(
    (accepted) => {
      if (accepted[0]) onUpload(accepted[0]);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isUploading,
  });

  const rejected = fileRejections[0];
  const errorMsg = rejected?.errors?.[0]?.message;

  return (
    <Paper
      {...getRootProps()}
      variant="outlined"
      sx={{
        p: 3,
        textAlign: "center",
        cursor: isUploading ? "not-allowed" : "pointer",
        border: "2px dashed",
        borderColor: isDragActive ? "primary.main" : errorMsg ? "error.main" : "rgba(255,255,255,0.15)",
        borderRadius: 2,
        bgcolor: isDragActive ? "rgba(108,99,255,0.08)" : "transparent",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: isUploading ? undefined : "primary.main",
          bgcolor: isUploading ? undefined : "rgba(108,99,255,0.05)",
        },
      }}
    >
      <input {...getInputProps()} />

      {isUploading ? (
        <Box>
          <CircularProgress size={32} sx={{ mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Procesando CV con IA...
          </Typography>
        </Box>
      ) : (
        <Box>
          <UploadIcon
            sx={{
              fontSize: 36,
              color: isDragActive ? "primary.main" : "text.disabled",
              mb: 1,
              transition: "color 0.2s",
            }}
          />
          <Typography variant="body2" color={isDragActive ? "primary.main" : "text.primary"} fontWeight={500}>
            {isDragActive ? "Soltá el archivo aquí" : "Arrastrá un CV o hacé click"}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            PDF o DOCX — máx. 10 MB
          </Typography>
          {errorMsg && (
            <Typography variant="caption" color="error.main" display="block" mt={0.5}>
              {errorMsg.includes("size") ? "El archivo supera los 10 MB" : "Solo se aceptan PDF o DOCX"}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}
