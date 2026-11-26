// Testes que devem PASSAR: confirmam partes corretas do alvo (evita falso positivo).
const test = require('node:test'), assert = require('node:assert');
const { load } = require('./_harness');
const RFC = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'; // segredo "12345678901234567890" da RFC 6238

test('TOTP bate com os vetores da RFC 6238 (SHA-1)', async () => {
  const h = load(); h.init(); h.run("TOTP_SECRET='" + RFC + "'");
  assert.equal(await h.run('totp(1)'), '287082');          // T=59
  assert.equal(await h.run('totp(37037036)'), '081804');   // T=1111111109
});

test('checkCode aceita passo atual e anterior, recusa passo +2 e codigo errado', async () => {
  const h = load({ now: 59000 }); h.init(); h.run("TOTP_SECRET='" + RFC + "'");
  assert.equal(await h.run('checkCode("287082")'), true);
  assert.equal(await h.run('checkCode("000000")'), false);
  const c3 = await h.run('totp(3)');
  assert.equal(await h.run('checkCode("' + c3 + '")'), false);
});

test('esc() neutraliza HTML em valores exibidos', () => {
  const h = load(); h.init();
  assert.equal(h.run('esc("<img src=x onerror=1>\\"\'&")').includes('<'), false);
});
