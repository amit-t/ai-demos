const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORT = 3001;

// ─── Tunnel URL ──────────────────────────────────────────────
let tunnelUrl = process.env.TUNNEL_URL || null;

// ─── Station Data ────────────────────────────────────────────
const STATION_NAMES = [
  'Downtown Hub',    'Airport East',   'Highway 101',    'Marina Bay',
  'Central Plaza',   'Northgate',      'Riverside',      'Tech Park',
];

const FUEL_TYPES = ['Regular', 'Premium', 'Diesel', 'EV Charge'];

let stations = [];
let hourlyRevenue = [];
let alerts = [];
let alertIdCounter = 1;
let kpis = { transactions: 0, revenue: 0, activePumps: 0, avgPrice: 0 };

// ─── Feature Voting (audience interaction) ───────────────────
let features = [
  { id: 'f1', text: 'Dark / Light mode toggle',            votes: 0 },
  { id: 'f2', text: 'Animated alert banner',                votes: 0 },
  { id: 'f3', text: 'Revenue sparkline chart',              votes: 0 },
  { id: 'f4', text: 'Station drill-down detail panel',      votes: 0 },
  { id: 'f5', text: 'Real-time pump utilisation bars',      votes: 0 },
  { id: 'f6', text: 'Fuel price comparison widget',         votes: 0 },
];
let featureNextId = 7;
const featureVotes = {}; // clientId → Set<featureId>

// ─── WebSocket ───────────────────────────────────────────────
const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const connectedClients = new Set();

function acceptKey(key) {
  return crypto.createHash('sha1').update(key + WS_MAGIC).digest('base64');
}

function decodeFrame(buffer) {
  if (buffer.length < 2) return null;
  const opcode = buffer[0] & 0x0F;
  if (opcode === 0x08) return { opcode, payload: '', totalLength: buffer.length };
  if (opcode === 0x09) return { opcode, payload: '', totalLength: 2 };
  if (opcode === 0x0A) return { opcode, payload: '', totalLength: 2 };

  const masked = (buffer[1] & 0x80) !== 0;
  let payloadLength = buffer[1] & 0x7F;
  let offset = 2;

  if (payloadLength === 126) {
    if (buffer.length < 4) return null;
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    if (buffer.length < 10) return null;
    payloadLength = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }

  if (masked) {
    if (buffer.length < offset + 4 + payloadLength) return null;
    const maskKey = buffer.slice(offset, offset + 4);
    offset += 4;
    const payload = buffer.slice(offset, offset + payloadLength);
    for (let i = 0; i < payload.length; i++) payload[i] ^= maskKey[i % 4];
    return { opcode, payload: payload.toString('utf8'), totalLength: offset + payloadLength };
  }

  if (buffer.length < offset + payloadLength) return null;
  return { opcode, payload: buffer.slice(offset, offset + payloadLength).toString('utf8'), totalLength: offset + payloadLength };
}

function encodeFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function createWSClient(socket) {
  let buffer = Buffer.alloc(0);
  const client = {
    socket, role: 'unknown', clientId: null,
    send(data) {
      if (!socket.writable) return;
      try { socket.write(encodeFrame(typeof data === 'string' ? data : JSON.stringify(data))); }
      catch (e) { /* ignore */ }
    },
    close() {
      try { const f = Buffer.alloc(2); f[0] = 0x88; f[1] = 0x00; socket.write(f); socket.end(); }
      catch (e) { /* ignore */ }
    },
    onMessage: null, onClose: null,
  };

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length > 0) {
      const frame = decodeFrame(buffer);
      if (!frame) break;
      if (frame.opcode === 0x08) { connectedClients.delete(client); if (client.onClose) client.onClose(); socket.end(); return; }
      if (frame.opcode === 0x09) { const p = Buffer.alloc(2); p[0] = 0x8A; p[1] = 0x00; socket.write(p); }
      if (frame.opcode === 0x01 && client.onMessage) client.onMessage(frame.payload);
      buffer = buffer.slice(frame.totalLength || buffer.length);
    }
  });

  socket.on('close', () => { connectedClients.delete(client); if (client.onClose) client.onClose(); });
  socket.on('error', () => { connectedClients.delete(client); if (client.onClose) client.onClose(); });
  return client;
}

