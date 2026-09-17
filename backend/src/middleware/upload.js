import multer from 'multer';
import path from 'path';
import fs from 'fs';


// --------------------------------------------------
// Upload directory
// --------------------------------------------------

const uploadDirectory = path.join(process.cwd(), 'uploads');


// Create /uploads directory if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}


// --------------------------------------------------
// Multer storage configuration
// --------------------------------------------------

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {

    const timestamp = Date.now();

    const extension = path.extname(file.originalname);

    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, '_');

    cb(
      null,
      `${timestamp}-${baseName}${extension}`
    );
  }

});


// --------------------------------------------------
// File validation
// --------------------------------------------------

const fileFilter = (req, file, cb) => {

  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPEG, PNG and PDF files are allowed.'
      ),
      false
    );
  }

};


// --------------------------------------------------
// Multer configuration
// --------------------------------------------------

const upload = multer({

  storage: storage,

  fileFilter: fileFilter,

  limits: {
    fileSize: 15 * 1024 * 1024
  }

});


// --------------------------------------------------
// Export
// --------------------------------------------------

export default upload;