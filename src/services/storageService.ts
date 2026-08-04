import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

/**
 * Compresses an image file client-side to a JPEG Data URL
 */
export function compressImageFile(
  file: File,
  maxWidth = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Erro ao ler o ficheiro de imagem."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("O ficheiro selecionado não é uma imagem válida."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image to Firebase Storage with automatic progress tracking
 * and graceful fallback to optimized Data URL if storage is unavailable.
 */
export async function uploadImageToStorage(
  file: File,
  folder: "products" | "bi_documents" | "profiles" | "general",
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  // Always update progress start
  if (onProgress) onProgress(10);

  const sanitizeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniquePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${sanitizeName}`;

  try {
    const storageRef = ref(storage, uniquePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          if (onProgress) onProgress(Math.min(95, Math.max(15, progress)));
        },
        async (error) => {
          console.warn("Firebase Storage upload fallback triggering due to:", error.message);
          try {
            // Fallback to local canvas compression data URL
            if (onProgress) onProgress(70);
            const compressed = await compressImageFile(file);
            if (onProgress) onProgress(100);
            resolve(compressed);
          } catch (compressErr) {
            reject(error);
          }
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve(downloadUrl);
          } catch (urlErr) {
            const compressed = await compressImageFile(file);
            if (onProgress) onProgress(100);
            resolve(compressed);
          }
        }
      );
    });
  } catch (error) {
    console.warn("Direct Storage upload failed, utilizing client-side optimized encoding fallback.", error);
    if (onProgress) onProgress(70);
    const compressed = await compressImageFile(file);
    if (onProgress) onProgress(100);
    return compressed;
  }
}