// ─── Simulation Engine ───────────────────────────────────────
function initStations() {
  stations = STATION_NAMES.map((name, i) => {
    const totalPumps = Math.floor(Math.random() * 4) + 4; // 4-7 pumps
    const activePumps = Math.floor(Math.random() * (totalPumps + 1));
    const status = activePumps === 0 ? 'offline' : activePumps < totalPumps * 0.3 ? 'warning' : 'online';
    return {
      id: `s${i + 1}`,
      name,
      status,
      totalPumps,
      activePumps,
      todayTransactions: Math.floor(Math.random() * 200) + 50,
      todayRevenue: Math.floor(Math.random() * 15000) + 3000,
      fuelPrices: {
        Regular: +(2.8 + Math.random() * 0.5).toFixed(2),
        Premium: +(3.2 + Math.random() * 0.5).toFixed(2),
        Diesel:  +(3.0 + Math.random() * 0.4).toFixed(2),
        'EV Charge': +(0.3 + Math.random() * 0.15).toFixed(2),
      },
      utilizationPct: Math.round((activePumps / totalPumps) * 100),
    };
  });

  // Generate 24h of hourly revenue data
  const now = new Date();
  hourlyRevenue = [];
  for (let h = 0; h < 24; h++) {
    const hour = new Date(now);
    hour.setHours(h, 0, 0, 0);
    // Bell curve peaking at 8am and 5pm
    const morningPeak = Math.exp(-0.5 * Math.pow((h - 8) / 2.5, 2));
    const eveningPeak = Math.exp(-0.5 * Math.pow((h - 17) / 2.5, 2));
    const base = 2000 + (morningPeak + eveningPeak) * 8000;
    const noise = (Math.random() - 0.5) * 1500;
    hourlyRevenue.push({
      hour: h,
      label: `${h.toString().padStart(2, '0')}:00`,
      revenue: Math.max(500, Math.round(base + noise)),
    });
  }

  // Initial alerts
  alerts = [
    { id: alertIdCounter++, type: 'warning', text: 'Station #4 — Pump 3 offline for maintenance', time: Date.now() - 120000 },
    { id: alertIdCounter++, type: 'info',    text: 'Premium fuel price updated across 5 stations', time: Date.now() - 60000 },
  ];

  recalcKpis();
}

function recalcKpis() {
  kpis.transactions = stations.reduce((s, st) => s + st.todayTransactions, 0);
  kpis.revenue = stations.reduce((s, st) => s + st.todayRevenue, 0);
  kpis.activePumps = stations.reduce((s, st) => s + st.activePumps, 0);
  const totalPumps = stations.reduce((s, st) => s + st.totalPumps, 0);
  kpis.pumpUtilization = totalPumps ? Math.round((kpis.activePumps / totalPumps) * 100) : 0;

  const allPrices = stations.flatMap(st => [st.fuelPrices.Regular, st.fuelPrices.Premium, st.fuelPrices.Diesel]);
  kpis.avgPrice = +(allPrices.reduce((s, p) => s + p, 0) / allPrices.length).toFixed(2);
}

