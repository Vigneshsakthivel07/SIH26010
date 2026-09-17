import { query } from '../config/db.js';
import { processGeoReferencing } from '../services/spatialService.js';

// 1. Upload FMB Document (from Module 1)
export const uploadFmbDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No FMB document file uploaded' });
    }

    const { survey_number, subdivision_number } = req.body;
    if (!survey_number) {
      return res.status(400).json({ success: false, error: 'Survey number is required' });
    }

    const documentPath = req.file.path.replace(/\\/g, '/');

    const insertQuery = `
      INSERT INTO fmb_documents (survey_number, subdivision_number, document_path)
      VALUES ($1, $2, $3)
      RETURNING id, survey_number, subdivision_number, document_path, status, created_at;
    `;

    const result = await query(insertQuery, [
      survey_number,
      subdivision_number || null,
      documentPath
    ]);

    return res.status(201).json({
      success: true,
      message: 'FMB document stored successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[FMB Controller Error]', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// 2. Georeference FMB Document (from Module 2)
export const georeferenceFmb = async (req, res) => {
  try {
    const { document_id, gcps } = req.body;

    if (!document_id || !gcps || !Array.isArray(gcps) || gcps.length < 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Document ID and at least 3 Ground Control Points (GCPs) are required' 
      });
    }

    // Fetch document path from database
    const docResult = await query('SELECT document_path FROM fmb_documents WHERE id = $1', [document_id]);
    if (docResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'FMB Document not found' });
    }

    const documentPath = docResult.rows[0].document_path;

    // Call Python spatial transformation service
    const geojson = await processGeoReferencing(documentPath, gcps);

    // Save GeoJSON boundary to PostGIS using ST_GeomFromGeoJSON
    const updateQuery = `
      UPDATE fmb_documents 
      SET boundary = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
          status = 'PROCESSED'
      WHERE id = $2
      RETURNING id, survey_number, status, ST_AsGeoJSON(boundary) AS boundary_geojson;
    `;

    const dbResult = await query(updateQuery, [JSON.stringify(geojson.geometry), document_id]);

    return res.status(200).json({
      success: true,
      message: 'FMB document successfully geo-referenced and spatial polygon created',
      data: dbResult.rows[0]
    });

  } catch (error) {
    console.error('[Georeference Error]', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Processing Error' });
  }
};