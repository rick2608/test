// Cada teste FALHA enquanto o bug existir. Rodar: node --test qa-bug-hunt/repros/prisma-bugs.test.js
const test = require('node:test'), assert = require('node:assert'), crypto = require('crypto');
const { load, html } = require('./_harness');

test('F1a: carrinho salvo com id inexistente trava a tela do carrinho', () => {
  const h = load({ storage: { pr_cart: '[99]' }, hash: '#carrinho' });
  assert.doesNotThrow(() => h.init());
});

test('F1b: biblioteca com id inexistente em "owned" trava a tela', () => {
  const h = load({ storage: { pr_owned: '[99]' }, hash: '#biblioteca' });
  assert.doesNotThrow(() => h.init());
});

test('F2: "Verificar pagamento" libera todos os titulos sem nenhum pagamento (config padrao)', () => {
  const h = load(); h.init();
  h.run('cart=[1,2,3,4,5,6];startPay()');
  h.click({ a: 'verify' });
  assert.equal(h.run('owned.length'), 0, 'titulos liberados sem pagamento: ' + h.run('owned.length'));
});

test('F3: segredo do codigo de admin esta na pagina publica e gera codigos aceitos', async () => {
  const sec = /TOTP_SECRET='([A-Z2-7]+)'/.exec(html)[1];
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const c of sec) bits += A.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const step = Math.floor(Date.now() / 30000), buf = Buffer.alloc(8); buf.writeUInt32BE(step, 4);
  const d = crypto.createHmac('sha1', key).update(buf).digest(), o = d[19] & 15;
  const code = String((((d[o] & 127) << 24) | (d[o + 1] << 16) | (d[o + 2] << 8) | d[o + 3]) % 1000000).padStart(6, '0');
  const h = load(); h.init();
  const ok = await h.run('checkCode("' + code + '")');
  assert.equal(ok, false, 'um codigo calculado so com o codigo-fonte publico foi aceito pelo login do admin');
});

test('F4: capitulos pagos podem ser lidos sem ter comprado (paywall so no cliente)', () => {
  const h = load(); h.init();
  h.run('read(3,0)');
  assert.ok(!/Cap\u00edtulo 1 de/.test(h.els.md.innerHTML), 'capitulo exibido para quem nao comprou');
});

test('F5: comprar um segundo livro apaga o pedido pendente do primeiro', () => {
  const h = load(); h.init();
  h.run('cart=[1];startPay()');
  h.run('cart=[2];startPay()');
  const o = [].concat(JSON.parse(h.store.pr_order));
  assert.ok(o.some(x => x.ids.includes(1)), 'pedido do livro 1 foi perdido; resta: ' + JSON.stringify(o.map(x => x.ids)));
});

test('F6: link para a Biblioteca some no celular (<=860px) e nao ha outro', () => {
  const hidden = /@media \(max-width:860px\)\{[^\n]*\.rt \.lib\{display:none\}/.test(html);
  const links = (html.match(/href="#biblioteca"/g) || []).length;
  assert.ok(!hidden || links >= 2, 'link oculto no mobile e unico link estatico (links=' + links + ')');
});

test('F7: clicar em adicionar/remover reenvia page_view e view_item ao Google Analytics', () => {
  const h = load({ hash: '#livro-1' }); h.init(); h.gaOn();
  h.click({ add: '1' });
  const n = h.calls.gtag.filter(a => a[1] === 'page_view' || a[1] === 'view_item').length;
  assert.equal(n, 0, 'eventos extras de pagina: ' + JSON.stringify(h.calls.gtag.map(a => a[1])));
});

test('F8: remover item do carrinho joga a pagina para o topo', () => {
  const h = load({ storage: { pr_cart: '[1,2]' }, hash: '#carrinho' }); h.init();
  h.calls.scrollTo = 0;
  h.click({ rm: '1' });
  assert.equal(h.calls.scrollTo, 0, 'scrollTo(0,0) chamado ' + h.calls.scrollTo + 'x ao remover item');
});

test('F9: total com ponto flutuante gera valores como 89.80000000000001', () => {
  const h = load(); h.init(); const bad = [];
  for (let m = 1; m < 64; m++) {
    const ids = [1, 2, 3, 4, 5, 6].filter((_, i) => m & (1 << i));
    h.run('cart=' + JSON.stringify(ids));
    const t = h.run('total()');
    if (Math.abs(t * 100 - Math.round(t * 100)) > 1e-7) bad.push({ ids, t });
  }
  assert.equal(bad.length, 0, bad.length + ' combinacoes com ruido; ex.: ' + JSON.stringify(bad.slice(0, 2)));
});

test('F10: forma 3D branca na pagina do livro 3 tem contraste < 3:1 no tema claro', () => {
  const h = load(); h.init();
  const c = h.run('hex("var(--ink)")'), bg = 0xffffff; // --bg2 do tema claro = #fff
  const L = n => [16, 8, 0].map(s => ((n >> s) & 255) / 255).map(v => (v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0);
  const r = (Math.max(L(c), L(bg)) + .05) / (Math.min(L(c), L(bg)) + .05);
  assert.ok(r >= 3, 'contraste ' + r.toFixed(2) + ':1');
});
