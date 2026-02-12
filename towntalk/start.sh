#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# TownTalk — Start server + public tunnel
#
# Tries (in order):  ngrok → cloudflared → localtunnel
# Once the tunnel URL is detected, it's pushed to the server
# so the QR code on the display page uses the public URL.
# ──────────────────────────────────────────────────────────

set -e

PORT=3002
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TUNNEL_PID=""
SERVER_PID=""

cleanup() {
  echo ""
  echo "  Shutting down…"
  [ -n "$TUNNEL_PID" ] && kill "$TUNNEL_PID" 2>/dev/null
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
  wait 2>/dev/null
  echo "  Done."
  exit 0
}
trap cleanup EXIT INT TERM

# ─── Start the Node server ───────────────────────────────────
echo ""
echo "  Starting TownTalk server on port $PORT…"
cd "$SCRIPT_DIR"
node server.js &
SERVER_PID=$!
sleep 2

# Verify server is running
if ! curl -s "http://localhost:$PORT/api/info" > /dev/null 2>&1; then
  echo "  ❌ Server failed to start. Check for errors above."
  exit 1
fi
echo "  ✅ Server running on http://localhost:$PORT"
echo ""

# ─── Try tunnels in order ────────────────────────────────────

start_tunnel() {
  local TUNNEL_URL=""

  # ── Option 1: ngrok ──────────────────────────────────────
  if command -v ngrok &> /dev/null; then
    echo "  🔍 Found ngrok — starting tunnel…"
    ngrok http "$PORT" --log=stdout --log-level=warn > /tmp/towntalk-ngrok.log 2>&1 &
    TUNNEL_PID=$!

    # Wait for ngrok to establish the tunnel (up to 10 seconds)
    for i in $(seq 1 20); do
      sleep 0.5
      TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null \
        | grep -o '"public_url":"https://[^"]*"' \
        | head -1 \
        | sed 's/"public_url":"//;s/"//')
      if [ -n "$TUNNEL_URL" ]; then
        break
      fi
    done

    if [ -n "$TUNNEL_URL" ]; then
      echo "  ✅ ngrok tunnel: $TUNNEL_URL"
      push_tunnel_url "$TUNNEL_URL"
      return 0
    else
      echo "  ⚠️  ngrok started but couldn't detect URL. Check ngrok dashboard."
      kill "$TUNNEL_PID" 2>/dev/null
      TUNNEL_PID=""
    fi
  fi

  # ── Option 2: cloudflared ────────────────────────────────
  if command -v cloudflared &> /dev/null; then
    echo "  🔍 Found cloudflared — starting tunnel…"
    cloudflared tunnel --url "http://localhost:$PORT" > /tmp/towntalk-cf.log 2>&1 &
    TUNNEL_PID=$!

    # Wait for cloudflared to output the URL (up to 15 seconds)
    for i in $(seq 1 30); do
      sleep 0.5
      TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/towntalk-cf.log 2>/dev/null | head -1)
      if [ -n "$TUNNEL_URL" ]; then
        break
      fi
    done

    if [ -n "$TUNNEL_URL" ]; then
      echo "  ✅ cloudflared tunnel: $TUNNEL_URL"
      push_tunnel_url "$TUNNEL_URL"
      return 0
    else
      echo "  ⚠️  cloudflared started but couldn't detect URL."
      kill "$TUNNEL_PID" 2>/dev/null
      TUNNEL_PID=""
    fi
  fi

  # ── Option 3: localtunnel (via npx, no install needed) ───
  if command -v npx &> /dev/null; then
    echo "  🔍 Using localtunnel via npx (no install needed)…"
    npx -y localtunnel --port "$PORT" > /tmp/towntalk-lt.log 2>&1 &
    TUNNEL_PID=$!

    # Wait for localtunnel URL (up to 20 seconds)
    for i in $(seq 1 40); do
      sleep 0.5
      TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.loca\.lt' /tmp/towntalk-lt.log 2>/dev/null | head -1)
      if [ -n "$TUNNEL_URL" ]; then
        break
      fi
    done

    if [ -n "$TUNNEL_URL" ]; then
      echo "  ✅ localtunnel: $TUNNEL_URL"
      echo "  ⚠️  Note: localtunnel shows a reminder page on first visit."
      echo "     Visitors need to click 'Click to Continue' once."
      push_tunnel_url "$TUNNEL_URL"
      return 0
    else
      echo "  ⚠️  localtunnel didn't start in time."
      kill "$TUNNEL_PID" 2>/dev/null
      TUNNEL_PID=""
    fi
  fi

  # ── No tunnel available ──────────────────────────────────
  echo "  ❌ No tunnel tool found."
  echo ""
  echo "  Install one of these:"
  echo "    brew install ngrok          (macOS)"
  echo "    brew install cloudflared    (macOS)"
  echo "    snap install ngrok          (Linux)"
  echo "    npm install -g localtunnel  (any OS)"
  echo ""
  echo "  Or set manually:"
  echo "    TUNNEL_URL=https://your-url.ngrok.io node server.js"
  echo ""
  return 1
}

push_tunnel_url() {
  local URL="$1"
  # Push the URL to the running server
  curl -s -X POST "http://localhost:$PORT/api/tunnel" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$URL\"}" > /dev/null 2>&1

  echo ""
  echo "  ╔═══════════════════════════════════════════════════╗"
  echo "  ║          📱  Share this with your audience        ║"
  echo "  ╠═══════════════════════════════════════════════════╣"
  echo "  ║                                                   ║"
  echo "  ║  $( printf '%-50s' "$URL/mobile.html" )║"
  echo "  ║                                                   ║"
  echo "  ╚═══════════════════════════════════════════════════╝"
  echo ""
  echo "  Display page: http://localhost:$PORT"
  echo "  Press Q on the display to show QR code"
  echo ""
}

start_tunnel

# ─── Keep alive ──────────────────────────────────────────────
echo "  Press Ctrl+C to stop everything."
echo ""
wait "$SERVER_PID"
