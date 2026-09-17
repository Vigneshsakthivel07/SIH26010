import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const processGeoReferencing = (imagePath, gcpArray) => {
  return new Promise((resolve, reject) => {
    // FIX 1: Point to the 'bin/python' directory shown in your VS Code image
    const pythonScriptPath = path.join(__dirname, '../../../python-geo-service/transform_fmb.py');
    const venvPythonPath = path.join(__dirname, '../../../python-geo-service/venv/bin/python'); 

    // FIX 2: Ensure the image path is absolute so GDAL can always find it
    const absoluteImagePath = path.resolve(process.cwd(), imagePath);

    // FIX 3: Create temporary file paths to safely pass data between Node and Python
    const timestamp = Date.now();
    const tempGcpPath = path.join(__dirname, `../../uploads/gcp-temp-${timestamp}.json`);
    const outputJsonPath = path.join(__dirname, `../../uploads/geojson-out-${timestamp}.json`);

    // Write the GCP array to the temporary JSON file
    fs.writeFileSync(tempGcpPath, JSON.stringify(gcpArray));

    // Command now passes file paths instead of raw JSON strings
    const command = `"${venvPythonPath}" "${pythonScriptPath}" "${absoluteImagePath}" "${tempGcpPath}" "${outputJsonPath}"`;

    exec(command, (error, stdout, stderr) => {
      // Cleanup the temporary GCP file immediately after execution
      if (fs.existsSync(tempGcpPath)) fs.unlinkSync(tempGcpPath);

      if (error) {
        console.error('[Spatial Service Error]', stderr || error.message);
        return reject(new Error('Spatial transformation failed: ' + (stderr || error.message)));
      }

      try {
        const rawOutput = fs.readFileSync(outputJsonPath, 'utf8');
        const geojson = JSON.parse(rawOutput);
        
        // Cleanup the generated GeoJSON file
        if (fs.existsSync(outputJsonPath)) fs.unlinkSync(outputJsonPath);

        resolve(geojson);
      } catch (parseErr) {
        reject(new Error('Failed to parse generated spatial GeoJSON. Check Python script output.'));
      }
    });
  });
};