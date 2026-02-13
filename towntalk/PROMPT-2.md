# Prompt 2 — Spotlight + QR Code

## What to Say (before pasting)

> "I want to be able to click a question to zoom in on it. And I need a way for you all to join."

## The Prompt

Add two features to `public/display.html`. Add the QRCode.js CDN in the `<head>`:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
```

**1. Spotlight mode:**
- Make each `.bubble` group clickable. On click, open a full-screen spotlight overlay.
- Add the click handler on the merged selection (after enter.merge): `merged.style('cursor', 'pointer').on('click', (event, d) => openSpotlight(d));`
- The overlay is a `<div>` with `position: fixed; inset: 0; z-index: 50; background: rgba(7,7,15,0.85); backdrop-filter: blur(20px);`
- Centered card (max-width 800px, rounded 24px corners, background #111827, border: 1px solid rgba(255,255,255,0.1)):
  - Question text at 36–40px font size, font-weight 600
  - Vote count in large text (64px) with gradient color (indigo → purple via background-clip: text)
  - "votes" label below in #64748b
  - Close ✕ button top-right
- Entry: overlay opacity 0→1, card `transform: scale(0.9) → scale(1)` with `cubic-bezier(0.34, 1.56, 0.64, 1)` over 300ms
- Close on: Escape key, click outside card, or ✕ button
- Store the spotlighted question ID. In your WebSocket state handler, if spotlight is open, update the displayed vote count from the latest data.

**2. QR code overlay:**
- Press Q to toggle a full-screen QR overlay (z-index: 100, above spotlight).
- On open, fetch `GET /api/info` — this returns:
  ```json
  { "ip": "192.168.1.5", "port": 3000, "url": "https://abc.ngrok-free.app", "localUrl": "http://192.168.1.5:3000", "tunnelUrl": "https://abc.ngrok-free.app" }
  ```
  The `url` field is the best URL (tunnel if available, else local IP).
- Build QR URL: `info.url + '/mobile.html'`
- Create QR code using: `new QRCode(containerElement, { text: mobileUrl, width: 220, height: 220, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.M })`
- Display centered on dark blurred backdrop: white-background card with QR image, "Join TownTalk" title, scan instruction subtitle, and the URL in monospace below.
- Below URL: if `info.tunnelUrl` exists, show green badge "🌐 Public URL"; else amber badge "📡 Local network only"
- **Poll `/api/info` every 5 seconds** using `setInterval`. If the URL changes, clear the QR container innerHTML and regenerate. This handles the tunnel starting after the page loads.
- Close on: press Q again, press Escape, or click the backdrop.

**3. Hint bar:** At the very bottom of the screen, a small pill-shaped `<div>` with `position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); opacity: 0.4; font-size: 12px;` saying "Click any bubble to spotlight · Press Q for QR code · Press S to simulate"

**Keyboard shortcuts:** Q = toggle QR, Escape = close QR or spotlight, F = toggle fullscreen, R = send `{ "type": "reset" }` to WebSocket.

---

## What to Say (after it generates)

> "Now before I open this up to all of you, let me show you what it looks like with lots of activity."
