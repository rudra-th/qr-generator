/* ==========================================================================
   Store — settings and history. localStorage only, never leaves the device.
   ========================================================================== */
(function (global) {
  'use strict';

  var SETTINGS_KEY = 'qr_settings_v1';
  var HISTORY_KEY = 'qr_history_v1';
  var LEGACY_THEME_KEY = 'qr_theme_v1';
  var MAX_ENTRIES = 200;

  var ENGINES = ['ddg', 'google', 'bing'];

  function readJSON(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- settings ---------- */
  function normalize(raw) {
    var s = raw || {};

    if (s.theme !== 'light' && s.theme !== 'dark' && s.theme !== 'system') {
      var legacy = null;
      try { legacy = global.localStorage.getItem(LEGACY_THEME_KEY); } catch (e) {}
      s.theme = (legacy === 'light' || legacy === 'dark') ? legacy : 'system';
    }
    if (s.motion !== 'system' && s.motion !== 'reduced') s.motion = 'system';
    if (ENGINES.indexOf(s.engine) === -1) s.engine = 'ddg';

    return s;
  }

  var settings = normalize(readJSON(SETTINGS_KEY, {}));

  var listeners = [];
  var externalListeners = [];

  function fire(list) {
    list.forEach(function (fn) {
      try { fn(settings); } catch (e) {}
    });
  }

  var Store = {
    get: function () {
      return { theme: settings.theme, motion: settings.motion, engine: settings.engine };
    },

    set: function (key, value) {
      settings[key] = value;
      writeJSON(SETTINGS_KEY, settings);
      fire(listeners);
    },

    resolvedTheme: function () {
      if (settings.theme === 'light' || settings.theme === 'dark') return settings.theme;
      return (global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'dark' : 'light';
    },

    onChange: function (fn) {
      listeners.push(fn);
    },

    /* Another tab changed something. Reload from disk and tell the app. */
    onExternalChange: function (fn) {
      externalListeners.push(fn);
    }
  };

  /* ---------- history ---------- */
  function load() {
    var list = readJSON(HISTORY_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function sameEntry(item, entry) {
    if (item.kind !== entry.kind || item.type !== entry.type) return false;
    /* Two different links on the same host share a label, so match on the
       payload itself. Wi-Fi entries have no text, and their label is unique. */
    return (item.text || item.label) === (entry.text || entry.label);
  }

  Store.history = {
    list: load,

    count: function () {
      return load().length;
    },

    add: function (entry) {
      var list = load();

      /* Wi-Fi secrets never reach disk. Enforced here as well as in the caller,
         so a future caller cannot accidentally persist a password. */
      if (entry.type === 'wifi') {
        entry.text = '';
        if (entry.fields) {
          entry.fields = { ssid: entry.fields.ssid, sec: entry.fields.sec, hidden: entry.fields.hidden };
        }
      }

      list = list.filter(function (item) { return !sameEntry(item, entry); });

      entry.id = 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      entry.ts = Date.now();
      list.unshift(entry);
      if (list.length > MAX_ENTRIES) list = list.slice(0, MAX_ENTRIES);

      writeJSON(HISTORY_KEY, list);
      return entry;
    },

    remove: function (id) {
      writeJSON(HISTORY_KEY, load().filter(function (item) { return item.id !== id; }));
    },

    /* Returns what was there, so the caller can offer an undo. */
    clear: function () {
      var list = load();
      try { global.localStorage.removeItem(HISTORY_KEY); } catch (e) {}
      return list;
    },

    restore: function (list) {
      if (!Array.isArray(list) || !list.length) return;
      writeJSON(HISTORY_KEY, list.slice(0, MAX_ENTRIES));
    }
  };

  /* ---------- cross-tab sync ---------- */
  if (global.addEventListener) {
    global.addEventListener('storage', function (e) {
      if (!e || !e.key) return;

      if (e.key === SETTINGS_KEY) {
        settings = normalize(readJSON(SETTINGS_KEY, {}));
        fire(listeners);
        fire(externalListeners);
      } else if (e.key === HISTORY_KEY) {
        fire(externalListeners);
      }
    });
  }

  global.Store = Store;
})(window);
