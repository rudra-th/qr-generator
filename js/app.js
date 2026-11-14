/* ==========================================================================
   QR / Offline — views, create flow, scan flow, history.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var el = {
    themeColor: $('themeColor'),
    announce: $('announce'),
    toast: $('toast'),

    /* scan */
    viewport: $('viewport'),
    video: $('video'),
    vpStatus: $('vpStatus'),
    startBtn: $('startBtn'),
    startLabel: $('startLabel'),
    scanActions: $('scanActions'),
    scanFile: $('scanFile'),
    pasteBtn: $('pasteBtn'),
    liveActions: $('liveActions'),
    torchBtn: $('torchBtn'),
    flipBtn: $('flipBtn'),
    stopBtn: $('stopBtn'),
    scanNote: $('scanNote'),

    /* result */
    result: $('result'),
    resultLive: $('resultLive'),
    resultKind: $('resultKind'),
    resultTitle: $('resultTitle'),
    resultSub: $('resultSub'),
    resultBody: $('resultBody'),
    resultActions: $('resultActions'),
    resultCopy: $('resultCopy'),
    resultAgain: $('resultAgain'),
    resultClose: $('resultClose'),
    scrim: $('scrim'),

    /* create */
    canvas: $('qrCanvas'),
    plate: $('plate'),
    emptyState: $('emptyState'),
    contrastWarn: $('contrastWarn'),
    encodeError: $('encodeError'),
    actions: $('actions'),
    dlPng: $('dlPng'),
    dlSvg: $('dlSvg'),
    copyBtn: $('copyBtn'),
    shareBtn: $('shareBtn'),
    actionStatus: $('actionStatus'),
    typeChips: $('typeChips'),
    formArea: $('formArea'),
    adv: $('adv'),
    eccRow: $('eccRow'),
    eccHint: $('eccHint'),
    sizeRow: $('sizeRow'),
    sizeHint: $('sizeHint'),
    fgColor: $('fgColor'),
    bgColor: $('bgColor'),
    swapColors: $('swapColors'),
    logoInput: $('logoInput'),
    logoName: $('logoName'),
    logoClear: $('logoClear'),

    /* recent */
    recentFilter: $('recentFilter'),
    recentList: $('recentList'),

    /* settings */
    settingsBtn: $('settingsBtn'),
    settingsSheet: $('settingsSheet'),
    settingsClose: $('settingsClose'),
    themeSeg: $('themeSeg'),
    motionSeg: $('motionSeg'),
    engineSeg: $('engineSeg'),
    histCount: $('histCount'),
    clearHistBtn: $('clearHistBtn'),
    settingsScrim: $('settingsScrim')
  };

  /* ---------- icons ---------- */
  var ICONS = {
    link: '<path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7L11.5 6.3"/><path d="M14 10.5a4 4 0 0 0-5.7 0L5.5 13.3a4 4 0 0 0 5.7 5.7l1.3-1.3"/>',
    wifi: '<path d="M3 9a14 14 0 0 1 18 0"/><path d="M6.5 12.5a9 9 0 0 1 11 0"/><path d="M10 16a4.5 4.5 0 0 1 4 0"/><circle cx="12" cy="19.4" r="1"/>',
    contact: '<circle cx="12" cy="8.5" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="M4 8l7.1 4.7a2 2 0 0 0 1.8 0L20 8"/>',
    phone: '<path d="M7 3.5h2.2l1.6 4-2 1.4a11 11 0 0 0 5.3 5.3l1.4-2 4 1.6V16a2.5 2.5 0 0 1-2.7 2.5A14.5 14.5 0 0 1 4.5 6.2 2.5 2.5 0 0 1 7 3.5z"/>',
    sms: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.5V16h-.5A2.5 2.5 0 0 1 4 13.5z"/>',
    geo: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    text: '<path d="M5 7h14M5 12h10M5 17h6"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 17l4.5-4.5a2 2 0 0 1 2.8 0L20 20"/>',
    warn: '<path d="M12 4.5 21 20H3z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.4" r=".9" fill="currentColor" stroke="none"/>',
    download: '<path d="M12 4v10"/><path d="M8 10.5l4 4 4-4"/><path d="M5 19.5h14"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 5.5h-9a2 2 0 0 0-2 2v9"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 14v4.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2H10"/>',
    scan: '<path d="M4 9V6a2 2 0 0 1 2-2h3"/><path d="M15 4h3a2 2 0 0 1 2 2v3"/><path d="M20 15v3a2 2 0 0 1-2 2h-3"/><path d="M9 20H6a2 2 0 0 1-2-2v-3"/>',
    save: '<path d="M12 4v9"/><path d="M8.5 9.5 12 13l3.5-3.5"/><path d="M4.5 16v2.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V16"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };

  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  var KIND_ICON = {
    url: 'link', wifi: 'wifi', contact: 'contact', email: 'mail',
    phone: 'phone', sms: 'sms', geo: 'geo', text: 'text'
  };
  var KIND_NAME = {
    url: 'Link', wifi: 'Wi-Fi', contact: 'Contact', email: 'Email',
    phone: 'Phone', sms: 'Message', geo: 'Location', text: 'Text'
  };

  /* ---------- toast / announce ---------- */
  var toastTimer = null;

  function hideToast() {
    el.toast.setAttribute('data-show', 'false');
  }

  function toast(message, isError, action) {
    el.toast.innerHTML = '';

    var text = document.createElement('span');
    text.textContent = message;
    el.toast.appendChild(text);

    if (action) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'toast-action';
      button.textContent = action.label;
      button.addEventListener('click', function () {
        hideToast();
        action.run();
      });
      el.toast.appendChild(button);
    }

    el.toast.classList.toggle('is-error', !!isError);
    el.toast.setAttribute('data-show', 'true');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, action ? 6000 : 3200);
  }

  function announce(message) {
    el.announce.textContent = '';
    setTimeout(function () { el.announce.textContent = message; }, 30);
  }

  /* ---------- theme + motion ---------- */
  function applySettings() {
    var s = Store.get();
    var resolved = Store.resolvedTheme();

    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-motion', s.motion === 'reduced' ? 'reduced' : 'system');
    if (el.themeColor) el.themeColor.setAttribute('content', resolved === 'dark' ? '#121110' : '#f6f3ec');

    Array.prototype.forEach.call(el.themeSeg.querySelectorAll('button'), function (b) {
      b.setAttribute('aria-checked', b.getAttribute('data-theme') === s.theme ? 'true' : 'false');
    });
    Array.prototype.forEach.call(el.motionSeg.querySelectorAll('button'), function (b) {
      b.setAttribute('aria-checked', b.getAttribute('data-motion') === s.motion ? 'true' : 'false');
    });
    if (el.engineSeg) {
      Array.prototype.forEach.call(el.engineSeg.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-checked', b.getAttribute('data-engine') === s.engine ? 'true' : 'false');
      });
    }
  }

  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  if (darkQuery && darkQuery.addEventListener) {
    darkQuery.addEventListener('change', function () {
      if (Store.get().theme === 'system') applySettings();
    });
  }

  /* ---------- routing ---------- */
  var VIEWS = { scan: 'view-scan', create: 'view-create', recent: 'view-recent' };
  var currentView = 'scan';

  function go(view, focus) {
    if (!VIEWS[view]) view = 'scan';
    if (view === currentView && focus !== true) {
      if (view === 'recent') renderRecent();
      return;
    }
    currentView = view;

    Object.keys(VIEWS).forEach(function (key) {
      var panel = $(VIEWS[key]);
      var on = key === view;
      panel.hidden = !on;

      var tab = $('tab-' + key);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
    });

    if (view !== 'scan') stopCamera();

    if (view === 'create') renderCreate();
    if (view === 'recent') renderRecent();

    if (focus) $(VIEWS[view]).focus();
    window.scrollTo(0, 0);
  }

  function setupTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        go(tab.getAttribute('data-view'));
      });
      tab.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(tab);
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (!next) return;
        e.preventDefault();
        next.focus();
        go(next.getAttribute('data-view'));
      });
    });

    document.querySelectorAll('[data-view]').forEach(function (node) {
      if (node.classList.contains('tab')) return;
      node.addEventListener('click', function (e) {
        if (node.tagName === 'A') e.preventDefault();
        go(node.getAttribute('data-view'));
      });
    });
  }

  /* ======================================================================
     SCAN
     ====================================================================== */
  var scanState = 'idle'; /* idle | starting | live | error */
  var currentResult = null;

  function setViewport(state, status) {
    el.viewport.setAttribute('data-state', state);
    el.vpStatus.textContent = status || '';
  }

  function startCamera() {
    if (scanState === 'starting' || scanState === 'live') return;

    scanState = 'starting';
    el.startBtn.disabled = true;
    el.startLabel.textContent = 'Starting camera\u2026';
    setViewport('idle', 'Starting camera\u2026');

    Scanner.start(el.video, { onResult: onScanHit })
      .then(function () {
        scanState = 'live';
        setViewport('live', 'Looking for a code\u2026');
        el.scanActions.hidden = true;
        el.liveActions.hidden = false;
        el.startBtn.disabled = false;
        el.startLabel.textContent = 'Start camera';

        var caps = Scanner.capabilities();
        el.torchBtn.hidden = !caps.torch;
        el.flipBtn.hidden = !caps.hasTrack;
        el.scanNote.textContent = 'Camera is on. Nothing is recorded, uploaded, or stored unless you keep it in Recent.';
      })
      .catch(function (err) {
        scanState = 'error';
        setViewport('idle', '');
        el.startBtn.disabled = false;
        el.startLabel.textContent = 'Try camera again';
        el.scanNote.textContent = err && err.message
          ? err.message
          : 'The camera could not start. You can still upload a photo of a code.';
      });
  }

  function stopCamera() {
    Scanner.stop();
    scanState = 'idle';
    el.scanActions.hidden = false;
    el.liveActions.hidden = true;
    el.torchBtn.hidden = true;
    el.flipBtn.hidden = true;
    el.torchBtn.setAttribute('aria-pressed', 'false');
    el.startBtn.disabled = false;
    el.startLabel.textContent = 'Start camera';
    setViewport('idle', '');
    el.scanNote.textContent = 'The camera feed never leaves this device. Photos you upload are decoded in the page and never sent anywhere.';
  }

  function onScanHit(hit) {
    if (!hit || !hit.text) return;
    setViewport('found', 'Found it');
    if (navigator.vibrate) {
      try { navigator.vibrate(45); } catch (e) {}
    }
    showResult(hit.text);
    setTimeout(function () {
      if (scanState === 'live' && !currentResult) {
        setViewport('live', 'Looking for a code\u2026');
      }
    }, 900);
  }

  /* ---------- result panel ---------- */
  var ENGINES = {
    ddg: 'https://duckduckgo.com/?q=',
    google: 'https://www.google.com/search?q=',
    bing: 'https://www.bing.com/search?q='
  };

  function searchUrl(text) {
    var base = ENGINES[Store.get().engine] || ENGINES.ddg;
    return base + encodeURIComponent(String(text).slice(0, 1500));
  }

  /* Actions are either a link (an anchor, so the OS hands it to the real
     browser and long-press offers "open in new tab") or something the app
     does itself (copy, save). */
  function buildActions(parsed) {
    var actions = [];
    var f = parsed.fields || {};

    if (parsed.kind === 'url' && parsed.href) {
      actions.push({ label: 'Open link', icon: 'external', primary: true, href: parsed.href, external: true });
      actions.push({ label: 'Copy link', icon: 'copy', run: function () { copyText(parsed.href, 'Link copied.'); } });
    } else if (parsed.kind === 'wifi') {
      if (f.pass) {
        actions.push({
          label: 'Copy password', icon: 'copy', primary: true,
          run: function () { copyText(f.pass, 'Password copied.'); }
        });
      } else {
        actions.push({
          label: 'Copy network name', icon: 'copy', primary: true,
          run: function () { copyText(f.ssid || '', 'Network name copied.'); }
        });
      }
    } else if (parsed.kind === 'contact') {
      actions.push({
        label: 'Save contact', icon: 'save', primary: true,
        run: function () { saveContact(parsed); }
      });
      if (f.phone) {
        actions.push({ label: 'Call ' + f.phone, icon: 'phone', href: 'tel:' + f.phone });
      }
    } else if (parsed.kind === 'email' && parsed.href) {
      actions.push({ label: 'Send email', icon: 'mail', primary: true, href: parsed.href });
    } else if (parsed.kind === 'phone' && parsed.href) {
      actions.push({ label: 'Call', icon: 'phone', primary: true, href: parsed.href });
    } else if (parsed.kind === 'sms' && parsed.href) {
      actions.push({ label: 'Send message', icon: 'sms', primary: true, href: parsed.href });
    } else if (parsed.kind === 'geo' && parsed.href) {
      actions.push({ label: 'Open in maps', icon: 'geo', primary: true, href: parsed.href, external: true });
    } else {
      var asLink = QR.looksLikeDomain(parsed.text);

      if (asLink) {
        actions.push({ label: 'Open as link', icon: 'external', primary: true, href: asLink, external: true });
        actions.push({ label: 'Copy text', icon: 'copy', run: function () { copyText(parsed.text, 'Copied.'); } });
      } else {
        actions.push({ label: 'Copy text', icon: 'copy', primary: true, run: function () { copyText(parsed.text, 'Copied.'); } });
      }

      actions.push({
        label: 'Search the web', icon: 'search',
        href: searchUrl(parsed.text), external: true
      });
    }

    return actions;
  }

  function renderActions(parsed) {
    el.resultActions.innerHTML = '';

    buildActions(parsed).forEach(function (action) {
      var node;

      if (action.href) {
        node = document.createElement('a');
        node.href = action.href;
        if (action.external) {
          node.target = '_blank';
          node.rel = 'noopener noreferrer';
        }
      } else {
        node = document.createElement('button');
        node.type = 'button';
        node.addEventListener('click', action.run);
      }

      node.className = action.primary ? 'btn btn-primary' : 'btn btn-quiet';
      node.innerHTML = svg(action.icon) + '<span></span>';
      node.querySelector('span').textContent = action.label;
      el.resultActions.appendChild(node);
    });
  }

  function showResult(text, save) {
    var parsed = QR.parse(text);
    currentResult = parsed;

    el.resultKind.innerHTML = svg(KIND_ICON[parsed.kind] || 'text') +
      '<span></span>';
    el.resultKind.querySelector('span').textContent = KIND_NAME[parsed.kind] || 'Code';

    el.resultTitle.textContent = parsed.title;
    el.resultSub.textContent = parsed.subtitle || '';
    el.resultSub.hidden = !parsed.subtitle;
    el.resultBody.textContent = parsed.body;

    el.resultActions.innerHTML = '';
    renderActions(parsed);
    el.resultCopy.textContent = parsed.kind === 'wifi' ? 'Copy raw code' : 'Copy text';

    openPanel();
    announce(KIND_NAME[parsed.kind] + ': ' + parsed.title);

    if (save !== false) {
      Store.history.add({
        kind: 'scan',
        type: parsed.kind,
        label: QR.label(parsed),
        text: parsed.kind === 'wifi' ? '' : parsed.text,
        fields: parsed.fields || {}
      });
    }
  }
  /* ---------- scroll lock, shared by the result sheet and settings ---------- */
  var scrollLocks = 0;

  function lockScroll(on) {
    scrollLocks += on ? 1 : -1;
    if (scrollLocks < 0) scrollLocks = 0;
    document.documentElement.classList.toggle('is-locked', scrollLocks > 0);
  }

  function sheetMode() {
    return window.matchMedia('(max-width: 859px)').matches;
  }

  var lastPanelFocus = null;
  var panelLocked = false;

  function openPanel() {
    lastPanelFocus = document.activeElement;

    el.result.setAttribute('data-open', 'true');

    /* Below 860px this is a modal sheet; above it, a panel beside the camera. */
    if (sheetMode()) {
      el.result.setAttribute('role', 'dialog');
      el.result.setAttribute('aria-modal', 'true');
      if (!panelLocked) { lockScroll(true); panelLocked = true; }
    } else {
      el.result.setAttribute('role', 'region');
      el.result.removeAttribute('aria-modal');
    }

    el.scrim.hidden = false;
    requestAnimationFrame(function () {
      el.scrim.setAttribute('data-show', 'true');
    });

    if (Scanner.active()) Scanner.pause();

    try {
      el.resultTitle.focus({ preventScroll: true });
    } catch (e) {
      el.resultTitle.focus();
    }
  }

  function closePanel() {
    el.result.setAttribute('data-open', 'false');
    el.result.removeAttribute('aria-modal');
    el.result.setAttribute('role', 'region');
    el.scrim.setAttribute('data-show', 'false');

    if (panelLocked) { lockScroll(false); panelLocked = false; }

    setTimeout(function () {
      if (el.result.getAttribute('data-open') === 'false') el.scrim.hidden = true;
    }, 220);

    currentResult = null;

    if (lastPanelFocus && document.contains(lastPanelFocus) && lastPanelFocus.focus) {
      try { lastPanelFocus.focus({ preventScroll: true }); } catch (e) {}
    }

    if (scanState === 'live') {
      Scanner.resume();
      setViewport('live', 'Looking for a code\u2026');
    }
  }

  /* Keep Tab inside the sheet while it is modal. */
  function panelFocusables() {
    var nodes = el.result.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    /* Hidden controls (the close button is hidden on desktop) cannot take
       focus, and a trap built around one would leak. */
    return Array.prototype.filter.call(nodes, function (node) {
      return node.getClientRects().length > 0;
    });
  }

  function trapPanelFocus(e) {
    if (e.key !== 'Tab' || el.result.getAttribute('aria-modal') !== 'true') return;
    if (el.result.getAttribute('data-open') !== 'true') return;

    var focusable = panelFocusables();
    if (!focusable.length) {
      e.preventDefault();
      return;
    }

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function copyText(text, okMessage) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        toast(okMessage || 'Copied.');
      }).catch(function () {
        legacyCopy(text, okMessage);
      });
    } else {
      legacyCopy(text, okMessage);
    }
  }

  function legacyCopy(text, okMessage) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    toast(ok ? (okMessage || 'Copied.') : 'Could not copy on this browser.', !ok);
  }

  function saveContact(parsed) {
    var vcf = /^BEGIN:VCARD/i.test(parsed.text)
      ? parsed.text
      : QR.build('contact', parsed.fields || {});
    if (!vcf) return;
    var name = ((parsed.fields && parsed.fields.name) || 'contact')
      .replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'contact';
    downloadBlob(new Blob([vcf], { type: 'text/vcard' }), name + '.vcf');
    toast('Contact file saved.');
  }

  /* ---------- image input ---------- */
  function handleImageFile(file) {
    if (!file) return;
    if (file.type && file.type.indexOf('image/') !== 0) {
      toast('That is not an image file.', true);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast('That image is too large (max 20MB).', true);
      return;
    }

    var restore = scanState === 'live' ? 'live' : 'idle';
    setViewport(restore, 'Reading image\u2026');

    Scanner.decodeImage(file)
      .then(function (hit) {
        if (!hit) {
          toast('No code found in that image.', true);
          setViewport(restore, restore === 'live' ? 'Looking for a code\u2026' : '');
          return;
        }
        onScanHit(hit);
      })
      .catch(function () {
        toast('That image could not be read. Try a sharper photo.', true);
        setViewport(restore, restore === 'live' ? 'Looking for a code\u2026' : '');
      });
  }

  function setupImageInput() {
    el.scanFile.addEventListener('change', function () {
      var file = el.scanFile.files && el.scanFile.files[0];
      if (file) handleImageFile(file);
      el.scanFile.value = '';
    });

    if (navigator.clipboard && navigator.clipboard.read && window.isSecureContext) {
      el.pasteBtn.hidden = false;
    }

    el.pasteBtn.addEventListener('click', function () {
      navigator.clipboard.read().then(function (items) {
        for (var i = 0; i < items.length; i++) {
          var types = items[i].types || [];
          for (var j = 0; j < types.length; j++) {
            if (types[j].indexOf('image/') === 0) {
              var item = items[i];
              var type = types[j];
              item.getType(type).then(function (blob) { handleImageFile(blob); });
              return;
            }
          }
        }
        toast('No image on the clipboard.', true);
      }).catch(function () {
        toast('Clipboard access was blocked.', true);
      });
    });

    document.addEventListener('paste', function (e) {
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image/') === 0) {
          var file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            go('scan');
            handleImageFile(file);
            return;
          }
        }
      }
    });

    /* drop an image anywhere on the scan view */
    ['dragenter', 'dragover'].forEach(function (type) {
      el.viewport.addEventListener(type, function (e) {
        e.preventDefault();
        e.stopPropagation();
        el.viewport.style.outline = '2px dashed var(--accent)';
        el.viewport.style.outlineOffset = '-6px';
      });
    });
    ['dragleave', 'dragend'].forEach(function (type) {
      el.viewport.addEventListener(type, function () {
        el.viewport.style.outline = '';
      });
    });
    el.viewport.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      el.viewport.style.outline = '';
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleImageFile(file);
    });
  }

  function setupScanControls() {
    el.startBtn.addEventListener('click', startCamera);
    el.stopBtn.addEventListener('click', stopCamera);

    el.flipBtn.addEventListener('click', function () {
      el.flipBtn.disabled = true;
      Scanner.toggleFacing().then(function () {
        el.flipBtn.disabled = false;
        var caps = Scanner.capabilities();
        el.torchBtn.hidden = !caps.torch;
      }).catch(function (err) {
        el.flipBtn.disabled = false;
        toast(err && err.message ? err.message : 'Could not switch camera.', true);
      });
    });

    el.torchBtn.addEventListener('click', function () {
      var next = el.torchBtn.getAttribute('aria-pressed') !== 'true';
      Scanner.setTorch(next).then(function (ok) {
        if (!ok) {
          toast('This camera cannot control the flashlight.', true);
          return;
        }
        el.torchBtn.setAttribute('aria-pressed', ok && next ? 'true' : 'false');
        el.torchBtn.setAttribute('aria-label', next ? 'Turn flashlight off' : 'Turn flashlight on');
      });
    });

    el.resultClose.addEventListener('click', closePanel);
    el.resultAgain.addEventListener('click', closePanel);
    el.scrim.addEventListener('click', closePanel);
    el.result.addEventListener('keydown', trapPanelFocus);

    el.resultCopy.addEventListener('click', function () {
      if (!currentResult) return;
      copyText(currentResult.text, 'Copied.');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el.result.getAttribute('data-open') === 'true') {
        closePanel();
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && scanState === 'live') {
        stopCamera();
        toast('Camera paused while the tab was away.');
      }
    });
  }

  /* ======================================================================
     CREATE
     ====================================================================== */
  var TYPES = [
    { id: 'text', name: 'Text / Link', icon: 'text' },
    { id: 'wifi', name: 'Wi-Fi', icon: 'wifi' },
    { id: 'contact', name: 'Contact', icon: 'contact' },
    { id: 'email', name: 'Email', icon: 'mail' },
    { id: 'phone', name: 'Phone', icon: 'phone' },
    { id: 'sms', name: 'Message', icon: 'sms' },
    { id: 'geo', name: 'Location', icon: 'geo' }
  ];

  var create = {
    type: 'text',
    ecc: 'M',
    size: 512,
    fg: '#17150f',
    bg: '#ffffff',
    logo: null,
    logoUrl: null,
    logoName: ''
  };

  var drafts = {};
  var lastText = '';
  var lastFields = null;
  var renderTimer = null;

  var ECC_HINTS = {
    L: 'Smallest code. Fine when it only ever appears on a screen.',
    M: 'Good default for anything printed normally.',
    Q: 'For stickers and things that get handled a lot.',
    H: 'Highest tolerance. Required when you add a logo.'
  };
  var SIZE_HINTS = {
    256: '256px — chat, screens, small stickers.',
    512: '512px — sharp on screen, fine for most printing.',
    1024: '1024px — posters and large formats.'
  };

  var FORMS = {
    text: function () {
      return '<div class="form-grid"><div class="field">' +
        '<label for="f_text">Text or link</label>' +
        '<textarea id="f_text" rows="4" placeholder="https://example.com or any text" spellcheck="false"></textarea>' +
        '</div></div>';
    },
    wifi: function () {
      return '<div class="form-grid">' +
        '<div class="field"><label for="f_ssid">Network name</label>' +
        '<input type="text" id="f_ssid" placeholder="Home-WiFi" autocomplete="off" autocapitalize="none" spellcheck="false"></div>' +
        '<div class="field"><label for="f_pass">Password</label>' +
        '<input type="password" id="f_pass" placeholder="Leave blank if the network is open" autocomplete="off"></div>' +
        '<div class="field-row">' +
        '<div class="field"><label for="f_sec">Security</label>' +
        '<select id="f_sec"><option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">None (open)</option></select></div>' +
        '<div class="field"><span class="field-label" aria-hidden="true">&nbsp;</span>' +
        '<label class="check"><input type="checkbox" id="f_hidden"> Hidden network</label></div>' +
        '</div></div>';
    },
    contact: function () {
      return '<div class="form-grid">' +
        '<div class="field"><label for="f_name">Full name</label>' +
        '<input type="text" id="f_name" placeholder="Alex Rivera" autocomplete="name"></div>' +
        '<div class="field-row">' +
        '<div class="field"><label for="f_phone">Phone</label>' +
        '<input type="tel" id="f_phone" placeholder="+1 555 0100" autocomplete="tel"></div>' +
        '<div class="field"><label for="f_email">Email</label>' +
        '<input type="email" id="f_email" placeholder="alex@example.com" autocomplete="email"></div>' +
        '</div>' +
        '<div class="field"><label for="f_org">Organization</label>' +
        '<input type="text" id="f_org" placeholder="Optional" autocomplete="organization"></div>' +
        '</div>';
    },
    email: function () {
      return '<div class="form-grid">' +
        '<div class="field"><label for="f_eto">To</label>' +
        '<input type="email" id="f_eto" placeholder="someone@example.com" autocomplete="email"></div>' +
        '<div class="field"><label for="f_esub">Subject</label>' +
        '<input type="text" id="f_esub" placeholder="Optional"></div>' +
        '<div class="field"><label for="f_ebody">Message</label>' +
        '<textarea id="f_ebody" rows="3" placeholder="Optional"></textarea></div>' +
        '</div>';
    },
    phone: function () {
      return '<div class="form-grid"><div class="field">' +
        '<label for="f_tel">Phone number</label>' +
        '<input type="tel" id="f_tel" placeholder="+1 555 0182" autocomplete="tel"></div></div>';
    },
    sms: function () {
      return '<div class="form-grid">' +
        '<div class="field"><label for="f_stel">Phone number</label>' +
        '<input type="tel" id="f_stel" placeholder="+1 555 0182" autocomplete="tel"></div>' +
        '<div class="field"><label for="f_smsg">Message</label>' +
        '<textarea id="f_smsg" rows="3" placeholder="Optional — leave blank to just open the chat"></textarea></div>' +
        '</div>';
    },
    geo: function () {
      return '<div class="form-grid">' +
        '<div class="field-row">' +
        '<div class="field"><label for="f_lat">Latitude</label>' +
        '<input type="text" id="f_lat" placeholder="51.5074" inputmode="decimal"></div>' +
        '<div class="field"><label for="f_lng">Longitude</label>' +
        '<input type="text" id="f_lng" placeholder="-0.1278" inputmode="decimal"></div>' +
        '</div>' +
        '<div class="field"><label for="f_place">Place name</label>' +
        '<input type="text" id="f_place" placeholder="Optional label"></div>' +
        '</div>';
    }
  };

  function val(id) {
    var n = $(id);
    return n ? n.value : '';
  }
  function setVal(id, v) {
    var n = $(id);
    if (n) n.value = v == null ? '' : v;
  }
  function isChecked(id) {
    var n = $(id);
    return !!(n && n.checked);
  }

  function readFields() {
    switch (create.type) {
      case 'text':
        return { text: val('f_text') };
      case 'wifi':
        return { ssid: val('f_ssid'), pass: val('f_pass'), sec: val('f_sec'), hidden: isChecked('f_hidden') };
      case 'contact':
        return { name: val('f_name'), phone: val('f_phone'), email: val('f_email'), org: val('f_org') };
      case 'email':
        return { to: val('f_eto'), sub: val('f_esub'), body: val('f_ebody') };
      case 'phone':
        return { tel: val('f_tel') };
      case 'sms':
        return { tel: val('f_stel'), msg: val('f_smsg') };
      case 'geo':
        return { lat: val('f_lat'), lng: val('f_lng'), label: val('f_place') };
    }
    return {};
  }

  function writeFields(f) {
    f = f || {};
    switch (create.type) {
      case 'text': setVal('f_text', f.text); break;
      case 'wifi':
        setVal('f_ssid', f.ssid);
        setVal('f_pass', '');
        setVal('f_sec', f.sec || 'WPA');
        if ($('f_hidden')) $('f_hidden').checked = !!f.hidden;
        break;
      case 'contact':
        setVal('f_name', f.name); setVal('f_phone', f.phone);
        setVal('f_email', f.email); setVal('f_org', f.org);
        break;
      case 'email':
        setVal('f_eto', f.to); setVal('f_esub', f.sub); setVal('f_ebody', f.body);
        break;
      case 'phone': setVal('f_tel', f.tel); break;
      case 'sms': setVal('f_stel', f.tel); setVal('f_smsg', f.msg); break;
      case 'geo': setVal('f_lat', f.lat); setVal('f_lng', f.lng); setVal('f_place', f.label); break;
    }
  }

  function renderTypeChips() {
    el.typeChips.innerHTML = '';
    TYPES.forEach(function (type) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('role', 'tab');
      b.setAttribute('data-type', type.id);
      b.setAttribute('aria-selected', type.id === create.type ? 'true' : 'false');
      b.innerHTML = svg(type.icon) + '<span></span>';
      b.querySelector('span').textContent = type.name;
      b.addEventListener('click', function () {
        if (create.type === type.id) return;
        drafts[create.type] = readFields();
        create.type = type.id;
        Array.prototype.forEach.call(el.typeChips.children, function (c) {
          c.setAttribute('aria-selected', c.getAttribute('data-type') === type.id ? 'true' : 'false');
        });
        renderForm(false);
        writeFields(drafts[type.id] || {});
        renderCreate();
      });
      el.typeChips.appendChild(b);
    });
  }

  function renderForm(focusFirst) {
    el.formArea.innerHTML = FORMS[create.type]();
    el.formArea.querySelectorAll('input, textarea, select').forEach(function (node) {
      node.addEventListener('input', scheduleRender);
      node.addEventListener('change', scheduleRender);
    });
    if (focusFirst) {
      var first = el.formArea.querySelector('input, textarea');
      if (first) first.focus();
    }
  }

  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderCreate, 160);
  }

  function setStatus(message, isError) {
    el.actionStatus.textContent = message || '';
    el.actionStatus.classList.toggle('is-error', !!isError);
  }

  function renderCreate() {
    var fields = readFields();
    var text = QR.build(create.type, fields);

    lastFields = fields;
    lastText = text;

    el.encodeError.hidden = true;
    el.contrastWarn.hidden = true;

    if (!text) {
      el.canvas.style.display = 'none';
      el.emptyState.style.display = '';
      el.actions.hidden = true;
      return;
    }

    var info = QR.draw(el.canvas, {
      text: text,
      ecc: create.ecc,
      size: create.size,
      fg: create.fg,
      bg: create.bg,
      logo: create.logo
    });

    if (!info.ok) {
      el.canvas.style.display = 'none';
      el.emptyState.style.display = 'none';
      el.actions.hidden = true;
      el.encodeError.hidden = false;
      return;
    }

    el.canvas.style.display = 'block';
    el.emptyState.style.display = 'none';
    el.actions.hidden = false;

    var warning = '';
    if (QR.contrast(create.fg, create.bg) < 3) {
      warning = 'Low contrast — this may not scan. Use a darker code colour or a lighter background.';
    } else if (QR.isInverted(create.fg, create.bg)) {
      warning = 'Inverted colours — a light code on a dark background often fails to scan, even with good contrast.';
    } else if (create.type === 'wifi' && fields.sec !== 'nopass' && !String(fields.pass || '').length) {
      warning = 'No password, but security is not set to "None" — this code will not be able to join the network.';
    } else if (info.atMaxSize) {
      warning = 'This is as dense as QR codes get. Shorten the content a little for a safety margin.';
    }

    if (warning) {
      el.contrastWarn.innerHTML = svg('warn') + '<span></span>';
      el.contrastWarn.querySelector('span').textContent = warning;
      el.contrastWarn.hidden = false;
    }
  }

  function setupCreateControls() {
    el.eccRow.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-ecc]');
      if (!b) return;
      create.ecc = b.getAttribute('data-ecc');
      Array.prototype.forEach.call(el.eccRow.children, function (node) {
        node.setAttribute('aria-pressed', node === b ? 'true' : 'false');
      });
      el.eccHint.textContent = ECC_HINTS[create.ecc];
      renderCreate();
    });

    el.sizeRow.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-size]');
      if (!b) return;
      create.size = parseInt(b.getAttribute('data-size'), 10);
      Array.prototype.forEach.call(el.sizeRow.children, function (node) {
        node.setAttribute('aria-pressed', node === b ? 'true' : 'false');
      });
      el.sizeHint.textContent = SIZE_HINTS[create.size];
      renderCreate();
    });

    el.fgColor.addEventListener('input', function () {
      create.fg = el.fgColor.value;
      renderCreate();
    });
    el.bgColor.addEventListener('input', function () {
      create.bg = el.bgColor.value;
      renderCreate();
    });

    el.swapColors.addEventListener('click', function () {
      var tmp = el.fgColor.value;
      el.fgColor.value = el.bgColor.value;
      el.bgColor.value = tmp;
      create.fg = el.fgColor.value;
      create.bg = el.bgColor.value;
      renderCreate();
    });

    el.logoInput.addEventListener('change', function () {
      var file = el.logoInput.files && el.logoInput.files[0];
      if (file) loadLogo(file);
      el.logoInput.value = '';
    });

    el.logoClear.addEventListener('click', function () {
      create.logo = null;
      create.logoUrl = null;
      create.logoName = '';
      el.logoName.textContent = '';
      el.logoClear.hidden = true;
      renderCreate();
    });

    el.dlPng.addEventListener('click', function () {
      if (!lastText) return;
      canvasBlob().then(function (blob) {
        if (!blob) return;
        downloadBlob(blob, 'qr-code.png');
        setStatus('Saved to your downloads.');
        rememberCreated();
      });
    });

    el.dlSvg.addEventListener('click', function () {
      if (!lastText) return;
      var markup = QR.toSvg({
        text: lastText,
        ecc: create.ecc,
        size: create.size,
        fg: create.fg,
        bg: create.bg,
        logoUrl: create.logoUrl
      });
      if (!markup) return;
      downloadBlob(new Blob([markup], { type: 'image/svg+xml' }), 'qr-code.svg');
      setStatus('Saved to your downloads.');
      rememberCreated();
    });

    el.copyBtn.addEventListener('click', function () {
      if (!lastText) return;
      if (!window.isSecureContext) {
        setStatus('Copying needs https (or localhost) — use Download instead.', true);
        return;
      }
      if (!navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
        setStatus('This browser cannot copy images — use Download instead.', true);
        return;
      }
      try {
        var item = new ClipboardItem({ 'image/png': canvasBlob() });
        navigator.clipboard.write([item]).then(function () {
          setStatus('Copied — paste it anywhere.');
          rememberCreated();
        }).catch(function () {
          setStatus('Could not copy — use Download instead.', true);
        });
      } catch (e) {
        setStatus('Could not copy — use Download instead.', true);
      }
    });

    el.shareBtn.addEventListener('click', function () {
      if (!lastText) return;
      canvasBlob().then(function (blob) {
        if (!blob) return;
        var file = null;
        try { file = new File([blob], 'qr-code.png', { type: 'image/png' }); } catch (e) {}
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: 'QR code' }).then(function () {
            rememberCreated();
          }).catch(function (err) {
            if (err && err.name === 'AbortError') return;
          });
        } else {
          downloadBlob(blob, 'qr-code.png');
          setStatus('This browser cannot share images — downloaded it instead.', true);
          rememberCreated();
        }
      });
    });

    if (!navigator.share) el.shareBtn.hidden = true;
  }

  var LOGO_MAX = 8 * 1024 * 1024;

  function loadLogo(file) {
    if (file.type && file.type.indexOf('image/') !== 0) {
      setStatus('That is not an image file.', true);
      return;
    }
    if (file.size > LOGO_MAX) {
      setStatus('That image is too large (max 8MB).', true);
      return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      var dataUrl = e.target.result;
      QR.loadImage(dataUrl).then(function (img) {
        create.logo = img;
        create.logoUrl = dataUrl;
        create.logoName = file.name;
        el.logoName.textContent = file.name;
        el.logoClear.hidden = false;

        if (create.ecc !== 'H') {
          create.ecc = 'H';
          Array.prototype.forEach.call(el.eccRow.children, function (node) {
            node.setAttribute('aria-pressed', node.getAttribute('data-ecc') === 'H' ? 'true' : 'false');
          });
          el.eccHint.textContent = ECC_HINTS.H + ' (switched automatically for the logo.)';
        }
        renderCreate();
      }).catch(function () {
        setStatus('That image could not be loaded.', true);
      });
    };
    reader.onerror = function () {
      setStatus('That image could not be read.', true);
    };
    reader.readAsDataURL(file);
  }

  function rememberCreated() {
    if (!lastText || !lastFields) return;
    var parsed = QR.parse(lastText);
    Store.history.add({
      kind: 'create',
      type: create.type,
      label: QR.label(parsed),
      text: lastText,
      fields: lastFields
    });
  }

  /* ======================================================================
     RECENT
     ====================================================================== */
  var recentFilter = 'all';

  function startOfDay(ts) {
    var d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function dayLabel(dayTs) {
    var today = startOfDay(Date.now());
    var oneDay = 86400000;
    if (dayTs === today) return 'Today';
    if (dayTs === today - oneDay) return 'Yesterday';
    var d = new Date(dayTs);
    var sameYear = d.getFullYear() === new Date().getFullYear();
    return d.toLocaleDateString(undefined, sameYear
      ? { weekday: 'long', day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function timeLabel(ts) {
    return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function renderRecent() {
    var list = Store.history.list();
    if (recentFilter !== 'all') {
      list = list.filter(function (item) { return item.kind === recentFilter; });
    }

    Array.prototype.forEach.call(el.recentFilter.children, function (b) {
      b.setAttribute('aria-selected', b.getAttribute('data-filter') === recentFilter ? 'true' : 'false');
    });

    if (!list.length) {
      el.recentList.innerHTML = '<div class="recent-empty"><strong>Nothing here yet</strong>' +
        (recentFilter === 'all'
          ? 'Codes you scan or create will appear here, on this device only.'
          : 'No ' + (recentFilter === 'scan' ? 'scanned' : 'created') + ' codes yet.') + '</div>';
      return;
    }

    el.recentList.innerHTML = '';
    var currentDay = null;
    var group = null;

    list.forEach(function (item) {
      var day = startOfDay(item.ts);
      if (day !== currentDay) {
        currentDay = day;
        group = document.createElement('div');
        group.className = 'recent-group';
        var title = document.createElement('p');
        title.className = 'recent-group-title';
        title.textContent = dayLabel(day);
        group.appendChild(title);
        el.recentList.appendChild(group);
      }

      var row = document.createElement('div');
      row.className = 'recent-item';

      var open = document.createElement('button');
      open.type = 'button';
      open.className = 'recent-open';

      var icon = document.createElement('span');
      icon.className = 'recent-icon';
      icon.innerHTML = svg(KIND_ICON[item.type] || 'text');

      var body = document.createElement('span');
      body.className = 'recent-text';
      var label = document.createElement('span');
      label.className = 'recent-label';
      label.textContent = item.label || 'Code';
      var meta = document.createElement('span');
      meta.className = 'recent-meta';
      meta.textContent = (item.kind === 'scan' ? 'Scanned' : 'Created') + ' \u00b7 ' + timeLabel(item.ts);
      body.appendChild(label);
      body.appendChild(meta);

      open.appendChild(icon);
      open.appendChild(body);
      open.addEventListener('click', function () { openHistoryItem(item); });

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'recent-del';
      remove.setAttribute('aria-label', 'Remove ' + (item.label || 'entry') + ' from history');
      remove.innerHTML = svg('close');
      remove.addEventListener('click', function () {
        Store.history.remove(item.id);
        renderRecent();
        toast('Removed from history.');
      });

      row.appendChild(open);
      row.appendChild(remove);
      group.appendChild(row);
    });
  }

  function openHistoryItem(item) {
    if (item.kind === 'scan') {
      go('scan');
      if (item.text) {
        showResult(item.text, false);
        return;
      }
      if (item.type === 'wifi' && item.fields) {
        /* Rebuild through the encoder so an SSID containing ; or , survives. */
        showResult(QR.build('wifi', item.fields), false);
        el.resultSub.textContent = (item.fields.sec || 'WPA') + ' \u00b7 password was not saved';
        el.resultSub.hidden = false;
        return;
      }
      toast('That entry has no stored content.');
      return;
    }

    create.type = item.type;
    renderTypeChips();
    renderForm(false);
    writeFields(item.fields || {});
    go('create');
    renderCreate();
  }

  function setupRecent() {
    el.recentFilter.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-filter]');
      if (!b) return;
      recentFilter = b.getAttribute('data-filter');
      renderRecent();
    });
  }

  /* ======================================================================
     SETTINGS
     ====================================================================== */
  var lastFocused = null;

  function updateHistoryCount() {
    var n = Store.history.count();
    el.histCount.textContent = n === 0 ? 'Nothing saved'
      : n + ' item' + (n === 1 ? '' : 's') + ' saved on this device';
  }

  function openSettings() {
    lastFocused = document.activeElement;
    updateHistoryCount();
    el.settingsSheet.setAttribute('data-open', 'true');
    el.settingsScrim.hidden = false;
    lockScroll(true);
    requestAnimationFrame(function () {
      el.settingsScrim.setAttribute('data-show', 'true');
    });
    el.settingsClose.focus();
  }

  function closeSettings() {
    el.settingsSheet.setAttribute('data-open', 'false');
    el.settingsScrim.setAttribute('data-show', 'false');
    lockScroll(false);
    setTimeout(function () { el.settingsScrim.hidden = true; }, 220);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function setupSettings() {
    el.settingsBtn.addEventListener('click', openSettings);
    el.settingsClose.addEventListener('click', closeSettings);
    el.settingsScrim.addEventListener('click', closeSettings);

    el.themeSeg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-theme]');
      if (!b) return;
      Store.set('theme', b.getAttribute('data-theme'));
      applySettings();
    });

    el.motionSeg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-motion]');
      if (!b) return;
      Store.set('motion', b.getAttribute('data-motion'));
      applySettings();
    });

    el.engineSeg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-engine]');
      if (!b) return;
      Store.set('engine', b.getAttribute('data-engine'));
      applySettings();
      /* The search action is built from the engine, so rebuild it in place. */
      if (currentResult) renderActions(currentResult);
    });

    var armed = false;
    var armTimer = null;

    el.clearHistBtn.addEventListener('click', function () {
      if (!armed) {
        armed = true;
        el.clearHistBtn.textContent = 'Sure?';
        clearTimeout(armTimer);
        armTimer = setTimeout(function () {
          armed = false;
          el.clearHistBtn.textContent = 'Clear';
        }, 2600);
        return;
      }
      clearTimeout(armTimer);
      armed = false;
      el.clearHistBtn.textContent = 'Clear';

      var backup = Store.history.clear();
      updateHistoryCount();
      renderRecent();

      toast('History cleared.', false, backup.length ? {
        label: 'Undo',
        run: function () {
          Store.history.restore(backup);
          updateHistoryCount();
          renderRecent();
          toast('History restored.');
        }
      } : null);
    });

    el.settingsSheet.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeSettings();
        return;
      }
      if (e.key !== 'Tab') return;

      var focusable = el.settingsSheet.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ======================================================================
     shared helpers
     ====================================================================== */
  function canvasBlob() {
    return new Promise(function (resolve) {
      el.canvas.toBlob(function (blob) { resolve(blob); }, 'image/png');
    });
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  /* ======================================================================
     init
     ====================================================================== */
  function detectFocusSupport() {
    var ok = true;
    try {
      ok = !!(window.CSS && window.CSS.supports && window.CSS.supports('selector(:focus-visible)'));
    } catch (e) {
      ok = false;
    }
    if (!ok) document.documentElement.classList.add('no-focus-visible');
  }

  function init() {
    detectFocusSupport();
    applySettings();
    setupTabs();
    setupScanControls();
    setupImageInput();
    setupCreateControls();
    setupRecent();
    setupSettings();

    renderTypeChips();
    renderForm(false);
    renderCreate();
    renderRecent();

    el.eccHint.textContent = ECC_HINTS.M;
    el.sizeHint.textContent = SIZE_HINTS[512];

    if (window.location.protocol === 'file:') {
      el.scanNote.textContent = 'Opened from disk, the camera is usually blocked. Upload a photo instead, ' +
        'or serve this folder over http to scan live.';
    }

    go('scan');

    /* Another tab edited history or settings: refresh what is on screen. */
    if (Store.onExternalChange) {
      Store.onExternalChange(function () {
        applySettings();
        renderRecent();
        updateHistoryCount();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
