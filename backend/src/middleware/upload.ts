import multer from 'multer';
import config from '../config/env';

// Use memory storage so we can process files with sharp before uploading
const storage = multer.memoryStorage();

const fileFilter = (
  _: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (config.allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Allowed types: ${config.allowedFileTypes.join(', ')}`
      )
    );
  }
};

// Create multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize,
  },
  fileFilter,
});

// Export middleware configurations
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number) =>
  upload.array(fieldName, maxCount);
export const uploadFields = (fields: { name: string; maxCount: number }[]) =>
  upload.fields(fields);

export default upload;
