import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export type PhotoSource = 'camera' | 'library';

/**
 * Open the camera or the photo library and return a temporary image URI,
 * or null when the user cancels or denies permission.
 */
export async function pickPhoto(source: PhotoSource): Promise<string | null> {
  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;
    result = await ImagePicker.launchCameraAsync({ quality: 0.7, exif: false });
  } else {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      exif: false,
    });
  }
  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}

/**
 * Copy a temporary picker image into the app's document directory so it
 * survives cache cleanups. Returns the persistent URI.
 */
export async function persistPhoto(sourceUri: string, fileStem: string): Promise<string> {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const destination = new File(dir, `${fileStem}.${extensionOf(sourceUri)}`);
  await new File(sourceUri).copy(destination);
  return destination.uri;
}

/** Remove a persisted photo. Errors are ignored: the entry matters more. */
export function deletePhoto(uri: string | null): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The file may already be gone. Nothing to do.
  }
}

function extensionOf(uri: string): string {
  const match = /\.([a-zA-Z0-9]{2,5})(?:\?.*)?$/.exec(uri);
  return match ? match[1].toLowerCase() : 'jpg';
}
