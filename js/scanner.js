/* ==========================================================================
   Scanner — camera lifecycle and the decode pipeline.

   Live frames:  BarcodeDetector (where it exists)  ->  jsQR  ->  ZXing
   Still images: BarcodeDetector  ->  jsQR  ->  ZXing with TRY_HARDER

   jsQR carries iOS Safari, where BarcodeDetector does not exist. ZXing is
   loaded only when it is needed, so first paint never pays for it.
   ========================================================================== */
(function (global) {
  'use strict';

  var video = null;
  var canvas = null;
  var ctx = null;

  var stream = null;
  var track = null;
  var running = false;
  var paused = false;
  var rafId = 0;
  var busy = false;
  var opts = {};

  var frameInterval = 80;   /* ms between decodes */
  var lastTick = 0;
  var targetSize = 640;
  var slowFrames = 0;

  var missStreak = 0;
  var frameIndex = 0;
  var lastHitText = '';
  var lastHitAt = 0;

  var facing = 'environment';
  var torchOn = false;

  var detector = null;
  var detectorTried = false;

  var zxingLoading = null;
  var zxingReady = false;
  var zxingBroken = false;

  /* ---------- native BarcodeDetector ---------- */
  function initDetector() {
    if (detectorTried) return Promise.resolve(detector);
    detectorTried = true;

    if (!('BarcodeDetector' in global)) return Promise.resolve(null);

    var wanted = ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'itf', 'codabar'];

    if (typeof global.BarcodeDetector.getSupportedFormats !== 'function') {
      try { detector = new global.BarcodeDetector(); } catch (e) { detector = null; }
      return Promise.resolve(detector);
    }

    return global.BarcodeDetector.getSupportedFormats()
      .then(function (list) {
        var formats = wanted.filter(function (f) { return list.indexOf(f) !== -1; });
        if (!formats.length) return null;
        try {
          detector = new global.BarcodeDetector({ formats: formats });
        } catch (e) {
          detector = null;
        }
        return detector;
      })
      .catch(function () { return null; });
  }

  /* ---------- ZXing, loaded on demand ---------- */
  function loadZXing() {
    if (zxingReady) return Promise.resolve(global.ZXing);
    if (zxingBroken) return Promise.reject(new Error('zxing-unavailable'));
    if (zxingLoading) return zxingLoading;

    zxingLoading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'zxing.min.js';
      s.async = true;
      s.onload = function () {
        if (global.ZXing) {
          zxingReady = true;
          resolve(global.ZXing);
        } else {
          zxingBroken = true;
          reject(new Error('zxing-missing'));
        }
      };
      s.onerror = function () {
        zxingBroken = true;
        reject(new Error('zxing-load-failed'));
      };
      document.head.appendChild(s);
    });

    return zxingLoading;
  }

  var FORMAT_NAMES = {
    0: 'aztec', 1: 'codabar', 2: 'code_39', 3: 'code_93', 4: 'code_128',
    5: 'data_matrix', 6: 'ean_8', 7: 'ean_13', 8: 'itf', 9: 'maxicode',
    10: 'pdf417', 11: 'qr_code', 12: 'rss_14', 13: 'rss_expanded',
    14: 'upc_a', 15: 'upc_e', 16: 'upc_ean_extension'
  };

  function zxingPass(c, mode, tryHarder) {
    if (!zxingReady || !global.ZXing) return Promise.resolve(null);
    var Z = global.ZXing;

    try {
      var source = new Z.HTMLCanvasElementLuminanceSource(c);
      var binarizer;
      var formats;

      if (mode === 'oned') {
        /* Narrow bars survive the global histogram far better than the
           block-based hybrid threshold. */
        binarizer = new Z.GlobalHistogramBinarizer(source);
        formats = [
          Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8,
          Z.BarcodeFormat.CODE_128, Z.BarcodeFormat.CODE_39,
          Z.BarcodeFormat.CODE_93, Z.BarcodeFormat.UPC_A,
          Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.ITF,
          Z.BarcodeFormat.CODABAR
        ];
      } else {
        binarizer = new Z.HybridBinarizer(source);
        formats = [Z.BarcodeFormat.QR_CODE];
      }

      var reader = new Z.MultiFormatReader();
      var hints = new Map();
      if (tryHarder) hints.set(Z.DecodeHintType.TRY_HARDER, true);
      hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, formats);

      var result = reader.decode(new Z.BinaryBitmap(binarizer), hints);
      if (!result) return Promise.resolve(null);

      var raw = result.getBarcodeFormat();
      return Promise.resolve({
        text: result.getText(),
        format: FORMAT_NAMES[raw] || 'qr_code'
      });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  /* ---------- decode one canvas ---------- */
  function decodeCanvasElement(c, cx, o) {
    o = o || {};
    if (!c.width || !c.height) return Promise.resolve(null);

    var native = function () {
      if (!detector) return Promise.resolve(null);
      return detector.detect(c)
        .then(function (codes) {
          if (codes && codes.length && codes[0].rawValue) {
            return { text: codes[0].rawValue, format: String(codes[0].format || 'qr_code') };
          }
          return null;
        })
        .catch(function () {
          detector = null; /* stop trying if the implementation misbehaves */
          return null;
        });
    };

    var jsqr = function () {
      if (!global.jsQR) return Promise.resolve(null);
      var img;
      try {
        img = cx.getImageData(0, 0, c.width, c.height);
      } catch (e) {
        return Promise.resolve(null);
      }
      var invert = o.live ? (frameIndex % 6 === 0) : true;
      var res = global.jsQR(img.data, c.width, c.height, {
        inversionAttempts: invert ? 'attemptBoth' : 'dontInvert'
      });
      return Promise.resolve(res && res.data ? { text: res.data, format: 'qr_code' } : null);
    };

    return native().then(function (hit) {
      return hit || jsqr();
    }).then(function (hit) {
      if (hit) {
        missStreak = 0;
        return hit;
      }

      /* Stills always get the full attempt; the live loop escalates only after
         a run of misses, and then only on alternate frames. */
      if (!o.live) {
        return loadZXing()
          .then(function () { return zxingPass(c, 'qr', true); })
          .then(function (hit) {
            return hit || zxingPass(c, 'oned', true);
          })
          .catch(function () { return null; });
      }

      missStreak++;
      if (missStreak < 6 || missStreak % 2 !== 0) return null;

      var mode = missStreak % 4 === 0 ? 'oned' : 'qr';
      return loadZXing()
        .then(function () { return zxingPass(c, mode, false); })
        .catch(function () { return null; });
    });
  }

  /* ---------- camera ---------- */
  function getStream() {
    var md = global.navigator && global.navigator.mediaDevices;

    if (md && md.getUserMedia) {
      return md.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }).catch(function () {
        return md.getUserMedia({ audio: false, video: { facingMode: facing } });
      }).catch(function () {
        return md.getUserMedia({ audio: false, video: true });
      });
    }

    var legacy = global.navigator &&
      (global.navigator.getUserMedia || global.navigator.webkitGetUserMedia || global.navigator.mozGetUserMedia);

    if (!legacy) return Promise.reject({ name: 'NotSupportedError' });

    return new Promise(function (resolve, reject) {
      legacy.call(global.navigator, { audio: false, video: { facingMode: facing } }, resolve, reject);
    });
  }

  function attach(s) {
    if ('srcObject' in video) {
      video.srcObject = s;
    } else {
      var U = global.URL || global.webkitURL;
      video.src = U.createObjectURL(s);
    }
    video.setAttribute('playsinline', '');
    video.muted = true;
    var played = video.play();
    if (played && played.catch) played.catch(function () {});
  }

  function waitForVideo() {
    if (video.videoWidth) return Promise.resolve();
    return new Promise(function (resolve) {
      var done = function () {
        video.removeEventListener('loadedmetadata', done);
        resolve();
      };
      video.addEventListener('loadedmetadata', done);
      global.setTimeout(done, 2500);
    });
  }

  function releaseStream() {
    if (stream) {
      try {
        stream.getTracks().forEach(function (t) { t.stop(); });
      } catch (e) {}
    }
    stream = null;
    track = null;
    torchOn = false;
    try {
      if (video) {
        if ('srcObject' in video) video.srcObject = null;
        else video.removeAttribute('src');
      }
    } catch (e) {}
  }

  /* ---------- frame loop ---------- */
  function grab() {
    var vw = video.videoWidth;
    var vh = video.videoHeight;
    if (!vw || !vh) return false;

    var scale = Math.min(1, targetSize / Math.max(vw, vh));
    var w = Math.max(1, Math.round(vw * scale));
    var h = Math.max(1, Math.round(vh * scale));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.drawImage(video, 0, 0, w, h);
    return true;
  }

  function noteDuration(ms) {
    if (ms > 70) slowFrames++;
    else if (slowFrames > 0) slowFrames--;

    if (slowFrames >= 8) {
      slowFrames = 0;
      if (targetSize > 480) {
        targetSize = 480;
      } else if (targetSize > 360) {
        targetSize = 360;
        frameInterval = 110;
      }
    }
  }

  function tick() {
    if (!running || paused) {
      rafId = 0;
      return;
    }
    rafId = global.requestAnimationFrame(tick);

    if (busy) return;
    var now = global.performance ? performance.now() : Date.now();
    if (now - lastTick < frameInterval) return;
    lastTick = now;

    if (!grab()) return;
    frameIndex++;

    busy = true;
    var started = global.performance ? performance.now() : Date.now();

    decodeCanvasElement(canvas, ctx, { live: true })
      .then(function (hit) {
        noteDuration((global.performance ? performance.now() : Date.now()) - started);
        busy = false;
        if (hit && running) emit(hit);
      })
      .catch(function () {
        busy = false;
      });
  }

  function emit(hit) {
    var now = Date.now();
    if (hit.text === lastHitText && now - lastHitAt < 1400) return;
    lastHitText = hit.text;
    lastHitAt = now;
    if (typeof opts.onResult === 'function') opts.onResult(hit);
  }

  /* ---------- public ---------- */
  var Scanner = {};

  Scanner.start = function (videoEl, options) {
    opts = options || {};
    video = videoEl;

    /* A previous slow session lowers these; a new one deserves a fresh try. */
    targetSize = 640;
    frameInterval = 80;
    slowFrames = 0;

    if (!canvas) {
      canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d', { willReadFrequently: true });
    }

    if (running) return Promise.resolve(true);

    /* getUserMedia is called synchronously here so iOS still counts it as a
       user gesture. Detector setup races alongside it. */
    var streamPromise = getStream();
    initDetector();

    return streamPromise.then(function (s) {
      stream = s;
      track = s.getVideoTracks ? s.getVideoTracks()[0] : null;
      attach(s);
      return waitForVideo();
    }).then(function () {
      running = true;
      paused = false;
      missStreak = 0;
      lastTick = 0;
      busy = false;
      tick();
      return true;
    }).catch(function (err) {
      releaseStream();
      running = false;
      throw describeError(err);
    });
  };

  Scanner.stop = function () {
    running = false;
    paused = false;
    if (rafId) {
      global.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    releaseStream();
    busy = false;
    lastHitText = '';
    missStreak = 0;
  };

  /* Pausing keeps the stream alive but stops decoding, so an open result
     panel does not re-trigger on the code still sitting in front of the lens. */
  Scanner.pause = function () {
    paused = true;
  };

  Scanner.resume = function () {
    if (!running || !paused) return;
    paused = false;
    if (!rafId) tick();
  };

  Scanner.active = function () {
    return running;
  };

  Scanner.toggleFacing = function () {
    facing = facing === 'environment' ? 'user' : 'environment';
    var el = video;
    Scanner.stop();
    return Scanner.start(el, opts);
  };

  Scanner.capabilities = function () {
    var caps = {};
    try {
      if (track && track.getCapabilities) caps = track.getCapabilities() || {};
    } catch (e) {}
    return {
      torch: !!caps.torch,
      zoom: caps.zoom || null,
      facing: facing,
      hasTrack: !!track
    };
  };

  Scanner.setTorch = function (on) {
    if (!track) return Promise.resolve(false);
    try {
      return track.applyConstraints({ advanced: [{ torch: !!on }] })
        .then(function () { torchOn = !!on; return true; })
        .catch(function () { return false; });
    } catch (e) {
      return Promise.resolve(false);
    }
  };

  Scanner.torchOn = function () {
    return torchOn;
  };

  /* ---------- still images ---------- */
  function toImage(source) {
    if (!source) return Promise.reject(new Error('no-source'));

    if (typeof source === 'string') {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error('image-failed')); };
        img.src = source;
      });
    }

    if (source instanceof global.HTMLImageElement) return Promise.resolve(source);

    function fromObjectUrl(blob) {
      var U = global.URL || global.webkitURL;
      var url = U.createObjectURL(blob);
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () { U.revokeObjectURL(url); resolve(img); };
        img.onerror = function () { U.revokeObjectURL(url); reject(new Error('image-failed')); };
        img.src = url;
      });
    }

    /* createImageBitmap decodes off the main thread and honours EXIF
       orientation, so a landscape phone photo is not sideways. Browsers that
       reject the options bag fall back to an <img>, which also applies
       orientation on modern Safari and Chrome. */
    if (global.createImageBitmap) {
      try {
        return global.createImageBitmap(source, { imageOrientation: 'from-image' })
          .catch(function () { return global.createImageBitmap(source); })
          .catch(function () { return fromObjectUrl(source); });
      } catch (e) {
        /* Some browsers throw on the options bag instead of rejecting. */
      }
    }

    return fromObjectUrl(source);
  }

  function decodeStill(c, cx) {
    return decodeCanvasElement(c, cx, { live: false }).then(function (hit) {
      if (hit) return hit;

      /* Small screenshots often scan better upscaled. */
      if (Math.max(c.width, c.height) < 900) {
        var up = document.createElement('canvas');
        up.width = c.width * 2;
        up.height = c.height * 2;
        var ux = up.getContext('2d', { willReadFrequently: true });
        ux.imageSmoothingEnabled = true;
        ux.drawImage(c, 0, 0, up.width, up.height);
        return decodeCanvasElement(up, ux, { live: false });
      }
      return null;
    });
  }

  Scanner.decodeImage = function (source) {
    return toImage(source).then(function (img) {
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      if (!w || !h) throw new Error('empty-image');

      var max = 1600;
      var scale = Math.min(1, max / Math.max(w, h));
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * scale));
      c.height = Math.max(1, Math.round(h * scale));

      var cx = c.getContext('2d', { willReadFrequently: true });
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(img, 0, 0, c.width, c.height);

      if (typeof img.close === 'function') {
        try { img.close(); } catch (e) {}
      }

      return decodeStill(c, cx);
    });
  };

  /* Decode something already drawn on a canvas (used by the drop target). */
  Scanner.decodeCanvas = function (c) {
    var cx = c.getContext('2d', { willReadFrequently: true });
    return decodeStill(c, cx);
  };

  function describeError(err) {
    var name = (err && err.name) || '';
    var fileHint = (global.location && global.location.protocol === 'file:')
      ? ' A page opened straight from disk cannot use the camera — serve the folder over http, or upload a photo instead.'
      : '';

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
      return {
        code: 'denied',
        message: 'Camera access was blocked. Allow the camera for this page in your browser settings, then try again.' + fileHint
      };
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return {
        code: 'missing',
        message: 'No camera was found on this device. You can still upload a photo of a code.'
      };
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return {
        code: 'busy',
        message: 'Another app is using the camera. Close it and try again.'
      };
    }
    if (name === 'NotSupportedError') {
      return {
        code: 'unsupported',
        message: 'This browser cannot open the camera. Upload a photo of the code instead.' + fileHint
      };
    }
    return {
      code: 'unknown',
      message: 'The camera could not start. You can still upload a photo of a code.' + fileHint
    };
  }

  global.Scanner = Scanner;
})(window);
