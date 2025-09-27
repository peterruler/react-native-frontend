import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Unified cross-platform file/image persistence used by App.tsx
 * Web: falls back to localStorage storing data URLs
 * Native: uses expo-file-system documentDirectory
 */

const isWeb = Platform.OS === 'web';
const WEB_KEY = 'images';
// Wir speichern nur Referenzen (URIs oder Data URLs) – kein echtes Dateisystem mehr nötig
const baseDir = 'images://';

export interface StoredImage {
  uri: string; // full path (native) or data URL / remote URL (web)
}

async function ensureDir(): Promise<void> { /* no-op */ }

export async function listImages(): Promise<string[]> {
  try {
    if (isWeb) {
      const raw = localStorage.getItem(WEB_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }
    const raw = await AsyncStorage.getItem(WEB_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function saveImage(srcUri: string, opts: { isDataUrl?: boolean } = {}): Promise<string | undefined> {
  const images = await listImages();
  const updated = [...images, srcUri];
  try {
    if (isWeb) {
      localStorage.setItem(WEB_KEY, JSON.stringify(updated));
    } else {
      await AsyncStorage.setItem(WEB_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.warn('[FSAdapter] saveImage error', e);
  }
  return srcUri;
}

export async function removeImage(uri: string): Promise<void> {
  try {
    const images = await listImages();
    const next = images.filter(i => i !== uri);
    if (isWeb) {
      localStorage.setItem(WEB_KEY, JSON.stringify(next));
    } else {
      await AsyncStorage.setItem(WEB_KEY, JSON.stringify(next));
    }
  } catch {}
}

export async function uploadImage(uri: string, endpoint: string): Promise<string | undefined> {
  try {
    // Einheitlicher Upload: wir holen immer ein Blob (wenn Data URL) oder fetchen die Ressource erneut
    let blob: Blob;
    if (uri.startsWith('data:')) {
      const res = await fetch(uri);
      blob = await res.blob();
    } else {
      const res = await fetch(uri);
      blob = await res.blob();
    }
    const resp = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: blob });
    return await resp.text();
  } catch (e) {
    console.warn('[FSAdapter] uploadImage error', e);
    return undefined;
  }
}

export const FSAdapter = {
  listImages,
  saveImage,
  removeImage,
  uploadImage,
};
