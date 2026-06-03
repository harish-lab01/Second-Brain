import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Upload a file to Firebase Storage with progress callback.
 * @param {File} file
 * @param {string} userId
 * @param {function} onProgress - called with 0-100 percentage
 * @returns {Promise<string>} download URL
 */
export function uploadFile(file, userId, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `pdfs/${userId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress?.(progress);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

/**
 * Delete a file from Firebase Storage by its download URL.
 * @param {string} fileUrl
 */
export async function deleteFile(fileUrl) {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (err) {
    console.error('Error deleting file:', err);
  }
}