// Tick — simulates live data changes every 3s
function simulationTick() {
  stations.forEach(st => {
    // Random pump changes
    if (Math.random() < 0.3) {
      const delta = Math.random() < 0.5 ? 1 : -1;
      st.activePumps = Math.max(0, Math.min(st.totalPumps, st.activePumps + delta));
      st.utilizationPct = Math.round((st.activePumps / st.totalPumps) * 100);
      st.status = st.activePumps === 0 ? 'offline' : st.activePumps < st.totalPumps * 0.3 ? 'warning' : 'online';
    }

    // Transaction trickle
    if (Math.random() < 0.6) {
      const newTx = Math.floor(Math.random() * 3) + 1;
      st.todayTransactions += newTx;
      st.todayRevenue += newTx * (30 + Math.floor(Math.random() * 40));
    }

    // Small price fluctuations
    if (Math.random() < 0.1) {
      const type = FUEL_TYPES[Math.floor(Math.random() * 3)]; // not EV
      st.fuelPrices[type] = +(st.fuelPrices[type] + (Math.random() - 0.5) * 0.04).toFixed(2);
    }
  });

  // Occasionally add revenue to current hour
  const currentHour = new Date().getHours();
  if (hourlyRevenue[currentHour]) {
    hourlyRevenue[currentHour].revenue += Math.floor(Math.random() * 200) + 50;
  }

  // Random alerts (5% chance each tick)
  if (Math.random() < 0.05) {
    const alertTemplates = [
      { type: 'warning', text: `Station ${STATION_NAMES[Math.floor(Math.random() * 8)]} — Pump ${Math.floor(Math.random() * 6) + 1} reporting low pressure` },
      { type: 'success', text: `Station ${STATION_NAMES[Math.floor(Math.random() * 8)]} — Maintenance complete, all pumps online` },
      { type: 'info',    text: `Fuel delivery arriving at ${STATION_NAMES[Math.floor(Math.random() * 8)]} in 30 min` },
      { type: 'warning', text: `Station ${STATION_NAMES[Math.floor(Math.random() * 8)]} — Card reader timeout on Pump ${Math.floor(Math.random() * 6) + 1}` },
      { type: 'success', text: `Daily target reached at ${STATION_NAMES[Math.floor(Math.random() * 8)]}!` },
    ];
    const tmpl = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
    alerts.push({ id: alertIdCounter++, ...tmpl, time: Date.now() });
    if (alerts.length > 10) alerts.shift();
  }

  recalcKpis();
  broadcastDashboard();
}

// ─── Message Handling ────────────────────────────────────────
function handleMessage(client, msg) {
  switch (msg.type) {
    case 'join':
      client.role = msg.role || 'mobile';
      client.clientId = msg.clientId;
      broadcastDashboard();
      break;

    case 'vote_feature': {
      if (!msg.featureId || !msg.clientId) return;
      if (!featureVotes[msg.clientId]) featureVotes[msg.clientId] = new Set();
      if (featureVotes[msg.clientId].has(msg.featureId)) return; // already voted
      const f = features.find(f => f.id === msg.featureId);
      if (!f) return;
      featureVotes[msg.clientId].add(msg.featureId);
      f.votes++;
      broadcastDashboard();
      break;
    }

    case 'unvote_feature': {
      if (!msg.featureId || !msg.clientId) return;
      if (!featureVotes[msg.clientId]) return;
      if (!featureVotes[msg.clientId].has(msg.featureId)) return;
      const f = features.find(f => f.id === msg.featureId);
      if (!f) return;
      featureVotes[msg.clientId].delete(msg.featureId);
      f.votes = Math.max(0, f.votes - 1);
      broadcastDashboard();
      break;
    }

    case 'suggest_feature': {
      const text = (msg.text || '').trim();
      if (!text || text.length > 120) return;
      features.push({ id: `f${featureNextId++}`, text, votes: 1 });
      if (msg.clientId) {
        if (!featureVotes[msg.clientId]) featureVotes[msg.clientId] = new Set();
        featureVotes[msg.clientId].add(features[features.length - 1].id);
      }
      broadcastDashboard();
      break;
    }

    case 'reset':
      initStations();
      features.forEach(f => f.votes = 0);
      Object.keys(featureVotes).forEach(k => delete featureVotes[k]);
      broadcastDashboard();
      break;
  }
}

