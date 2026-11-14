const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateProfilePhoto(image) {
  if (!image || !ALLOWED_PHOTO_TYPES.includes(image.mimeType)) {
    return 'Choose a JPEG, PNG, or WebP image.';
  }
  const fileSize = image.fileSize ?? image.file?.size;
  if (!Number.isFinite(fileSize)) return 'Could not read the photo size. Choose a different image.';
  if (fileSize > MAX_PHOTO_SIZE) return 'Choose an image that is 5 MB or smaller.';
  return '';
}
