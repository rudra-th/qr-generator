/* ==========================================================================
   Tests for the pure parts of js/qr.js — payload building and parsing.

   Run with:  node --test
   No dependencies and no build step: this loads the same file the browser
   loads, in a vm context with a window shim.
   ========================================================================== */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'qr.js'), 'utf8');
const sandbox = vm.createContext({ console, URL });
sandbox.window = sandbox;
vm.runInContext(source, sandbox, { filename: 'js/qr.js' });
const QR = sandbox.QR;

/* ---------- build ---------- */

test('text is trimmed, and blank text builds nothing', () => {
  assert.equal(QR.build('text', { text: '  hello  ' }), 'hello');
  assert.equal(QR.build('text', { text: '   ' }), '');
  assert.equal(QR.build('text', {}), '');
});

test('wifi escapes separators and round-trips through parse', () => {
  const payload = QR.build('wifi', {
    ssid: 'Cafe;Free', pass: 'p:a;ss', sec: 'WPA', hidden: true
  });

  assert.equal(payload, 'WIFI:T:WPA;S:Cafe\\;Free;P:p\\:a\\;ss;H:true;;');

  const parsed = QR.parse(payload);
  assert.equal(parsed.kind, 'wifi');
  assert.equal(parsed.fields.ssid, 'Cafe;Free');
  assert.equal(parsed.fields.pass, 'p:a;ss');
  assert.equal(parsed.fields.sec, 'WPA');
  assert.equal(parsed.fields.hidden, true);
});

test('an open network carries no password field', () => {
  const payload = QR.build('wifi', { ssid: 'Cafe', pass: 'ignored', sec: 'nopass' });

  assert.equal(payload, 'WIFI:T:nopass;S:Cafe;;');
  assert.equal(QR.parse(payload).fields.pass, undefined);
});

test('wifi without a network name builds nothing', () => {
  assert.equal(QR.build('wifi', { ssid: '  ', pass: 'x' }), '');
});

test('contact escapes vCard punctuation and round-trips', () => {
  const fields = {
    name: 'Ada, Lovelace',
    org: 'Analytical; Engine',
    phone: '+1 555 0100',
    email: 'ada@example.com'
  };
  const payload = QR.build('contact', fields);

  assert.match(payload, /^BEGIN:VCARD\nVERSION:3\.0\n/);
  assert.match(payload, /FN:Ada\\, Lovelace/);
  assert.match(payload, /ORG:Analytical\\; Engine/);
  assert.match(payload, /END:VCARD$/);

  const parsed = QR.parse(payload);
  assert.equal(parsed.kind, 'contact');
  assert.equal(parsed.fields.name, fields.name);
  assert.equal(parsed.fields.org, fields.org);
  assert.equal(parsed.fields.phone, fields.phone);
  assert.equal(parsed.fields.email, fields.email);
});

test('contact without a name builds nothing', () => {
  assert.equal(QR.build('contact', { phone: '+1555' }), '');
});

test('email encodes the subject and body into the mailto link', () => {
  const payload = QR.build('email', { to: 'a@b.com', sub: 'Hi there', body: 'Line 1' });
  assert.equal(payload, 'mailto:a@b.com?subject=Hi%20there&body=Line%201');

  const parsed = QR.parse(payload);
  assert.equal(parsed.kind, 'email');
  assert.equal(parsed.title, 'a@b.com');
  assert.equal(parsed.href, payload);
});

test('email without a recipient builds nothing', () => {
  assert.equal(QR.build('email', { sub: 'Hi' }), '');
});

test('phone and sms build their URI schemes', () => {
  assert.equal(QR.build('phone', { tel: '+1 555 0182' }), 'tel:+1 555 0182');
  assert.equal(QR.build('sms', { tel: '+1555', msg: 'on my way' }), 'SMSTO:+1555:on my way');
  assert.equal(QR.build('phone', { tel: '' }), '');
  assert.equal(QR.build('sms', { tel: '' }), '');

  const phone = QR.parse('tel:+15550182');
  assert.equal(phone.kind, 'phone');
  assert.equal(phone.title, '+15550182');

  const sms = QR.parse('SMSTO:+1555:on my way');
  assert.equal(sms.kind, 'sms');
  assert.equal(sms.title, '+1555');
  assert.equal(sms.subtitle, 'on my way');
});

test('geo keeps coordinates and an optional label', () => {
  const payload = QR.build('geo', { lat: '51.5', lng: '-0.12', label: 'Home' });
  assert.equal(payload, 'geo:51.5,-0.12?q=51.5,-0.12(Home)');

  const parsed = QR.parse(payload);
  assert.equal(parsed.kind, 'geo');
  assert.equal(parsed.fields.lat, '51.5');
  assert.equal(parsed.fields.lng, '-0.12');
  assert.match(parsed.href, /^https:\/\/maps\.google\.com\/\?q=/);

  assert.equal(QR.build('geo', { lat: '51.5' }), '');
});

/* ---------- parse ---------- */

test('links are recognised with and without a scheme', () => {
  const withScheme = QR.parse('https://example.com/a?b=1');
  assert.equal(withScheme.kind, 'url');
  assert.equal(withScheme.href, 'https://example.com/a?b=1');
  assert.equal(withScheme.title, 'example.com');
  assert.equal(withScheme.subtitle, '/a?b=1');

  const bare = QR.parse('www.example.com');
  assert.equal(bare.kind, 'url');
  assert.equal(bare.href, 'https://www.example.com');
});

