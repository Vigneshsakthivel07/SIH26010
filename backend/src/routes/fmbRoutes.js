import express from 'express';
import { uploadFmbDocument, georeferenceFmb } from '../controllers/fmbController.js';

const router = express.Router();

// Existing upload route
router.post('/upload', upload.single('fmb_document'), uploadFmbDocument);

// New Geo-referencing route
router.post('/georeference', georeferenceFmb);

export default router;