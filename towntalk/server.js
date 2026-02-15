const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORT = 3000;

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

// ─── Waiting Room (shown before display.html is live-coded) ──
const WAITING_ROOM_HTML = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TownTalk — Scan to Join</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#07070f;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;overflow:hidden}
canvas#starfield{position:fixed;inset:0;z-index:0}
.card{position:relative;z-index:1;text-align:center;background:rgba(17,24,39,0.85);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:48px 56px;backdrop-filter:blur(20px);max-width:480px}
.logo{font-size:48px;margin-bottom:8px}
h1{font-size:32px;font-weight:700;margin-bottom:6px;background:linear-gradient(135deg,#818cf8,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.subtitle{color:#94a3b8;font-size:16px;margin-bottom:32px}
#qr-container{display:inline-block;background:#fff;border-radius:16px;padding:16px;margin-bottom:20px}
.url{font-family:monospace;font-size:14px;color:#94a3b8;word-break:break-all;margin-bottom:16px}
.badge{display:inline-block;font-size:12px;padding:4px 12px;border-radius:20px;margin-bottom:16px}
.badge.tunnel{background:rgba(34,197,94,0.12);color:#22c55e;border:1px solid rgba(34,197,94,0.25)}
.badge.local{background:rgba(234,179,8,0.12);color:#eab308;border:1px solid rgba(234,179,8,0.25)}
.hint{color:#64748b;font-size:13px;margin-top:8px}
.stats{position:fixed;bottom:24px;z-index:1;display:flex;gap:24px;font-size:14px;color:#64748b}
.stats span{color:#e2e8f0;font-weight:600;font-variant-numeric:tabular-nums}
.pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-right:6px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,0.5)}50%{opacity:0.7;box-shadow:0 0 0 6px rgba(34,197,94,0)}}
</style></head><body>
<canvas id="starfield"></canvas>
<div class="card">
  <div class="logo">💬</div>
  <h1>TownTalk</h1>
  <p class="subtitle">Scan to join the live Q&A</p>
  <div id="qr-container"></div>
  <div id="url-display" class="url">Loading...</div>
  <div id="badge-display"></div>
  <p class="hint">Waiting for the show to start...</p>
</div>
<div class="stats"><div><span class="pulse"></span>LIVE</div><div>Connected: <span id="user-count">0</span></div></div>
<script>
// Starfield
const c=document.getElementById('starfield'),ctx=c.getContext('2d');
let stars=[];
function resizeCanvas(){c.width=innerWidth;c.height=innerHeight;stars=Array.from({length:100},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*1.2+0.3,speed:Math.random()*0.4+0.1,phase:Math.random()*Math.PI*2}))}
resizeCanvas();window.addEventListener('resize',resizeCanvas);
function drawStars(t){ctx.clearRect(0,0,c.width,c.height);stars.forEach(s=>{const a=0.25+0.55*(0.5+0.5*Math.sin(t*0.001*s.speed+s.phase));ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,'+a+')';ctx.fill()});requestAnimationFrame(drawStars)}
requestAnimationFrame(drawStars);

// QR code + polling
let currentUrl='';
async function refreshQR(){
  try{
    const r=await fetch('/api/info');
    const info=await r.json();
    const mobileUrl=info.url+'/mobile.html';
    document.getElementById('url-display').textContent=mobileUrl;
    const badge=document.getElementById('badge-display');
    badge.innerHTML=info.tunnelUrl?'<div class="badge tunnel">🌐 Public URL — anyone can join</div>':'<div class="badge local">📡 Local network only</div>';
    if(mobileUrl!==currentUrl){
      currentUrl=mobileUrl;
      const container=document.getElementById('qr-container');
      container.innerHTML='';
      new QRCode(container,{text:mobileUrl,width:220,height:220,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M});
    }
  }catch(e){console.warn('Failed to fetch /api/info',e)}
}
refreshQR();
setInterval(refreshQR,5000);

// WebSocket for audience count
let ws;
function connectWS(){
  ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);
  ws.onopen=()=>ws.send(JSON.stringify({type:'join',role:'display',clientId:'waiting-room'}));
  ws.onmessage=e=>{try{const m=JSON.parse(e.data);if(m.type==='state'&&m.stats)document.getElementById('user-count').textContent=m.stats.connectedUsers}catch(ex){}};
  ws.onclose=()=>setTimeout(connectWS,2000);
}
connectWS();

// Auto-refresh when display.html appears (check every 3s)
setInterval(async()=>{
  try{
    const r=await fetch('/display.html',{method:'HEAD'});
    const ct=r.headers.get('content-type')||'';
    // The waiting room is ~4KB, a real display.html will be much larger
    const cl=parseInt(r.headers.get('content-length')||'0',10);
    if(r.ok&&cl>10000)location.reload();
  }catch(e){}
},3000);
<\/script>
</body></html>`;

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
      // If display.html doesn't exist yet, serve a built-in waiting room with QR code
      if (urlPath === '/' || urlPath === '/display.html') {
        res.writeHead(200, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
        res.end(WAITING_ROOM_HTML);
        return;
      }
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
