
# QR / Offline

**A QR code generator that runs entirely in your browser. No server. No API calls. No tracking. Close your Wi-Fi — it still works.**

🔗 **[qrcodeit.netlify.app](https://qrcodeit.netlify.app)**
<img width="900" alt="QR Offline preview" src="https://github.com/user-attachments/assets/3dabaeb8-b9f4-4e0e-aac6-cc568d806773" />

---

## What it does

You type something. A QR code appears instantly. That's it.

No sign-up, no "generate" button to click, no spinner while a server does the work. Everything — the encoding, the error correction math, the canvas rendering — happens locally in your browser the moment you start typing.

It supports five content types out of the box:

- **Text & URLs** — paste any link or plain text
- **Wi-Fi** — WPA/WPA2, WEP, or open networks; hidden networks too
- **Contact** — generates a proper vCard 3.0 that phones can save directly
- **Email** — pre-fills To, Subject, and Body when scanned
- **Phone** — opens the dialer on any phone

---

## Features

**Offline-first by design**
The entire app is a single HTML file. No CDN dependencies, no external fonts, no analytics scripts. You could save it to your desktop and it would work forever with no internet.

**Custom colors**
Change the foreground and background to anything. There's a live contrast warning if your combination is likely to fail on a scanner — and a separate warning if you've accidentally inverted them (light code on dark background often won't scan, even with technically good contrast).

**Center logo**
Drop an image onto the preview pane or use the file picker. The app automatically bumps error correction to Level H and crops your logo to a square so it sits cleanly in the center. Up to 8MB.

**Four error correction levels**
- **Screen only (L)** — minimal data, fastest scan
- **Standard (M)** — good default for printing
- **Sticker (Q)** — handles wear and tear
- **With logo (H)** — recovers from ~30% damage; required when you add a logo

**Three output sizes**
256px for chat/screens, 512px for most prints, 1024px for posters or banners.

**Download as PNG or SVG**
PNG for sharing anywhere. SVG for scaling to any size without quality loss — useful if you're dropping the QR code into a design tool.

**Copy & Share**
Copy the QR directly to your clipboard (works on HTTPS). On mobile, the Share button hands it off to your OS share sheet so you can send it over WhatsApp, Messages, or save it to Photos.

**History**
The last 10 codes you generated are saved locally. Click any chip to restore the form. Wi-Fi passwords are intentionally never saved to history.

**Dark mode**
Follows your system preference on first load. Toggle any time. Preference is remembered.

**Print-ready**
`Ctrl+P` / `Cmd+P` hides every control and prints just the QR code.

---

## Privacy

The privacy model is simple: **nothing ever leaves your device.**

- No network requests after the page loads
- History lives in your browser's `localStorage`, never sent anywhere
- Wi-Fi passwords are explicitly excluded from history storage
- No cookies, no analytics, no third-party scripts

---

## Tech

Single HTML file (~1600 lines). No build step, no dependencies, no `node_modules`.

- QR encoding: [qrcode.js](https://github.com/davidshimjs/qrcodejs) by Kazuhiko Arase (MIT) — vendored inline so there's no CDN call
- Rendering: HTML5 Canvas for the preview, hand-built SVG for downloads
- Storage: `localStorage` only, for theme preference and history

---

## Run it locally

```bash
git clone https://github.com/rudra-th/qr-generator.git
cd qr-generator
# That's it. Open index.html in any browser.
open index.html
```

No install step. No `npm install`. Just open the file.

---

## Why I built this

Every QR generator I found either required an account, called a third-party API with your content, or was buried under ads. For a Wi-Fi QR code — which contains your actual network password — that felt wrong. So I built one that doesn't phone home at all.

---

## License

MIT — do whatever you want with it.
The vendored QR engine is also MIT © Kazuhiko Arase.
