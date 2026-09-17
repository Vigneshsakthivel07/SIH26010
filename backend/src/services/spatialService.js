import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const processGeoReferencing = (imagePath, gcpArray) => {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, '../../../python-geo-service/transform_fmb.py');
    const venvPythonPath = path.join(__dirname, '../../../python-geo-service/venv/Scripts/python.exe'); 
    // Note: On Linux/macOS change venvPythonPath to '../../python-geo-service/venv/bin/python'

    const outputJsonPath = path.join(__dirname, `../../uploads/geojson-${Date.now()}.json`);
    const gcpJsonString = JSON.stringify(gcpArray).replace(/"/g, '\\"');

    const command = `"${venvPythonPath}" "${pythonScriptPath}" "${imagePath}" "${gcpJsonString}" "${outputJsonPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('[Spatial Service Error]', stderr || error.message);
        return reject(new Error('Spatial transformation failed'));
      }

      try {
        const rawOutput = fs.readFileSync(outputJsonPath, 'utf8');
        const geojson = JSON.parse(rawOutput);
        
        // Cleanup temporary JSON file
        fs.unlinkSync(outputJsonPath);

        resolve(geojson);
      } catch (parseErr) {
        reject(new Error('Failed to parse generated spatial GeoJSON'));
      }
    });
  });
};