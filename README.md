# QR / Offline

**Scan and make QR codes entirely in your browser. No server. No API calls. No tracking. Close your Wi-Fi — it still works.**

🔗 **[qrcodeit.netlify.app](https://qrcodeit.netlify.app)**

---

## What it does

Two things, and both happen on your device.

**Scan.** Point your camera at a code, or drop in a screenshot. The frame is decoded by code running in the page — nothing is uploaded, nothing is recorded. It reads QR codes plus the common 1D formats (EAN, UPC, Code 128, Code 39, ITF), and it does not give up on the first miss: a fast pass handles the easy frames, and a heavier decoder is loaded only when a code is stubborn, rotated, damaged, or badly lit.

**Create.** Type something and a QR code appears. No "generate" button, no spinner while a server thinks about it. The encoding, the error-correction maths, and the rendering all run locally the moment you type.

Seven content types:

- **Text & Links** — paste any link or plain text
- **Wi-Fi** — WPA/WPA2, WEP, or open networks; hidden networks too
- **Contact** — a proper vCard 3.0 that phones can save directly
- **Email** — pre-fills To, Subject, and Body when scanned
- **Phone** — opens the dialer
- **Message** — opens an SMS draft
- **Location** — a geo pin that opens in maps

Whatever you scan or create lands in **Recent**, on this device only, so you can get back to it later.

---

## Features

**Offline-first by design**
One folder, not one file. No CDN, no external fonts, no analytics, no build step. Every library it needs - the encoder, both decoders - is checked in next to `index.html`. A service worker keeps a copy of the whole app, so it opens with the Wi-Fi off - even after a reload, even after a restart. Once the page has loaded it never touches the network on its own, and the only outbound traffic is a link you press yourself.

**Scanning that works on real phones**
The camera preview is a live `<video>` with `playsinline`, so iPhone Safari does not hijack it into fullscreen. Decoding runs through whatever the device does best: the native `BarcodeDetector` where it exists, [jsQR](https://github.com/cozmo/jsQR) everywhere else (that is the iPhone path), and [ZXing](https://github.com/zxing-js/library) as the escalation for 1D codes and difficult frames. The live loop measures how long each decode takes and backs off the resolution on slow hardware rather than dropping frames forever.

**Upload, paste, or drop**
No camera permission? Use a photo you already have. You can also paste a screenshot straight from the clipboard, or drag an image onto the scanner. Small screenshots are upscaled before decoding, because a 200px screenshot of a code is mostly noise at native size.

**Actions that match the code**
A scanned link offers *Open link* and *Copy link*. A bare domain like `example.com/path` is recognised too, and any other text offers *Copy text* plus *Search the web* — the engine (DuckDuckGo, Google or Bing) is chosen in Settings. A Wi-Fi code offers *Copy password*. A contact offers *Save contact* and *Call*. The app reads the payload, so you are not left copying a wall of `WIFI:T:...` text by hand.

**Edit what you scanned**
Every result also offers *Edit in Create*: the scanned payload is parsed back into the matching form, so a Wi-Fi code arrives with its network name, password and hidden flag filled in, a contact with its fields, and a link in the text box. Change one character, switch the colours, and download your own version. A live scan keeps the Wi-Fi password in memory for this; a history entry does not have it, because passwords are never written to disk.

**Verify before you print**
*Verify code* decodes the preview you are looking at with the same pipeline the scanner uses, and tells you whether it reads back exactly what you typed. It catches the failures that are invisible on screen: a colour pair that is too pale, a logo that ate the timing pattern, a code that got too dense. Any change to the content or the design clears the verdict, so it can never vouch for something you have since edited.

**Links leave the app**
Every action that goes somewhere else is a real link, not a scripted popup. Your phone hands it to the real browser — Chrome on Android, Safari on iPhone — and long-pressing offers *Open in new tab* and *Copy link*. The manifest deliberately declares `display: minimal-ui` rather than `standalone`, and there is no `apple-mobile-web-app-capable` tag: a fullscreen container is exactly what traps links inside the app.

**Custom colours**
Any foreground and background. There is a live contrast warning if your pair is likely to fail on a scanner, and a separate warning if you inverted them — a light code on a dark background often will not scan even with technically good contrast.

**Center logo**
Use the file picker. Error correction jumps to Level H automatically and the logo is cropped square so the code still reads. Up to 8MB.

**Four error-correction levels**
- **Screen (L)** — smallest code, fine when it only ever appears on a display
- **Standard (M)** — good default for normal printing
- **Sticker (Q)** — for things that get handled
- **Rough use (H)** — recovers from ~30% damage; required with a logo

**Three output sizes**
256px for chat and screens, 512px for most printing, 1024px for posters.

**Download as PNG or SVG**
PNG for sharing anywhere. SVG for scaling without quality loss in a design tool.

**Copy & Share**
Copy the image to your clipboard (HTTPS or localhost), or hand it to the OS share sheet on mobile. A scan result can be shared as text too, so a link or contact card goes straight into a message.

**Print-ready**
`Ctrl+P` / `Cmd+P` hides every control and prints just the code.

**Light, dark, or system**
Follows your system preference by default. The QR preview is always pure white, in both themes, because that is what scans.

---

## Privacy

The model is simple: **nothing leaves your device unless you ask it to.**

- No background network requests after the page loads
- The camera stream is drawn into a canvas in this tab and decoded there — it is never recorded, uploaded, or stored
- Uploaded photos are decoded in the page and discarded
- History lives in `localStorage` and is never sent anywhere
- Wi-Fi passwords are never written to history — only the network name and security type are kept
- No cookies, no analytics, no third-party scripts
- *Search the web* and *Open link* are the only ways out, and each is a plain link you press yourself: the scanned text goes to the search engine you picked, or the link goes to your browser. Nothing else is transmitted.

---

## Tech

No build step, no `node_modules`, no bundler. Plain HTML, CSS, and ES5-flavoured JavaScript that runs as-is.

```
index.html           app shell, three views, result panel, settings
style.css            the whole design system (light + dark)
sw.js                service worker: offline shell, versioned cache
manifest.webmanifest install metadata, display: minimal-ui
icons/               home-screen and maskable icons
js/qr.js             encoder + payload building/parsing + SVG export
js/scanner.js        camera lifecycle and the decode pipeline
js/store.js          settings and history in localStorage
js/app.js            views, create flow, scan flow, history
jsqr.js              vendored jsQR (Apache-2.0)
zxing.min.js         vendored ZXing UMD (Apache-2.0), loaded on demand
tests/qr.test.js     Node tests for payload building and parsing
```

- QR encoding: [qrcode.js](https://github.com/davidshimjs/qrcodejs) by Kazuhiko Arase (MIT), vendored
- Live decoding: native `BarcodeDetector` → jsQR → ZXing
- Still-image decoding: same ladder, with ZXing's `TRY_HARDER` and a global-histogram pass for 1D codes
- Rendering: Canvas for the preview, hand-built SVG for downloads
- Storage: `localStorage` only

ZXing is injected lazily the first time it is needed, so a normal QR scan never pays for the 350KB download.

### Updating a deploy

`sw.js` caches the whole app under `qr-offline-<version>`. **Bump `CACHE_VERSION` in `sw.js` whenever you change any file listed in `PRECACHE`** — otherwise returning visitors keep the old copy.

A new worker installs quietly and waits. The open page shows *A new version is ready — Reload* instead of swapping code under a running scan; the old cache is deleted on activate, so storage never holds two copies. The worker is only registered over `http(s)`, never `file://`, which is why opening the folder from disk still works exactly as before.

---

## Run it locally

```bash
git clone https://github.com/rudra-th/qr-generator.git
cd qr-generator
# That's it. Open index.html in any browser.
open index.html
```

No install step. No `npm install`.

One caveat, and it is the browser's rule rather than the app's: **cameras are blocked on `file://`.** Opening `index.html` straight from disk gives you a fully working generator, upload/paste scanning, and history — but not the live camera. For that, serve the folder over `http://localhost`:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

The app tells you this in place when it detects `file://`, instead of failing silently.

---

## Tests

The encoder and the payload parser are pure functions, so they are tested in Node with no dependencies and no install step:

```bash
node --test
```

Seventeen tests cover every payload type building and parsing back, the escaping that keeps a `;` inside a Wi-Fi password or a `,` inside a contact name from breaking the payload, domain detection, and the colour maths behind the contrast warning.

---

## Why I built this

Every QR generator I found either required an account, called a third-party API with your content, or was buried under ads. For a Wi-Fi QR code — which contains your actual network password — that felt wrong. And almost none of them could read a code back. So I built one that does both and doesn't phone home at all.

---

## License

MIT — do whatever you want with it.

The vendored QR engine is MIT © Kazuhiko Arase. jsQR and ZXing are Apache-2.0; their license headers are preserved in the vendored files.
