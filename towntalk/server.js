const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORT = 3002;

// ─── Tunnel URL ──────────────────────────────────────────────
// Set via: TUNNEL_URL=https://xxx.ngrok.io node server.js
//     or:  POST /api/tunnel { "url": "https://xxx.ngrok.io" }
let tunnelUrl = process.env.TUNNEL_URL || null;

// ─── State ───────────────────────────────────────────────────
let questions = [];
let nextId = 1;
const clientVotes = {};             // clientId → Set<questionId>
const connectedClients = new Set(); // Set of WebSocket-like objects

const SEED_QUESTIONS = [
  "What's our biggest opportunity in 2026?",
  "How can we better support remote team members?",
  "What technology trend excites you most?",
  "Should we do more cross-team events?",
  "What's one thing you'd change about our culture?",
  "How are we thinking about AI in our products?",
  "What's the best part of working here?",
];

function initSeeds() {
  SEED_QUESTIONS.forEach(text => {
    questions.push({
      id: `q${nextId++}`,
      text,
      votes: Math.floor(Math.random() * 10) + 1,
      timestamp: Date.now() - Math.random() * 120000,
    });
  });
}

// ─── Minimal WebSocket Server (no dependencies) ──────────────
const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function acceptKey(key) {
  return crypto.createHash('sha1')
    .update(key + WS_MAGIC)
    .digest('base64');
}

function decodeFrame(buffer) {
  if (buffer.length < 2) return null;

  const firstByte = buffer[0];
  const opcode = firstByte & 0x0F;
  if (opcode === 0x08) return { opcode, payload: '' }; // close
  if (opcode === 0x09) return { opcode, payload: '' }; // ping
  if (opcode === 0x0A) return { opcode, payload: '' }; // pong

  const secondByte = buffer[1];
  const masked = (secondByte & 0x80) !== 0;
  let payloadLength = secondByte & 0x7F;
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
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= maskKey[i % 4];
    }
    return { opcode, payload: payload.toString('utf8'), totalLength: offset + payloadLength };
  }

  if (buffer.length < offset + payloadLength) return null;
  return {
    opcode,
    payload: buffer.slice(offset, offset + payloadLength).toString('utf8'),
    totalLength: offset + payloadLength,
  };
}

function encodeFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  const len = payload.length;
  let header;

  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + text opcode
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
    socket,
    role: 'unknown',
    clientId: null,

    send(data) {
      if (!socket.writable) return;
      try { socket.write(encodeFrame(typeof data === 'string' ? data : JSON.stringify(data))); }
      catch (e) { /* ignore */ }
    },

    close() {
      try {
        const closeFrame = Buffer.alloc(2);
        closeFrame[0] = 0x88;
        closeFrame[1] = 0x00;
        socket.write(closeFrame);
        socket.end();
      } catch (e) { /* ignore */ }
    },

    onMessage: null,
    onClose: null,
  };

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length > 0) {
      const frame = decodeFrame(buffer);
      if (!frame) break;

      if (frame.opcode === 0x08) {
        // Close frame
        connectedClients.delete(client);
        if (client.onClose) client.onClose();
        socket.end();
        return;
      }

      if (frame.opcode === 0x09) {
        // Ping → send pong
        const pong = Buffer.alloc(2);
        pong[0] = 0x8A;
        pong[1] = 0x00;
        socket.write(pong);
      }

      if (frame.opcode === 0x01 && client.onMessage) {
        client.onMessage(frame.payload);
      }

      buffer = buffer.slice(frame.totalLength || buffer.length);
    }
  });

  socket.on('close', () => {
    connectedClients.delete(client);
    if (client.onClose) client.onClose();
  });

  socket.on('error', () => {
    connectedClients.delete(client);
    if (client.onClose) client.onClose();
  });

  return client;
}

// ─── HTTP Server ─────────────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // ─── API: server info (used by QR code generation) ────────
  if (req.url === '/api/info') {
    const ip = getLocalIP();
    const localUrl = `http://${ip}:${PORT}`;
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({
      ip,
      port: PORT,
      url: tunnelUrl || localUrl,
      localUrl,
      tunnelUrl: tunnelUrl || null,
    }));
    return;
  }

  // ─── API: set tunnel URL dynamically ──────────────────────
  if (req.url === '/api/tunnel' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.url) {
          tunnelUrl = data.url.replace(/\/+$/, ''); // strip trailing slash
          console.log(`  🌐 Tunnel URL set: ${tunnelUrl}`);
          console.log(`  📱 Share this:     ${tunnelUrl}/mobile.html`);
          // Notify all connected displays to refresh their QR code
          broadcastState();
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

  // ─── API: get tunnel status ───────────────────────────────
  if (req.url === '/api/tunnel' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ tunnelUrl }));
    return;
  }

  const urlPath = req.url.split('?')[0];
  const filePath = path.join(__dirname, 'public', urlPath === '/' ? 'display.html' : urlPath);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
});

