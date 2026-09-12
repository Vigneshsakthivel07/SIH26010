import { query } from '../config/db.js';

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