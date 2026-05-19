import { useState } from "react";

const STORAGE_KEY = "cv_profile_photo";

// Compresses the image to max 250x250px JPEG before storing in localStorage
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 250;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export function useProfilePhoto() {
  const [photo, setPhoto] = useState(() => localStorage.getItem(STORAGE_KEY) || null);

  const uploadPhoto = async (file) => {
    const compressed = await compressImage(file);
    localStorage.setItem(STORAGE_KEY, compressed);
    setPhoto(compressed);
  };

  const removePhoto = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPhoto(null);
  };

  return { photo, uploadPhoto, removePhoto };
}
