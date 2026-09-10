/**
 * High-performance client-side image compression & optimization
 * Prevents UI freezes and avoids localStorage / Firestore quota overflows.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1024,
  quality = 0.75
): Promise<string> {
  // If PDF, convert directly
  if (file.type === 'application/pdf') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Prefer image/jpeg for highest compression efficiency on photos
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        try {
          const compressed = canvas.toDataURL(mimeType, quality);
          resolve(compressed);
        } catch {
          resolve(event.target?.result as string);
        }
      };

      img.onerror = () => {
        resolve(event.target?.result as string);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