// ─── WebSocket Upgrade Handler ───────────────────────────────
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }

  const accept = acceptKey(key);
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n` +
    '\r\n'
  );

  const client = createWSClient(socket);
  connectedClients.add(client);

  client.onMessage = (raw) => {
    try {
      const msg = JSON.parse(raw);
      handleMessage(client, msg);
    } catch (e) { /* ignore bad JSON */ }
  };

  client.onClose = () => {
    broadcastState();
  };

  // Send initial state
  client.send(JSON.stringify({
    type: 'state',
    questions: getSortedQuestions(),
    stats: getStats(),
  }));
});

// ─── Message Handling ────────────────────────────────────────
function handleMessage(client, msg) {
  switch (msg.type) {
    case 'join':
      client.role = msg.role || 'mobile';
      client.clientId = msg.clientId;
      broadcastState();
      break;

    case 'submit': {
      const text = (msg.text || '').trim();
      if (!text || text.length > 280) return;
      questions.push({
        id: `q${nextId++}`,
        text,
        votes: 0,
        timestamp: Date.now(),
      });
      broadcastState();
      break;
    }

    case 'upvote': {
      if (!msg.questionId || !msg.clientId) return;
      if (!clientVotes[msg.clientId]) clientVotes[msg.clientId] = new Set();
      if (clientVotes[msg.clientId].has(msg.questionId)) return;
      const q = questions.find(q => q.id === msg.questionId);
      if (!q) return;
      clientVotes[msg.clientId].add(msg.questionId);
      q.votes++;
      broadcastState();
      break;
    }

    case 'downvote': {
      if (!msg.questionId || !msg.clientId) return;
      if (!clientVotes[msg.clientId]) return;
      if (!clientVotes[msg.clientId].has(msg.questionId)) return;
      const q = questions.find(q => q.id === msg.questionId);
      if (!q) return;
      clientVotes[msg.clientId].delete(msg.questionId);
      q.votes = Math.max(0, q.votes - 1);
      broadcastState();
      break;
    }

    case 'remove':
      questions = questions.filter(q => q.id !== msg.questionId);
      broadcastState();
      break;

    case 'reset':
      questions = [];
      nextId = 1;
      Object.keys(clientVotes).forEach(k => delete clientVotes[k]);
      initSeeds();
      broadcastState();
      break;
  }
}

// ─── Helpers ─────────────────────────────────────────────────
function getSortedQuestions() {
  return [...questions].sort((a, b) => b.votes - a.votes);
}

function getStats() {
  const mobile = [...connectedClients].filter(c => c.role === 'mobile').length;
  return {
    totalQuestions: questions.length,
    totalVotes: questions.reduce((sum, q) => sum + q.votes, 0),
    connectedUsers: mobile,
  };
}

function broadcastState() {
  const data = JSON.stringify({
    type: 'state',
    questions: getSortedQuestions(),
    stats: getStats(),
  });
  for (const client of connectedClients) {
    client.send(data);
  }
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// ─── Start ───────────────────────────────────────────────────
initSeeds();
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('');
  console.log('  ╔═══════════════════════════════════════════════╗');
  console.log('  ║            🎤  TownTalk Server                ║');
  console.log('  ╠═══════════════════════════════════════════════╣');
  console.log(`  ║  Display:  http://localhost:${PORT}               ║`);
  console.log(`  ║  Local:    http://${padRight(ip, 15)}:${PORT}       ║`);
  if (tunnelUrl) {
    console.log(`  ║  Public:   ${padRight(tunnelUrl, 35)} ║`);
    console.log(`  ║  Share:    ${padRight(tunnelUrl + '/mobile.html', 35)} ║`);
  } else {
    console.log('  ║  Public:   (none — run ./start.sh for tunnel)  ║');
  }
  console.log('  ╚═══════════════════════════════════════════════╝');
  console.log('');
  if (!tunnelUrl) {
    console.log('  💡 To expose publicly, run:');
    console.log('     ./start.sh          (auto-detects ngrok/cloudflared)');
    console.log('     — or —');
    console.log('     TUNNEL_URL=https://your-tunnel.ngrok.io node server.js');
    console.log('');
  }
  console.log('  Keyboard shortcuts on the display page:');
  console.log('    [Q] Toggle QR code   [S] Simulate votes');
  console.log('    [F] Fullscreen       [R] Reset questions');
  console.log('    [Esc] Close spotlight');
  console.log('');
});

function padRight(str, len) {
  return str + ' '.repeat(Math.max(0, len - str.length));
}
