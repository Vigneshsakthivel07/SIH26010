import { query } from '../config/db.js';

export const setupDgpsSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Surveyor Connected: ${socket.id}`);

    socket.on('track_location', async (data) => {
      const { document_id, lat, lng } = data;

      if (!document_id || !lat || !lng) return;

      try {
        // FIX: ST_Boundary(boundary) isolates the perimeter line so interior points
        // calculate their true distance to the nearest edge instead of returning 0.
        const spatialQuery = `
          SELECT 
            ST_Contains(boundary, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS is_inside,
            ST_Distance(
              ST_Boundary(boundary)::geography, 
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ) AS distance_meters
          FROM fmb_documents 
          WHERE id = $3;
        `;

        const result = await query(spatialQuery, [lng, lat, document_id]);

        if (result.rows.length > 0) {
          const { is_inside, distance_meters } = result.rows[0];
          
          let status = 'SAFE'; 
          if (!is_inside) {
            status = 'OUT_OF_BOUNDS';
          } else if (is_inside && distance_meters <= 2.0) {
            status = 'WARNING_NEAR_EDGE';
          }

          socket.emit('location_alert', {
            lat, 
            lng,
            status,
            distance_to_edge: Math.round(distance_meters * 100) / 100,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('[Socket Spatial Error]', error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Surveyor Disconnected: ${socket.id}`);
    });
  });
};