import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isFirebaseConfigured } from '../../lib/firebase';

export interface UploadResult {
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  sizeBytes: number;
}

export const storageService = {
  /**
   * Upload a file to Firebase Storage with size/type validation and client-side fallback
   */
  async uploadFile(
    file: File,
    directory: 'gallery' | 'announcements' | 'events' | 'expenses' | 'branding' | 'receipts',
    customFileName?: string
  ): Promise<UploadResult> {
    // 1. Validation
    const maxSizeBytes = directory === 'expenses' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File exceeds maximum permitted size of ${maxSizeBytes / (1024 * 1024)}MB`);
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
      throw new Error('Unsupported file format. Please upload JPG, PNG, WEBP or PDF documents.');
    }

    const cleanName = customFileName || `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `${directory}/${cleanName}`;

    // 2. Firebase Storage Upload if configured
    if (isFirebaseConfigured() && storage) {
      try {
        const storageRef = ref(storage, storagePath);
        const metadata = {
          contentType: file.type,
          customMetadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        };

        const uploadSnap = await uploadBytes(storageRef, file, metadata);
        const downloadUrl = await getDownloadURL(uploadSnap.ref);

        return {
          downloadUrl,
          storagePath,
          fileName: cleanName,
          sizeBytes: file.size,
        };
      } catch (err) {
        console.warn('[Firebase Storage] Upload failed, falling back to client data URL:', err);
      }
    }

    // 3. Fallback to Data URL for instant preview/demo
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          downloadUrl: reader.result as string,
          storagePath,
          fileName: cleanName,
          sizeBytes: file.size,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read file locally'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Remove file from Firebase Storage
   */
  async deleteFile(storagePath: string): Promise<void> {
    if (isFirebaseConfigured() && storage && storagePath) {
      try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn('[Firebase Storage] File delete error:', err);
      }
    }
  },
};
