// Carrega o <script> principal do alvo em um sandbox do Node, com um DOM mínimo simulado.
// Somente leitura: o arquivo do alvo nunca é alterado.
const fs = require('fs'), vm = require('vm');
const FILE = process.env.TARGET || '/mnt/user-data/outputs/prisma-webbooks.html';
const html = fs.readFileSync(FILE, 'utf8');

function load(opts = {}) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const code = scripts[scripts.length - 1][1];
  const store = Object.assign({}, opts.storage || {});
  const calls = { scrollTo: 0, scrollIntoView: 0, gtag: [], open: [] };
  const els = {};
  const el = id => els[id] || (els[id] = {
    id, innerHTML: '', textContent: '', value: '', href: '', dataset: {},
    style: { setProperty() {}, removeProperty() {} },
    classList: { add() {}, remove() {} },
    appendChild() {}, remove() {}, focus() {},
    scrollIntoView() { calls.scrollIntoView++; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1, height: 1 }; }
  });
  const doc = {
    _l: {}, title: 't', activeElement: null, head: { appendChild() {} },
    getElementById: el, createElement() { return {}; }, querySelectorAll() { return []; },
    addEventListener(t, f) { (doc._l[t] = doc._l[t] || []).push(f); }
  };
  const RealDate = Date;
  const FakeDate = Object.assign(function () { return new RealDate(); }, { now: () => (opts.now != null ? opts.now : RealDate.now()) });
  const sb = {
    document: doc, console, Promise, Math, JSON, Date: FakeDate, crypto: globalThis.crypto,
    TextEncoder, Uint8Array, ArrayBuffer, DataView, String, Number, Array, Object, RegExp,
    parseInt, isNaN, encodeURIComponent, setTimeout,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    location: { hash: opts.hash || '', href: 'http://localhost/' },
    innerWidth: 1200, innerHeight: 800, devicePixelRatio: 1,
    matchMedia: () => ({ matches: true }),
    addEventListener() {}, removeEventListener() {}, cancelAnimationFrame() {}, requestAnimationFrame() { return 0; },
    scrollTo() { calls.scrollTo++; },
    open(u) { calls.open.push(u); }
  };
  sb.window = sb;
  vm.createContext(sb);
  return {
    sb, store, calls, doc, els,
    init() { vm.runInContext(code, sb); },
    run(c) { return vm.runInContext(c, sb); },
    // simula um clique em um <button> com os data-* informados (usa o listener real de clique do alvo)
    click(dataset) {
      const btn = { dataset };
      doc._l.click[0]({ target: { id: '', closest: s => (s === 'button' ? btn : null) } });
    },
    gaOn() { vm.runInContext('CFG.gaId="G-TEST"', sb); sb.gtag = (...a) => calls.gtag.push(a); }
  };
}
module.exports = { load, html, FILE };
