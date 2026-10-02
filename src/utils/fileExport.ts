import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function safeFileName(name: string): string {
  return name.replace(/[^a-z0-9._-]+/gi, '-').replace(/-+/g, '-').slice(0, 100) || 'whisknote';
}

/**
 * Save a JSON/text file. Browsers get a normal download; the native iOS/Android
 * webviews ignore `<a download>`, so there we write to the cache dir and open
 * the system share sheet (Save to Files, Drive, email, etc.).
 */
export async function saveTextFile(fileName: string, contents: string, mimeType = 'application/json'): Promise<void> {
  const name = safeFileName(fileName);

  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({
      path: name,
      data: contents,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: name, files: [uri] });
    return;
  }

  const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Share plain text via the native share sheet when available. Returns false if unsupported. */
export async function shareText(title: string, text: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    await Share.share({ title, text, dialogTitle: title });
    return true;
  }
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    await navigator.share({ title, text });
    return true;
  }
  return false;
}
