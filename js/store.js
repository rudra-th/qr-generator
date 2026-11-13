/* ==========================================================================
   Store — settings and history. localStorage only, never leaves the device.
   ========================================================================== */
(function (global) {
  'use strict';

  var SETTINGS_KEY = 'qr_settings_v1';
  var HISTORY_KEY = 'qr_history_v1';
  var LEGACY_THEME_KEY = 'qr_theme_v1';
  var MAX_ENTRIES = 200;

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
  var settings = readJSON(SETTINGS_KEY, {}) || {};

  if (settings.theme !== 'light' && settings.theme !== 'dark' && settings.theme !== 'system') {
    var legacy = null;
    try { legacy = global.localStorage.getItem(LEGACY_THEME_KEY); } catch (e) {}
    settings.theme = (legacy === 'light' || legacy === 'dark') ? legacy : 'system';
  }
  if (settings.motion !== 'system' && settings.motion !== 'reduced') settings.motion = 'system';

  var listeners = [];

  var Store = {
    get: function () {
      return { theme: settings.theme, motion: settings.motion };
    },

    set: function (key, value) {
      settings[key] = value;
      writeJSON(SETTINGS_KEY, settings);
      listeners.forEach(function (fn) {
        try { fn(settings); } catch (e) {}
      });
    },

    resolvedTheme: function () {
      if (settings.theme === 'light' || settings.theme === 'dark') return settings.theme;
      return (global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'dark' : 'light';
    },

    onChange: function (fn) {
      listeners.push(fn);
    }
  };

  /* ---------- history ---------- */
  function load() {
    var list = readJSON(HISTORY_KEY, []);
    return Array.isArray(list) ? list : [];
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

      list = list.filter(function (item) {
        return !(item.kind === entry.kind && item.type === entry.type && item.label === entry.label);
      });

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

    clear: function () {
      try { global.localStorage.removeItem(HISTORY_KEY); } catch (e) {}
    }
  };

  global.Store = Store;
})(window);