// ─── Broadcasting ────────────────────────────────────────────
function broadcastDashboard() {
  const mobileCount = [...connectedClients].filter(c => c.role === 'mobile').length;
  const sortedFeatures = [...features].sort((a, b) => b.votes - a.votes);

  const data = JSON.stringify({
    type: 'dashboard',
    stations,
    hourlyRevenue,
    alerts: alerts.slice(-5).reverse(), // last 5, newest first
    kpis,
    features: sortedFeatures,
    stats: {
      connectedUsers: mobileCount,
      totalFeatureVotes: features.reduce((s, f) => s + f.votes, 0),
    },
  });

  for (const client of connectedClients) {
    client.send(data);
  }
}

// ─── HTTP Server ─────────────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // API: server info
  if (req.url === '/api/info') {
    const ip = getLocalIP();
    const localUrl = `http://${ip}:${PORT}`;
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ip, port: PORT, url: tunnelUrl || localUrl, localUrl, tunnelUrl: tunnelUrl || null }));
    return;
  }

  // API: set tunnel URL
  if (req.url === '/api/tunnel' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.url) {
          tunnelUrl = data.url.replace(/\/+$/, '');
          console.log(`  🌐 Tunnel URL set: ${tunnelUrl}`);
          console.log(`  📱 Share this:     ${tunnelUrl}/mobile.html`);
          broadcastDashboard();
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, tunnelUrl }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // API: get tunnel status
  if (req.url === '/api/tunnel' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ tunnelUrl }));
    return;
  }

  // Static files
  const urlPath = req.url.split('?')[0];
  const filePath = path.join(__dirname, 'public', urlPath === '/' ? 'display.html' : urlPath);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  });
});

// ─── WebSocket Upgrade ───────────────────────────────────────
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${acceptKey(key)}\r\n` +
    '\r\n'
  );

  const client = createWSClient(socket);
  connectedClients.add(client);

  client.onMessage = (raw) => {
    try { handleMessage(client, JSON.parse(raw)); }
    catch (e) { /* ignore */ }
  };

  client.onClose = () => { broadcastDashboard(); };

  // Send initial state
  const mobileCount = [...connectedClients].filter(c => c.role === 'mobile').length;
  client.send(JSON.stringify({
    type: 'dashboard',
    stations,
    hourlyRevenue,
    alerts: alerts.slice(-5).reverse(),
    kpis,
    features: [...features].sort((a, b) => b.votes - a.votes),
    stats: { connectedUsers: mobileCount, totalFeatureVotes: features.reduce((s, f) => s + f.votes, 0) },
  }));
});

// ─── Helpers ─────────────────────────────────────────────────
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

function padRight(str, len) {
  return str + ' '.repeat(Math.max(0, len - str.length));
}

// ─── Start ───────────────────────────────────────────────────
initStations();
setInterval(simulationTick, 3000); // live data every 3s

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('');
  console.log('  ╔═══════════════════════════════════════════════════╗');
  console.log('  ║         ⛽  Station Command Server                ║');
  console.log('  ╠═══════════════════════════════════════════════════╣');
  console.log(`  ║  Display:  http://localhost:${PORT}                   ║`);
  console.log(`  ║  Local:    http://${padRight(ip, 15)}:${PORT}           ║`);
  if (tunnelUrl) {
    console.log(`  ║  Public:   ${padRight(tunnelUrl, 39)} ║`);
    console.log(`  ║  Share:    ${padRight(tunnelUrl + '/mobile.html', 39)} ║`);
  } else {
    console.log('  ║  Public:   (none — run ./start.sh for tunnel)      ║');
  }
  console.log('  ╚═══════════════════════════════════════════════════╝');
  console.log('');
  if (!tunnelUrl) {
    console.log('  💡 To expose publicly, run:');
    console.log('     ./start.sh');
    console.log('');
  }
  console.log('  Data updates every 3 seconds automatically.');
  console.log('  Keyboard shortcuts on the display page:');
  console.log('    [Q] Toggle QR code   [F] Fullscreen');
  console.log('    [R] Reset data       [Esc] Close panels');
  console.log('');
});
