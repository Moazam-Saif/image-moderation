const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const FOLDER = 'content-moderation'; // all uploads grouped under this folder in Cloudinary

/**
 * Upload an in-memory image buffer to Cloudinary.
 *
 * @param {Buffer} buffer    - Raw image bytes (from multer memoryStorage)
 * @param {string} mimeType  - e.g. 'image/jpeg'
 * @param {string} userId    - Used to namespace files per user in Cloudinary
 * @returns {Promise<{ url: string, publicId: string }>}
 */
function uploadImageBuffer(buffer, mimeType, userId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${FOLDER}/${userId}`,
        resource_type: 'image',
        // Cloudinary auto-generates a unique public_id if not provided
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by its public_id.
 * Used if a submission needs to be purged (not currently wired into any route,
 * but available for future admin "delete image" functionality).
 */
async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadImageBuffer, deleteImage };
