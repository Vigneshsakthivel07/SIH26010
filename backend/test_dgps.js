import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// Simulating a surveyor walking through Document ID: 4
const route = [
  { lat: 11.0083, lng: 77.0072, desc: "Deep inside the land" },
  { lat: 11.00845, lng: 77.00685, desc: "Right near the boundary edge" },
  { lat: 11.0150, lng: 77.0010, desc: "Trespassing completely outside" }
];

socket.on('connect', () => {
  console.log('📡 Connected to DGPS WebSocket Server');
  
  let step = 0;
  
  // Blast a new GPS coordinate to the server every 2 seconds
  const walk = setInterval(() => {
    if (step >= route.length) {
      clearInterval(walk);
      socket.disconnect();
      console.log('\n🏁 Simulation complete.');
      return;
    }

    const point = route[step];
    console.log(`\n🚶‍♂️ Moving to: ${point.desc} (Lat: ${point.lat}, Lng: ${point.lng})`);
    
    socket.emit('track_location', {
      document_id: 4, 
      lat: point.lat,
      lng: point.lng
    });
    
    step++;
  }, 2000); 
});

// Listen for the PostGIS math calculations coming back
socket.on('location_alert', (data) => {
  console.log('🚨 POSTGIS ALERT RECEIVED:');
  console.log(`   Status: ${data.status}`);
  console.log(`   Distance to Edge: ${data.distance_to_edge} meters`);
});

socket.on('connect_error', (err) => {
  console.error('Connection failed:', err.message);
});