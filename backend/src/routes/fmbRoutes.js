import express from 'express';

import {
  uploadFmbDocument,
  georeferenceFmb
} from '../controllers/fmbController.js';

import upload from '../middleware/upload.js';


const router = express.Router();


// --------------------------------------------------
// FMB Document Upload
// --------------------------------------------------
//
// POST /api/fmb/upload
//
// Form-data:
// survey_number
// subdivision_number
// fmb_document -> file
//

router.post(
  '/upload',
  upload.single('fmb_document'),
  uploadFmbDocument
);


// --------------------------------------------------
// FMB Geo-referencing
// --------------------------------------------------
//
// POST /api/fmb/georeference
//
// JSON:
// {
//   "document_id": 1,
//   "gcps": [...]
// }
//

router.post(
  '/georeference',
  georeferenceFmb
);


// --------------------------------------------------
// Export router
// --------------------------------------------------

export default router;