import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Unified cross-platform file/image persistence used by App.tsx
 * Web: falls back to localStorage storing data URLs
 * Native: uses expo-file-system documentDirectory
 */

const isWeb = Platform.OS === 'web';
const WEB_KEY = 'images';
// Some generated type definitions in this SDK may not expose documentDirectory / FileSystemUploadType directly in the star import types, so we cast.
const docDir = (FileSystem as any).documentDirectory as string | undefined;
const baseDir = docDir ? `${docDir}images/` : 'images/';

export interface StoredImage {
  uri: string; // full path (native) or data URL / remote URL (web)
}

async function ensureDir(): Promise<void> {
  if (isWeb) return;
  if (!baseDir) return;
  try {
    const info = await FileSystem.getInfoAsync(baseDir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
    }
  } catch (e) {
    console.warn('[FSAdapter] ensureDir failed', e);
  }
}

export async function listImages(): Promise<string[]> {
  if (isWeb) {
    try {
      const raw = localStorage.getItem(WEB_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  await ensureDir();
  try {
    const files = await FileSystem.readDirectoryAsync(baseDir);
    return files.map(f => baseDir + f);
  } catch (e) {
    console.warn('[FSAdapter] listImages error', e);
    return [];
  }
}

export async function saveImage(srcUri: string, opts: { isDataUrl?: boolean } = {}): Promise<string | undefined> {
  if (isWeb) {
    // srcUri already a data URL or remote image; just store reference
    const images = await listImages();
    const updated = [...images, srcUri];
    try { localStorage.setItem(WEB_KEY, JSON.stringify(updated)); } catch {}
    return srcUri;
  }
  await ensureDir();
  const filename = `${Date.now()}.jpeg`;
  const dest = baseDir + filename;
  try {
    await FileSystem.copyAsync({ from: srcUri, to: dest });
    return dest;
  } catch (e) {
    console.warn('[FSAdapter] saveImage error', e);
    return undefined;
  }
}

export async function removeImage(uri: string): Promise<void> {
  if (isWeb) {
    try {
      const images = await listImages();
      const next = images.filter(i => i !== uri);
      localStorage.setItem(WEB_KEY, JSON.stringify(next));
    } catch {}
    return;
  }
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (e) {
    console.warn('[FSAdapter] removeImage error', e);
  }
}

export async function uploadImage(uri: string, endpoint: string): Promise<string | undefined> {
  if (isWeb) {
    try {
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
      console.warn('[FSAdapter] uploadImage web error', e);
      return undefined;
    }
  }
  try {
    const result = await (FileSystem as any).uploadAsync(endpoint, uri, {
      httpMethod: 'POST',
      headers: { 'content-type': 'image/jpeg' },
      uploadType: (FileSystem as any).FileSystemUploadType?.BINARY_CONTENT,
    });
    return result.body;
  } catch (e) {
    console.warn('[FSAdapter] uploadImage native error', e);
    return undefined;
  }
}

export const FSAdapter = {
  listImages,
  saveImage,
  removeImage,
  uploadImage,
};
