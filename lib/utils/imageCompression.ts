// Shared utility for compressing and converting images to base64 data URIs
// Usage: await compressAndConvertImagesToBase64(files: File[])

const MAX_WIDTH = 512;
const MAX_HEIGHT = 512;
const JPEG_QUALITY = 0.3;

export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = (width * MAX_HEIGHT) / height;
          height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: false });

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Fill white background BEFORE drawing image
      // Handles PNG transparency properly when converting to JPEG
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          // Free canvas memory
          canvas.width = 0;
          canvas.height = 0;
          resolve(compressedFile);
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for compression"));
    };
    img.src = objectUrl;
  });
}

export async function convertToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to convert to base64"));
        return;
      }
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
}

export async function compressAndConvertImagesToBase64(
  files: File[],
): Promise<string[]> {
  const base64Images: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const compressedFile = await compressImage(file);
    const base64 = await convertToBase64(compressedFile);
    base64Images.push(base64);
  }

  const totalSize = base64Images.reduce(
    (sum, b64) => sum + (b64.length * 0.75) / 1024 / 1024,
    0,
  );

  if (totalSize > 30) {
    console.error(
      "🚨 WARNING: Payload exceeds 30MB! May exceed Cloud Run limits!",
    );
  } else if (totalSize > 20) {
    console.warn(
      "⚠️ Payload is large (",
      totalSize.toFixed(2),
      "MB). Watch for issues.",
    );
  }

  return base64Images;
}