test('other schemes keep their kind', () => {
  assert.equal(QR.parse('mailto:a@b.com?subject=Hi').kind, 'email');
  assert.equal(QR.parse('MATMSG:TO:a@b.com;SUB:Hi;BODY:Body;;').kind, 'email');
  assert.equal(QR.parse('sms:+1555?body=hi').kind, 'sms');
  assert.equal(QR.parse('SMSTO:+1555:hi').kind, 'sms');
  assert.equal(QR.parse('tel:+1555').kind, 'phone');
  assert.equal(QR.parse('geo:51.5,-0.12').kind, 'geo');
  assert.equal(QR.parse('WIFI:T:WPA;S:Home;P:pw;;').kind, 'wifi');
  assert.equal(QR.parse('BEGIN:VCARD\nFN:Ada\nEND:VCARD').kind, 'contact');
  assert.equal(QR.parse('just some words').kind, 'text');
});

test('custom schemes are recognised as app links', () => {
  const bitcoin = QR.parse('bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
  assert.equal(bitcoin.kind, 'app');
  assert.equal(bitcoin.title, 'bitcoin');
  assert.equal(bitcoin.href, 'bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
  assert.match(bitcoin.subtitle, /^bc1q/);

  const upi = QR.parse('upi://pay?pa=shop@upi&am=10');
  assert.equal(upi.kind, 'app');
  assert.equal(upi.title, 'upi');

  assert.equal(QR.parse('spotify:track:abc').kind, 'app');
  assert.equal(QR.label(QR.parse('whatsapp://send?text=hi')), 'App link \u00b7 whatsapp');
});

test('dangerous schemes stay plain text', () => {
  [
    'javascript:alert(1)',
    'data:text/html,<b>x</b>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'blob:https://example.com/abc',
    'about:blank',
    'chrome://settings',
    'view-source:https://example.com',
    'content://com.example/secret',
    'intent://scan/#Intent;scheme=zxing;end',
    'android-app://com.example'
  ].forEach((payload) => {
    assert.equal(QR.parse(payload).kind, 'text', payload);
  });

  /* A drive letter is not a scheme, and a lone colon is not an app link. */
  assert.equal(QR.parse('C:\\Users\\me\\notes.txt').kind, 'text');
  assert.equal(QR.parse('bitcoin:').kind, 'text');

  /* A host and a port is not a scheme called "localhost". */
  assert.equal(QR.parse('localhost:3000').kind, 'text');
  assert.equal(QR.parse('intranet:8080').kind, 'text');
  assert.equal(QR.parse('example.com:8080/x').kind, 'text');
  assert.equal(QR.parse('bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2').kind, 'app');
});

test('host-shaped text is offered as a guessed link', () => {
  const accepted = {
    'localhost:3000': 'http://localhost:3000',
    'localhost': 'http://localhost',
    '192.168.1.1': 'http://192.168.1.1',
    '10.0.0.5/admin': 'http://10.0.0.5/admin',
    'myrouter.local': 'http://myrouter.local',
    'foo.internal/path': 'http://foo.internal/path',
    'example.zzz': 'https://example.zzz',
    'example.com': 'https://example.com'
  };
  Object.keys(accepted).forEach((input) => {
    assert.equal(QR.looksLikeHost(input), accepted[input], input);
  });

  [
    '',
    'meeting notes',
    'notes.txt',
    'README.md',
    'a@b.com',
    'https://example.com',
    '999.1.1.1',
    'v1.2.3',
    'foo..com',
    '[::1]:3000',
    'intranet',
    'C:\\Users'
  ].forEach((input) => {
    assert.equal(QR.looksLikeHost(input), '', input);
  });
});

test('an empty code is reported as such', () => {
  const parsed = QR.parse('');
  assert.equal(parsed.kind, 'text');
  assert.equal(parsed.title, 'Empty code');
});

test('MATMSG fills the mailto href with subject and body', () => {
  const parsed = QR.parse('MATMSG:TO:a@b.com;SUB:Hi;BODY:Body text;;');
  assert.equal(parsed.href, 'mailto:a@b.com?subject=Hi&body=Body%20text');
});

/* ---------- domain detection ---------- */

test('looksLikeDomain accepts real domains and rejects near misses', () => {
  const accepted = {
    'example.com': 'https://example.com',
    'sub.example.co.uk/path?q=1': 'https://sub.example.co.uk/path?q=1',
    'example.com:8080/x': 'https://example.com:8080/x'
  };
  Object.keys(accepted).forEach((input) => {
    assert.equal(QR.looksLikeDomain(input), accepted[input], input);
  });

  [
    '',
    'notes.txt',
    '192.168.1.1',
    'localhost:3000',
    'not a domain',
    'https://example.com'
  ].forEach((input) => {
    assert.equal(QR.looksLikeDomain(input), '', input);
  });
});

/* ---------- labels and colour ---------- */

test('history labels name the kind and the title', () => {
  assert.equal(QR.label(QR.parse('https://example.com')), 'Link \u00b7 example.com');
  assert.equal(QR.label(QR.parse('hello')), 'Text \u00b7 hello');
  assert.equal(QR.label(null), '');
});

test('contrast and inversion match the eye', () => {
  assert.ok(QR.contrast('#000000', '#ffffff') > 20);
  assert.ok(QR.contrast('#777777', '#ffffff') < 5);
  assert.equal(QR.isInverted('#ffffff', '#000000'), true);
  assert.equal(QR.isInverted('#000000', '#ffffff'), false);
});
